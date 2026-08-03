import { describe, expect, it, vi, beforeEach } from "vitest";

const exchangeCodeForSession = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession, signOut },
  })),
}));

const { GET } = await import("./route");

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    signOut.mockReset();
  });

  it("redirects to `next` and does not sign out on a valid code", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });

    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=valid&next=/reset-password"),
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/reset-password");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out and redirects to /login with an error on a reused/expired code", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid flow state" },
    });

    const res = await GET(
      new Request("http://localhost:3000/auth/callback?code=stale&next=/reset-password"),
    );

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth-callback-failed",
    );
  });
});
