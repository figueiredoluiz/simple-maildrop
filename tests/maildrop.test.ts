import { beforeEach, describe, expect, it, vi } from "vitest";
import Maildrop from "../src/index.js";

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
    ],
    [
      "gets an alternative inbox",
      (client: ReturnType<typeof Maildrop>) => client.getAltInbox({ mailbox: "test" }),
      { mailbox: "test" },
    ],
    ["gets statistics", (client: ReturnType<typeof Maildrop>) => client.getStatistics({}), {}],
    ["gets status", (client: ReturnType<typeof Maildrop>) => client.getStatus({}), {}],
    [
      "gets a message",
      (client: ReturnType<typeof Maildrop>) => client.getMessage({ mailbox: "test", id: "1" }),
      { mailbox: "test", id: "1" },
    ],
    [
      "deletes a message",
      (client: ReturnType<typeof Maildrop>) => client.deleteMessage({ mailbox: "test", id: "1" }),
      { mailbox: "test", id: "1" },
    ],
  ] as [string, Request, Record<string, string>][])("%s", async (_name, request, variables) => {
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "mockedData" }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const data = await request(maildrop);

    expect(data).toBe("mockedData");
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
  });

  it("reports HTTP failures", async () => {
    mockedFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(maildrop.getStatus({})).rejects.toThrow(
      "Maildrop API request failed with status 503",
    );
  });
});
