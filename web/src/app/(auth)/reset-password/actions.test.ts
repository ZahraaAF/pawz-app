import { describe, expect, it, vi, beforeEach } from "vitest";

const updateUser = vi.fn();
const signOut = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { updateUser, signOut },
  })),
}));

vi.mock("next/navigation", () => ({ redirect }));

const { updateUser: updateUserAction } = await import("./actions");

function formData(password: string, confirmPassword: string) {
  const fd = new FormData();
  fd.set("password", password);
  fd.set("confirmPassword", confirmPassword);
  return fd;
}

describe("updateUser (reset-password action)", () => {
  beforeEach(() => {
    updateUser.mockReset();
    signOut.mockReset();
    redirect.mockClear();
  });

  it("signs out and sends the user to log in again after a successful reset", async () => {
    updateUser.mockResolvedValue({ error: null });

    await expect(
      updateUserAction(null, formData("newpassword123", "newpassword123")),
    ).rejects.toThrow("REDIRECT:/login?message=password-updated");

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/login?message=password-updated");
  });

  it("does not sign out or redirect if Supabase rejects the new password", async () => {
    updateUser.mockResolvedValue({ error: { message: "Weak password" } });

    const result = await updateUserAction(
      null,
      formData("newpassword123", "newpassword123"),
    );

    expect(result).toEqual({ error: "Weak password" });
    expect(signOut).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("never calls Supabase when the two passwords don't match", async () => {
    const result = await updateUserAction(
      null,
      formData("newpassword123", "somethingelse"),
    );

    expect(result).toEqual({ error: "Passwords don't match." });
    expect(updateUser).not.toHaveBeenCalled();
  });
});
