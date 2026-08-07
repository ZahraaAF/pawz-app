import { describe, expect, it, vi, beforeEach } from "vitest";

const requireUser = vi.fn(async () => ({ id: "user-1" }));
vi.mock("@/lib/auth/dal", () => ({ requireUser: () => requireUser() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const maybeSingle = vi.fn();
const insert = vi.fn();
const upload = vi.fn();
const remove = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === "pets") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) };
      }
      if (table === "symptom_entries") {
        return { insert };
      }
      throw new Error(`Unexpected table ${table}`);
    },
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: "fake-token" } } })) },
  })),
}));

// uploadAttachment/removeAttachments build a one-off @supabase/supabase-js
// client for Storage calls (see the comment in lib/storage/attachments.ts
// on why the shared SSR client's .storage can't be trusted) - mock that
// factory directly rather than the server client's .storage.
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: { from: () => ({ upload, remove }) },
  })),
}));

const { createSymptomEntry } = await import("./actions");

// Mirrors what a <input type="datetime-local"> actually produces: local
// clock digits, no timezone suffix - toISOString() would give UTC digits
// instead, which silently drifts by the local UTC offset when re-parsed.
function toLocalDateTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const PAST = toLocalDateTimeValue(new Date(Date.now() - 60 * 60 * 1000));

function formData(overrides: Record<string, string> = {}, photo?: File) {
  const fd = new FormData();
  fd.set("description", overrides.description ?? "Limping on back leg");
  fd.set("occurred_at", overrides.occurred_at ?? PAST);
  fd.set("severity", overrides.severity ?? "mild");
  if (photo) fd.set("photo", photo);
  return fd;
}

describe("createSymptomEntry", () => {
  beforeEach(() => {
    requireUser.mockClear();
    maybeSingle.mockReset().mockResolvedValue({ data: { id: "pet-1" } });
    insert.mockReset().mockResolvedValue({ error: null });
    upload.mockReset().mockResolvedValue({ error: null });
    remove.mockReset().mockResolvedValue({ error: null });
  });

  it("logs a symptom with no photo", async () => {
    const result = await createSymptomEntry("pet-1", null, formData());

    expect(result).toEqual({ success: "Symptom logged." });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        pet_id: "pet-1",
        description: "Limping on back leg",
        severity: "mild",
        photo_path: null,
      }),
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it("uploads a photo before inserting when one is attached", async () => {
    const photo = new File(["fake"], "leg.jpg", { type: "image/jpeg" });
    const result = await createSymptomEntry("pet-1", null, formData({}, photo));

    expect(result).toEqual({ success: "Symptom logged." });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ photo_path: expect.stringMatching(/^pet-1\/symptoms\/.+\.jpg$/) }),
    );
  });

  it("cleans up the uploaded photo if the insert fails afterward", async () => {
    const photo = new File(["fake"], "leg.jpg", { type: "image/jpeg" });
    insert.mockResolvedValue({ error: { message: "insert failed" } });

    const result = await createSymptomEntry("pet-1", null, formData({}, photo));

    expect(result).toEqual({ error: "insert failed" });
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove.mock.calls[0][0][0]).toMatch(/^pet-1\/symptoms\/.+\.jpg$/);
  });

  it("does not attempt cleanup when there was never a photo to remove", async () => {
    insert.mockResolvedValue({ error: { message: "insert failed" } });

    const result = await createSymptomEntry("pet-1", null, formData());

    expect(result).toEqual({ error: "insert failed" });
    expect(remove).not.toHaveBeenCalled();
  });

  it("rejects a disallowed photo MIME type without ever uploading", async () => {
    const photo = new File(["fake"], "leg.gif", { type: "image/gif" });
    const result = await createSymptomEntry("pet-1", null, formData({}, photo));

    expect(result).toEqual({ error: "Photo must be a JPG, PNG, or HEIC image." });
    expect(upload).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects an oversized photo without ever uploading", async () => {
    const big = new Uint8Array(11 * 1024 * 1024);
    const photo = new File([big], "leg.jpg", { type: "image/jpeg" });
    const result = await createSymptomEntry("pet-1", null, formData({}, photo));

    expect(result).toEqual({ error: "Photo must be under 10MB." });
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects an empty description before touching the database", async () => {
    const result = await createSymptomEntry("pet-1", null, formData({ description: "  " }));

    expect(result).toEqual({ error: "Description is required." });
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("rejects a future date/time", async () => {
    const future = toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000));
    const result = await createSymptomEntry("pet-1", null, formData({ occurred_at: future }));

    expect(result).toEqual({ error: "Date/time can't be in the future." });
  });

  it("returns a clean error instead of an opaque RLS denial when the pet isn't the caller's", async () => {
    maybeSingle.mockResolvedValue({ data: null });

    const result = await createSymptomEntry("someone-elses-pet", null, formData());

    expect(result).toEqual({ error: "Pet not found." });
    expect(insert).not.toHaveBeenCalled();
  });
});
