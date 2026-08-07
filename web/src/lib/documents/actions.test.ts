import { describe, expect, it, vi, beforeEach } from "vitest";

const requireUser = vi.fn(async () => ({ id: "user-1" }));
vi.mock("@/lib/auth/dal", () => ({ requireUser: () => requireUser() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const petsMaybeSingle = vi.fn();
const careEventMaybeSingle = vi.fn();
const symptomMaybeSingle = vi.fn();
const documentsInsert = vi.fn();
const documentsSelectMaybeSingle = vi.fn();
const documentsDeleteEq = vi.fn();

const upload = vi.fn();
const remove = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === "pets") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: petsMaybeSingle }) }) }) };
      }
      if (table === "care_events") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: careEventMaybeSingle }) }) }) };
      }
      if (table === "symptom_entries") {
        return { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: symptomMaybeSingle }) }) }) };
      }
      if (table === "documents") {
        return {
          insert: documentsInsert,
          select: () => ({ eq: () => ({ maybeSingle: documentsSelectMaybeSingle }) }),
          delete: () => ({ eq: documentsDeleteEq }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
    auth: { getSession: vi.fn(async () => ({ data: { session: { access_token: "fake-token" } } })) },
  })),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: { from: () => ({ upload, remove }) },
  })),
}));

const { uploadDocument, deleteDocument } = await import("./actions");

function uploadFormData(overrides: Record<string, string> = {}, file?: File) {
  const fd = new FormData();
  fd.set("link", overrides.link ?? "none");
  fd.set("file", file ?? new File(["fake"], "cert.pdf", { type: "application/pdf" }));
  return fd;
}

describe("uploadDocument", () => {
  beforeEach(() => {
    requireUser.mockClear();
    petsMaybeSingle.mockReset().mockResolvedValue({ data: { id: "pet-1" } });
    careEventMaybeSingle.mockReset().mockResolvedValue({ data: { id: "event-1" } });
    symptomMaybeSingle.mockReset().mockResolvedValue({ data: { id: "symptom-1" } });
    documentsInsert.mockReset().mockResolvedValue({ error: null });
    upload.mockReset().mockResolvedValue({ error: null });
    remove.mockReset().mockResolvedValue({ error: null });
  });

  it("uploads a document with no link", async () => {
    const result = await uploadDocument("pet-1", null, uploadFormData());

    expect(result).toEqual({ success: "Document uploaded." });
    expect(documentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        pet_id: "pet-1",
        filename: "cert.pdf",
        mime_type: "application/pdf",
        care_event_id: null,
        symptom_entry_id: null,
      }),
    );
  });

  it("uploads a document linked to a care event", async () => {
    const result = await uploadDocument("pet-1", null, uploadFormData({ link: "care_event:event-1" }));

    expect(result).toEqual({ success: "Document uploaded." });
    expect(careEventMaybeSingle).toHaveBeenCalled();
    expect(documentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ care_event_id: "event-1", symptom_entry_id: null }),
    );
  });

  it("uploads a document linked to a symptom entry", async () => {
    const result = await uploadDocument(
      "pet-1",
      null,
      uploadFormData({ link: "symptom_entry:symptom-1" }),
    );

    expect(result).toEqual({ success: "Document uploaded." });
    expect(symptomMaybeSingle).toHaveBeenCalled();
    expect(documentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ care_event_id: null, symptom_entry_id: "symptom-1" }),
    );
  });

  it("rejects a link to a care event that isn't this pet's", async () => {
    careEventMaybeSingle.mockResolvedValue({ data: null });

    const result = await uploadDocument("pet-1", null, uploadFormData({ link: "care_event:foreign" }));

    expect(result).toEqual({ error: "Selected care event not found." });
    expect(upload).not.toHaveBeenCalled();
    expect(documentsInsert).not.toHaveBeenCalled();
  });

  it("rejects a link to a symptom entry that isn't this pet's", async () => {
    symptomMaybeSingle.mockResolvedValue({ data: null });

    const result = await uploadDocument(
      "pet-1",
      null,
      uploadFormData({ link: "symptom_entry:foreign" }),
    );

    expect(result).toEqual({ error: "Selected symptom entry not found." });
    expect(upload).not.toHaveBeenCalled();
  });

  it("requires a file", async () => {
    const fd = new FormData();
    fd.set("link", "none");
    const result = await uploadDocument("pet-1", null, fd);

    expect(result).toEqual({ error: "Please choose a file." });
    expect(upload).not.toHaveBeenCalled();
  });

  it.each(["image/jpeg", "image/png", "image/heic", "image/heif", "application/pdf"])(
    "accepts an allowed MIME type: %s",
    async (mimeType) => {
      const file = new File(["fake"], "file", { type: mimeType });
      const result = await uploadDocument("pet-1", null, uploadFormData({}, file));

      expect(result).toEqual({ success: "Document uploaded." });
      expect(upload).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects a disallowed MIME type without ever uploading", async () => {
    const file = new File(["fake"], "notes.txt", { type: "text/plain" });
    const result = await uploadDocument("pet-1", null, uploadFormData({}, file));

    expect(result).toEqual({ error: "File must be a JPG, PNG, HEIC, or PDF." });
    expect(upload).not.toHaveBeenCalled();
  });

  it("rejects an oversized file without ever uploading", async () => {
    const big = new Uint8Array(11 * 1024 * 1024);
    const file = new File([big], "big.pdf", { type: "application/pdf" });
    const result = await uploadDocument("pet-1", null, uploadFormData({}, file));

    expect(result).toEqual({ error: "File must be under 10MB." });
    expect(upload).not.toHaveBeenCalled();
  });

  it("cleans up the uploaded file if the insert fails afterward", async () => {
    documentsInsert.mockResolvedValue({ error: { message: "insert failed" } });

    const result = await uploadDocument("pet-1", null, uploadFormData());

    expect(result).toEqual({ error: "insert failed" });
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("returns a clean error instead of an opaque RLS denial when the pet isn't the caller's", async () => {
    petsMaybeSingle.mockResolvedValue({ data: null });

    const result = await uploadDocument("someone-elses-pet", null, uploadFormData());

    expect(result).toEqual({ error: "Pet not found." });
    expect(upload).not.toHaveBeenCalled();
    expect(documentsInsert).not.toHaveBeenCalled();
  });
});

describe("deleteDocument", () => {
  beforeEach(() => {
    requireUser.mockClear();
    documentsSelectMaybeSingle
      .mockReset()
      .mockResolvedValue({ data: { id: "doc-1", pet_id: "pet-1", file_path: "pet-1/documents/doc-1.pdf" } });
    documentsDeleteEq.mockReset().mockResolvedValue({ error: null });
    remove.mockReset().mockResolvedValue({ error: null });
  });

  it("deletes the DB row then removes the Storage object", async () => {
    await expect(deleteDocument("doc-1")).resolves.toBeUndefined();

    expect(documentsDeleteEq).toHaveBeenCalledWith("id", "doc-1");
    expect(remove).toHaveBeenCalledWith(["pet-1/documents/doc-1.pdf"]);
  });

  it("throws and never touches Storage when the document isn't found", async () => {
    documentsSelectMaybeSingle.mockResolvedValue({ data: null });

    await expect(deleteDocument("missing-doc")).rejects.toThrow("Document not found.");
    expect(documentsDeleteEq).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("throws and never touches Storage when the DB delete fails", async () => {
    documentsDeleteEq.mockResolvedValue({ error: { message: "delete failed" } });

    await expect(deleteDocument("doc-1")).rejects.toThrow("delete failed");
    expect(remove).not.toHaveBeenCalled();
  });

  it("still resolves if the best-effort Storage removal fails after a successful DB delete", async () => {
    remove.mockResolvedValue({ error: { message: "storage remove failed" } });

    await expect(deleteDocument("doc-1")).resolves.toBeUndefined();
  });
});
