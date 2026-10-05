import { describe, it, expect, vi } from "vitest";
import { ApiClient, ApiError, queryString } from "../src/api/client";
const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, message: "OK", data }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
const denied = () =>
  new Response(
    JSON.stringify({ success: false, message: "Expired", errors: [] }),
    { status: 401, headers: { "content-type": "application/json" } },
  );
describe("API adapter", () => {
  it("unwraps one envelope and retains pagination", async () => {
    const page = {
      meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
      data: [{ id: "x" }],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok(page)));
    expect(
      await new ApiClient().request("/services", { public: true }),
    ).toEqual(page);
  });
  it("serializes simultaneous refreshes and replaces both tokens", async () => {
    const client = new ApiClient();
    client.setTokens({ accessToken: "old", refreshToken: "old-r" });
    let refreshes = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith("/refresh-token")) {
          refreshes++;
          await new Promise((r) => setTimeout(r, 10));
          return ok({ accessToken: "new", refreshToken: "new-r" });
        }
        return (init.headers as Record<string, string>).Authorization ===
          "Bearer old"
          ? denied()
          : ok({ id: 1 });
      }),
    );
    await Promise.all([
      client.request("/users/me"),
      client.request("/bookings/me"),
    ]);
    expect(refreshes).toBe(1);
    expect(client.getTokens()).toEqual({
      accessToken: "new",
      refreshToken: "new-r",
    });
  });
  it("does not resurrect session when refresh resolves after logout", async () => {
    const client = new ApiClient();
    client.setTokens({ accessToken: "old", refreshToken: "r" });
    let resolve!: (r: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.endsWith("/refresh-token")
          ? new Promise<Response>((r) => {
              resolve = r;
            })
          : Promise.resolve(denied()),
      ),
    );
    const request = client.request("/auth/me");
    await vi.waitFor(() => expect(resolve).toBeDefined());
    client.setTokens(null);
    resolve(ok({ accessToken: "late", refreshToken: "late-r" }));
    await expect(request).rejects.toThrow("Session changed");
    expect(client.getTokens()).toBeNull();
  });
  it("expires on refresh failure without recursive retry", async () => {
    const client = new ApiClient();
    client.setTokens({ accessToken: "old", refreshToken: "r" });
    const expired = vi.fn();
    client.onExpired = expired;
    const fetcher = vi.fn().mockImplementation(async () => denied());
    vi.stubGlobal("fetch", fetcher);
    await expect(client.request("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(expired).toHaveBeenCalledOnce();
    expect(client.getTokens()).toBeNull();
  });
  it("retries a protected request only once", async () => {
    const client = new ApiClient();
    client.setTokens({ accessToken: "old", refreshToken: "r" });
    const fetcher = vi.fn(async (url: string) =>
      url.endsWith("/refresh-token")
        ? ok({ accessToken: "new", refreshToken: "new-r" })
        : denied(),
    );
    vi.stubGlobal("fetch", fetcher);
    await expect(client.request("/auth/me")).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(client.getTokens()).toBeNull();
  });
  it("does not refresh 403 or public login 401", async () => {
    const client = new ApiClient();
    client.setTokens({ accessToken: "a", refreshToken: "r" });
    const f = vi
      .fn()
      .mockResolvedValue(new Response("Forbidden", { status: 403 }));
    vi.stubGlobal("fetch", f);
    await expect(
      client.request("/providers/me/bookings"),
    ).rejects.toMatchObject({ status: 403 });
    expect(f).toHaveBeenCalledOnce();
    f.mockResolvedValue(denied());
    await expect(
      client.request("/auth/login", { public: true, method: "POST" }),
    ).rejects.toMatchObject({ status: 401 });
    expect(f).toHaveBeenCalledTimes(2);
  });
  it("normalizes text 429 and prevents calls during Retry-After", async () => {
    const f = vi.fn().mockResolvedValue(
      new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": "30" },
      }),
    );
    vi.stubGlobal("fetch", f);
    const c = new ApiClient();
    await expect(
      c.request("/services", { public: true }),
    ).rejects.toMatchObject({ status: 429, retryAfter: 30 });
    await expect(
      c.request("/services", { public: true }),
    ).rejects.toMatchObject({ status: 429 });
    expect(f).toHaveBeenCalledOnce();
  });
  it("normalizes field errors and non-JSON server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Validation failed",
            errors: [{ path: "title", message: "Required" }],
          }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      ),
    );
    await expect(new ApiClient().request("/services")).rejects.toMatchObject({
      errors: [{ path: "title", message: "Required" }],
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response("<html>error</html>", { status: 500 })),
    );
    await expect(new ApiClient().request("/services")).rejects.toThrow(
      "server could not",
    );
  });
  it("encodes exact query values without empty keys", () =>
    expect(
      queryString({ page: 2, city: "New York", status: "", isBooked: false }),
    ).toBe("?page=2&city=New+York&isBooked=false"));
});
