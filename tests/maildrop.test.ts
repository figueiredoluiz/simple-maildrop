import { beforeEach, describe, expect, it, vi } from "vitest";
import Maildrop, { MaildropApiError } from "../src/index.js";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

describe("Maildrop", () => {
  let maildrop: ReturnType<typeof Maildrop>;
  type Request = (client: ReturnType<typeof Maildrop>) => Promise<unknown>;

  beforeEach(() => {
    maildrop = Maildrop();
    mockedFetch.mockReset();
  });

  it.each([
    [
      "gets a mailbox",
      (client: ReturnType<typeof Maildrop>) => client.getMailbox({ mailbox: "test" }),
      { mailbox: "test" },
      { inbox: [] },
    ],
    [
      "gets an alternative inbox",
      (client: ReturnType<typeof Maildrop>) => client.getAltInbox({ mailbox: "test" }),
      { mailbox: "test" },
      { altinbox: "alias@maildrop.cc" },
    ],
    [
      "gets statistics",
      (client: ReturnType<typeof Maildrop>) => client.getStatistics({}),
      {},
      { statistics: { blocked: 1, saved: 2 } },
    ],
    [
      "gets status",
      (client: ReturnType<typeof Maildrop>) => client.getStatus({}),
      {},
      { status: "operational" },
    ],
    [
      "gets a message",
      (client: ReturnType<typeof Maildrop>) => client.getMessage({ mailbox: "test", id: "1" }),
      { mailbox: "test", id: "1" },
      { message: null },
    ],
    [
      "deletes a message",
      (client: ReturnType<typeof Maildrop>) => client.deleteMessage({ mailbox: "test", id: "1" }),
      { mailbox: "test", id: "1" },
      { delete: true },
    ],
    [
      "pings the API",
      (client: ReturnType<typeof Maildrop>) => client.ping({ message: "hello" }),
      { message: "hello" },
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
        headers: { "content-type": "application/json" },
      });
      expect(JSON.parse(fetchRequest.body)).toEqual({
        query: expect.any(String),
        variables,
      });
    },
  );

  it("reports HTTP failures", async () => {
    mockedFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(maildrop.getStatus({})).rejects.toThrow(
      "Maildrop API request failed with status 503",
    );
  });

  it("reports GraphQL errors", async () => {
    mockedFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          errors: [{ message: "invalid query", code: "GRAPHQL_VALIDATION_FAILED" }],
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );

    const error = await maildrop.getStatus({}).catch((requestError: unknown) => requestError);

    expect(error).toBeInstanceOf(MaildropApiError);
    expect(error).toMatchObject({
      message: "invalid query",
      errors: [{ message: "invalid query", code: "GRAPHQL_VALIDATION_FAILED" }],
    });
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
