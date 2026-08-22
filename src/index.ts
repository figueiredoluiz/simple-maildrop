import {
  GET_MAILBOX,
  GET_MESSAGE,
  GET_PING,
  DELETE_MESSAGE,
  GET_ALT_INBOX,
  GET_STATISTICS,
  GET_STATUS,
} from "./queries.js";
import type {
  AltInboxResponse,
  DeleteMessageResponse,
  EmptyVariables,
  GraphQLError,
  GraphQLPayload,
  MaildropOptions,
  MailboxResponse,
  MailboxVariables,
  MessageResponse,
  MessageVariables,
  PingResponse,
  PingVariables,
  StatisticsResponse,
  StatusResponse,
} from "./types.js";
export type * from "./types.js";

const baseUrl = "https://api.maildrop.cc/graphql";
const defaultTimeout = 10_000;

type ResolvedMaildropOptions = {
  endpoint: string;
  fetch: typeof globalThis.fetch;
  timeout: number;
};

type Validator<V> = {
  (...[,]: [V | undefined]): V;
};

export abstract class MaildropError extends Error {}

export class MaildropApiError extends MaildropError {
  readonly errors: readonly GraphQLError[];
  readonly data: unknown;

  constructor(errors: readonly GraphQLError[], data?: unknown) {
    super(errors.map(({ message }) => message).join("; "));
    this.name = "MaildropApiError";
    this.errors = errors;
    this.data = data;
  }
}

export class MaildropHttpError extends MaildropError {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Maildrop API request failed with status ${status}`);
    this.name = "MaildropHttpError";
    this.status = status;
    this.body = body;
  }
}

export class MaildropResponseError extends MaildropError {
  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = "MaildropResponseError";
  }
}

export class MaildropTimeoutError extends MaildropError {
  readonly timeout: number;

  constructor(timeout: number, cause: unknown) {
    super(`Maildrop API request timed out after ${timeout}ms`, { cause });
    this.name = "MaildropTimeoutError";
    this.timeout = timeout;
  }
}

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const graphQLRequest = async <V, R>(
  query: string,
  variables: V,
  options: ResolvedMaildropOptions,
): Promise<R> => {
  const controller = new AbortController();
  const timeoutReason = {};
  const timeoutId = setTimeout(() => {
    controller.abort(timeoutReason);
  }, options.timeout);

  try {
    const response = await options.fetch(options.endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "simple-maildrop",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new MaildropHttpError(response.status, await response.text());
    }

    let payload: GraphQLPayload<R>;
    try {
      payload = (await response.json()) as GraphQLPayload<R>;
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }

      throw new MaildropResponseError("Maildrop API returned invalid JSON", error);
    }

    if (payload.errors?.length) {
      throw new MaildropApiError(payload.errors, payload.data);
    }

    if (payload.data === undefined) {
      throw new MaildropApiError([{ message: "Maildrop API returned no data" }]);
    }

    return payload.data;
  } catch (error) {
    if (controller.signal.reason === timeoutReason) {
      throw new MaildropTimeoutError(options.timeout, error);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const apiCall =
  <V, R>(query: string, validate: Validator<V>, options: ResolvedMaildropOptions) =>
  async (variables?: V): Promise<R> => {
    return graphQLRequest<V, R>(query, validate(variables), options);
  };

const validateMailboxVariables = (variables: MailboxVariables | undefined): MailboxVariables => {
  if (!variables) {
    throw new TypeError("Maildrop mailbox must be a non-empty string");
  }

  const mailbox = variables.mailbox;

  if (typeof mailbox !== "string" || mailbox.trim() === "" || mailbox !== mailbox.trim()) {
    throw new TypeError("Maildrop mailbox must be a non-empty string");
  }

  return variables;
};

const validateMessageVariables = (variables: MessageVariables | undefined): MessageVariables => {
  if (!variables) {
    throw new TypeError("Maildrop message variables are required");
  }

  validateMailboxVariables(variables);

  if (typeof variables.id !== "string" || variables.id.trim() === "") {
    throw new TypeError("Maildrop message id must be a non-empty string");
  }

  return variables;
};

const validateEmptyVariables = (variables?: EmptyVariables): EmptyVariables => variables ?? {};
const validatePingVariables = (variables?: PingVariables): PingVariables => variables ?? {};

/** Create a client for the Maildrop GraphQL API. */
const Maildrop = (clientOptions: MaildropOptions = {}) => {
  const injectedFetch = clientOptions.fetch;
  const options = {
    endpoint: clientOptions.endpoint ?? baseUrl,
    fetch: injectedFetch
      ? (...args: Parameters<typeof globalThis.fetch>) => injectedFetch(...args)
      : (...args: Parameters<typeof globalThis.fetch>) => globalThis.fetch(...args),
    timeout: clientOptions.timeout ?? defaultTimeout,
  };

  if (!Number.isFinite(options.timeout) || options.timeout <= 0) {
    throw new RangeError("Maildrop timeout must be a positive finite number");
  }

  return {
    /** Return message metadata for a mailbox. */
    getMailbox: apiCall<MailboxVariables, MailboxResponse>(
      GET_MAILBOX,
      validateMailboxVariables,
      options,
    ),
    /** Return the complete message, including raw and HTML content. */
    getMessage: apiCall<MessageVariables, MessageResponse>(
      GET_MESSAGE,
      validateMessageVariables,
      options,
    ),
    /** Delete a message from a mailbox. */
    deleteMessage: apiCall<MessageVariables, DeleteMessageResponse>(
      DELETE_MESSAGE,
      validateMessageVariables,
      options,
    ),
    /** Return the alternate inbox address for a mailbox. */
    getAltInbox: apiCall<MailboxVariables, AltInboxResponse>(
      GET_ALT_INBOX,
      validateMailboxVariables,
      options,
    ),
    /** Return Maildrop delivery statistics. */
    getStatistics: apiCall<EmptyVariables, StatisticsResponse>(
      GET_STATISTICS,
      validateEmptyVariables,
      options,
    ),
    /** Return the current Maildrop service status. */
    getStatus: apiCall<EmptyVariables, StatusResponse>(GET_STATUS, validateEmptyVariables, options),
    /** Check API connectivity and optionally echo a message. */
    ping: apiCall<PingVariables, PingResponse>(GET_PING, validatePingVariables, options),
  };
};

export type MaildropClient = ReturnType<typeof Maildrop>;

export { Maildrop };
export default Maildrop;
