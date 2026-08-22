import { describe, expect, it } from "vitest";
import Maildrop from "../src/index.js";

const runLiveTests = process.env.MAILDROP_LIVE_TEST === "1";

describe.skipIf(!runLiveTests)("Maildrop live API contract", () => {
  const maildrop = Maildrop({ timeout: 15_000 });

  it("responds to ping", async () => {
    const response = await maildrop.ping({ message: "simple-maildrop contract test" });

    expect(response.ping).toBeTypeOf("string");
  });

  it("returns service status", async () => {
    const response = await maildrop.getStatus();

    expect(response.status).toBeTypeOf("string");
  });

  it("returns statistics", async () => {
    const response = await maildrop.getStatistics();

    expect(response.statistics).toMatchObject({
      blocked: expect.any(Number),
      saved: expect.any(Number),
    });
  });

  it("returns an alternate inbox", async () => {
    const response = await maildrop.getAltInbox({ mailbox: "simple-maildrop-contract" });

    expect(response.altinbox).toBeTypeOf("string");
  });

  it("returns mailbox messages", async () => {
    const response = await maildrop.getMailbox({ mailbox: "simple-maildrop-contract" });

    expect(response.inbox).toBeInstanceOf(Array);
  });

  it("returns a missing message as null", async () => {
    const response = await maildrop.getMessage({
      mailbox: "simple-maildrop-contract",
      id: "simple-maildrop-missing-message",
    });

    expect(response.message).toBeNull();
  });
});
