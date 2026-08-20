import { beforeEach, describe, expect, it, vi } from "vitest";
import Maildrop from "../src/index.js";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

describe("Maildrop", () => {
  let maildrop: ReturnType<typeof Maildrop>;

  beforeEach(() => {
    maildrop = Maildrop();
    mockedFetch.mockReset();
  });

  it.each([
    ["gets a mailbox", "getMailbox", { mailbox: "test" }],
    ["gets an alternative inbox", "getAltInbox", { mailbox: "test" }],
    ["gets statistics", "getStatistics", {}],
    ["gets status", "getStatus", {}],
    ["gets a message", "getMessage", { mailbox: "test", id: "1" }],
    ["deletes a message", "deleteMessage", { mailbox: "test", id: "1" }],
  ] as const)("%s", async (_name, method, variables) => {
    mockedFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: "mockedData" }), {
        headers: { "content-type": "application/json" },
      }),
    );

    const data = await maildrop[method](variables as never);

    expect(data).toBe("mockedData");
    const [url, request] = mockedFetch.mock.calls[0];
    expect(url).toBe("https://api.maildrop.cc/graphql");
    expect(request).toMatchObject({
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    expect(JSON.parse(request.body)).toEqual({
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
