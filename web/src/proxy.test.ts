import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: { getUser } })),
}));

const { proxy } = await import("./proxy");

function requestFor(pathname: string) {
  return new NextRequest(new URL(`http://localhost:3000${pathname}`));
}

describe("proxy", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("sends a logged-out visitor away from a protected path", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await proxy(requestFor("/dashboard"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("bounces an already-logged-in user away from /login to /dashboard", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const res = await proxy(requestFor("/login"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("lets a logged-in user reach /reset-password without bouncing", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

    const res = await proxy(requestFor("/reset-password"));

    expect(res.status).toBe(200);
  });

  it("lets a logged-out visitor reach /login normally", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const res = await proxy(requestFor("/login"));

    expect(res.status).toBe(200);
  });
});
