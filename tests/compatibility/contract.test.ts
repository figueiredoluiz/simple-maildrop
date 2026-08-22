import { beforeEach, describe, expect, it, vi } from "vitest";
import Maildrop from "../../src/index.js";
import type { MaildropClient } from "../../src/index.js";
import { packageCompatibilityVersions } from "./versions.js";

const mockedFetch = vi.fn();
vi.stubGlobal("fetch", mockedFetch);

type LegacyOperation = readonly [
  name: string,
  request: (client: MaildropClient) => Promise<unknown>,
  variables: Record<string, string>,
];

const legacyOperations: readonly LegacyOperation[] = [
  ["gets a mailbox", (client) => client.getMailbox({ mailbox: "test" }), { mailbox: "test" }],
  [
    "gets a message",
    (client) => client.getMessage({ mailbox: "test", id: "1" }),
    { mailbox: "test", id: "1" },
  ],
  [
    "deletes a message",
    (client) => client.deleteMessage({ mailbox: "test", id: "1" }),
    { mailbox: "test", id: "1" },
  ],
  [
    "gets an alternative inbox",
    (client) => client.getAltInbox({ mailbox: "test" }),
    { mailbox: "test" },
  ],
  ["gets statistics", (client) => client.getStatistics({}), {}],
  ["gets status", (client) => client.getStatus({}), {}],
];

describe.each(packageCompatibilityVersions)(
  "simple-maildrop package v%s compatibility",
  (version) => {
    let maildrop: MaildropClient;

    beforeEach(() => {
      maildrop = Maildrop();
      mockedFetch.mockReset();
    });

    it.each(legacyOperations)(
      `package v${version} preserves methods, variables, requests, and output`,
      async (_name, request, variables) => {
        mockedFetch.mockResolvedValueOnce(
          new Response(JSON.stringify({ data: "mockedData" }), {
            headers: { "content-type": "application/json" },
          }),
        );

        const data = await request(maildrop);

        expect(data).toBe("mockedData");
        expect(mockedFetch).toHaveBeenCalledWith(
          "https://api.maildrop.cc/graphql",
          expect.objectContaining({ method: "POST" }),
        );

        const [, fetchRequest] = mockedFetch.mock.calls[0];
        expect(JSON.parse(fetchRequest.body)).toEqual({
          query: expect.any(String),
          variables,
        });
      },
    );
  },
);
