import type { Success, TokenPair } from "./types";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: { path: string; message: string }[] = [],
    public retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export const baseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api/v1" : "http://localhost:5000/api/v1")
).replace(/\/+$/, "");
export class ApiClient {
  private tokens: TokenPair | null = null;
  private epoch = 0;
  private refreshing: Promise<void> | null = null;
  private cooldown = 0;
  onTokens: (tokens: TokenPair | null) => void = () => {};
  onExpired: () => void = () => {};
  setTokens(tokens: TokenPair | null) {
    this.epoch++;
    this.tokens = tokens;
    this.refreshing = null;
    this.onTokens(tokens);
  }
  getTokens() {
    return this.tokens;
  }
  private async send<T>(
    path: string,
    method: string,
    body: unknown,
    token?: string,
    signal?: AbortSignal,
  ): Promise<T> {
    if (Date.now() < this.cooldown)
      throw new ApiError(
        429,
        "Too many requests. Please wait before trying again.",
        [],
        Math.ceil((this.cooldown - Date.now()) / 1000),
      );
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        signal,
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      throw new ApiError(
        0,
        "Could not reach Servexa. Check your connection and try again.",
      );
    }
    const text = await response.text();
    let data: unknown;
    if (response.headers.get("content-type")?.includes("json")) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new ApiError(
          response.status,
          "The server returned an unreadable response.",
        );
      }
    }
    if (!response.ok) {
      const error = data as { message?: unknown; errors?: unknown } | undefined;
      const header = response.headers.get("retry-after");
      const seconds = header
        ? /^\d+$/.test(header)
          ? Number(header)
          : Math.max(0, Math.ceil((Date.parse(header) - Date.now()) / 1000))
        : null;
      if (response.status === 429)
        this.cooldown = Date.now() + (seconds ?? 60) * 1000;
      const fallback: Record<number, string> = {
        403: "You do not have permission for this action.",
        404: "This resource is unavailable.",
        409: "The resource changed. Refresh and try again.",
        429: "Too many requests. Please wait before trying again.",
        500: "The server could not complete this request.",
        502: "Checkout URL is unavailable. Inspect payment status before retrying.",
        503: "Payment integration is unavailable.",
      };
      const errors = Array.isArray(error?.errors)
        ? error.errors.filter(
            (x): x is { path: string; message: string } =>
              typeof x?.path === "string" && typeof x?.message === "string",
          )
        : [];
      throw new ApiError(
        response.status,
        typeof error?.message === "string"
          ? error.message
          : fallback[response.status] || "Request failed.",
        errors,
        seconds,
      );
    }
    if (
      !data ||
      typeof data !== "object" ||
      !("success" in data) ||
      data.success !== true ||
      !("data" in data)
    )
      throw new ApiError(response.status, "Unexpected server response.");
    return (data as Success<T>).data;
  }
  async request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      public?: boolean;
      signal?: AbortSignal;
    } = {},
  ): Promise<T> {
    const { method = "GET", body, signal } = options;
    const epoch = this.epoch;
    const access = this.tokens?.accessToken;
    try {
      const result = await this.send<T>(
        path,
        method,
        body,
        options.public ? undefined : access,
        signal,
      );
      if (!options.public && epoch !== this.epoch)
        throw new ApiError(401, "Session changed.");
      return result;
    } catch (error) {
      if (
        options.public ||
        !(error instanceof ApiError) ||
        error.status !== 401 ||
        !this.tokens ||
        epoch !== this.epoch
      )
        throw error;
      if (this.tokens.accessToken === access) {
        if (!this.refreshing) {
          const refreshToken = this.tokens.refreshToken;
          const pending = this.send<TokenPair>("/auth/refresh-token", "POST", {
            refreshToken,
          })
            .then((tokens) => {
              if (this.epoch !== epoch)
                throw new ApiError(401, "Session changed.");
              this.tokens = tokens;
              this.onTokens(tokens);
            })
            .catch((e) => {
              if (this.epoch === epoch) {
                this.setTokens(null);
                this.onExpired();
              }
              throw e;
            })
            .finally(() => {
              if (this.refreshing === pending) this.refreshing = null;
            });
          this.refreshing = pending;
        }
        await this.refreshing;
      }
      if (this.epoch !== epoch || !this.tokens)
        throw new ApiError(401, "Session changed.");
      try {
        const result = await this.send<T>(
          path,
          method,
          body,
          this.tokens.accessToken,
          signal,
        );
        if (this.epoch !== epoch) throw new ApiError(401, "Session changed.");
        return result;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401 && this.epoch === epoch) {
          this.setTokens(null);
          this.onExpired();
        }
        throw e;
      }
    }
  }
}
export const client = new ApiClient();
export function queryString(query: Record<string, unknown> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query))
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  return p.size ? `?${p}` : "";
}
