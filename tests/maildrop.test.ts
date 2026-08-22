import { beforeEach, describe, expect, it, vi } from "vitest";
import Maildrop, {
  MaildropApiError,
  MaildropHttpError,
  MaildropResponseError,
  MaildropTimeoutError,
} from "../src/index.js";
import type { MaildropClient, MaildropOptions } from "../src/index.js";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

const runTimedRequest = async (customFetch: NonNullable<MaildropOptions["fetch"]>) => {
  vi.useFakeTimers();
  const client = Maildrop({ fetch: customFetch, timeout: 25 });
  const request = client.getStatus().catch((error: unknown) => error);
  await vi.advanceTimersByTimeAsync(25);
  const error = await request;
  vi.useRealTimers();

  expect(error).toBeInstanceOf(MaildropTimeoutError);
  return error;
};

describe("Maildrop", () => {
  let maildrop: MaildropClient;
  type Request = (client: MaildropClient) => Promise<unknown>;

  beforeEach(() => {
    maildrop = Maildrop();
    mockedFetch.mockReset();
  });

  const requestWithPayload = async (payload: unknown) => {
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        headers: { "content-type": "application/json" },
      }),
    );

    return maildrop.getStatus().catch((error: unknown) => error);
  };

  it.each([
    [
      "gets a mailbox",
      (client: MaildropClient) => client.getMailbox({ mailbox: "test" }),
      { mailbox: "test" },
      { inbox: [] },
    ],
    [
      "gets an alternative inbox",
      (client: MaildropClient) => client.getAltInbox({ mailbox: "test" }),
      { mailbox: "test" },
      { altinbox: "alias@maildrop.cc" },
    ],
    [
      "gets statistics",
      (client: MaildropClient) => client.getStatistics({}),
      {},
      { statistics: { blocked: 1, saved: 2 } },
    ],
    [
      "gets status",
      (client: MaildropClient) => client.getStatus({}),
      {},
      { status: "operational" },
    ],
    [
      "gets a message",
      (client: MaildropClient) => client.getMessage({ mailbox: "test", id: "1" }),
      { mailbox: "test", id: "1" },
      { message: null },
    ],
    [
      "deletes a message",
      (client: MaildropClient) => client.deleteMessage({ mailbox: "test", id: "1" }),
      { mailbox: "test", id: "1" },
      { delete: true },
    ],
    [
      "pings the API",
      (client: MaildropClient) => client.ping({ message: "hello" }),
      { message: "hello" },
      { ping: "pong" },
    ],
    [
      "pings the API without a message",
      (client: MaildropClient) => client.ping(),
      {},
      { ping: "pong" },
    ],
  ] as [string, Request, Record<string, unknown>, Record<string, unknown>][])(
    "%s",
    async (_name, request, variables, expected) => {
      mockedFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: expected }), {
          headers: { "content-type": "application/json" },
        }),
      );

      const data = await request(maildrop);

      expect(data).toEqual(expected);
      const [url, fetchRequest] = mockedFetch.mock.calls[0];
      expect(url).toBe("https://api.maildrop.cc/graphql");
      expect(fetchRequest).toMatchObject({
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "user-agent": "simple-maildrop",
        },
      });
      expect(JSON.parse(fetchRequest.body)).toEqual({
        query: expect.any(String),
        variables,
      });
    },
  );

  it("reports HTTP failures", async () => {
    mockedFetch.mockResolvedValueOnce(new Response("service unavailable", { status: 503 }));

    const error = await maildrop.getStatus({}).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(MaildropHttpError);
    expect(error).toMatchObject({ status: 503, body: "service unavailable" });
  });

  it("propagates transport failures", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("network unavailable"));

    await expect(maildrop.getStatus({})).rejects.toThrow("network unavailable");
  });

  it.each([
    ["mailbox", () => maildrop.getMailbox()],
    ["mailbox", () => maildrop.getMailbox({ mailbox: " " })],
    ["mailbox", () => maildrop.getMailbox({ mailbox: " test" })],
    ["message id", () => maildrop.getMessage({ mailbox: "test", id: "" })],
  ])("rejects an empty %s before making a request", async (_name, request) => {
    await expect(request()).rejects.toThrow(/must be a non-empty string/);
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("rejects missing message variables", async () => {
    await expect(maildrop.getMessage()).rejects.toThrow("message variables are required");
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("supports endpoint, fetch, and timeout options", async () => {
    const customFetch = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { status: "operational" } }), {
        headers: { "content-type": "application/json" },
      }),
    );
    const client = Maildrop({
      endpoint: "https://example.test/graphql",
      fetch: customFetch,
      timeout: 250,
    });

    await expect(client.getStatus()).resolves.toEqual({ status: "operational" });
    expect(customFetch).toHaveBeenCalledWith(
      "https://example.test/graphql",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("reports request timeouts", async () => {
    const customFetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
    );
    const error = await runTimedRequest(customFetch);
    expect(error).toMatchObject({ timeout: 25 });
  });

  it("reports timeouts while streaming the response body", async () => {
    const customFetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve) => {
          init?.signal?.addEventListener("abort", () =>
            resolve({
              ok: true,
              json: () => Promise.reject(new DOMException("aborted", "AbortError")),
            } as Response),
          );
        }),
    );
    await runTimedRequest(customFetch);
  });

  it.each([0, Number.POSITIVE_INFINITY])("rejects invalid timeout %s", (timeout) => {
    expect(() => Maildrop({ timeout })).toThrow("timeout must be a positive finite number");
  });

  it("reports GraphQL errors", async () => {
    const error = await requestWithPayload({
      errors: [{ message: "invalid query", code: "GRAPHQL_VALIDATION_FAILED" }],
    });

    expect(error).toBeInstanceOf(MaildropApiError);
    expect(error).toMatchObject({
      message: "invalid query",
      errors: [{ message: "invalid query", code: "GRAPHQL_VALIDATION_FAILED" }],
    });
  });

  it("preserves partial GraphQL data on errors", async () => {
    const error = await requestWithPayload({
      data: { status: "degraded" },
      errors: [{ message: "partial failure" }],
    });

    expect(error).toBeInstanceOf(MaildropApiError);
    expect(error).toMatchObject({ data: { status: "degraded" } });
  });

  it("reports invalid JSON responses", async () => {
    mockedFetch.mockResolvedValueOnce(
      new Response("<!doctype html>", {
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(maildrop.getStatus({})).rejects.toBeInstanceOf(MaildropResponseError);
  });

  it("reports responses without data", async () => {
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(maildrop.getStatus({})).rejects.toThrow("Maildrop API returned no data");
  });
});
