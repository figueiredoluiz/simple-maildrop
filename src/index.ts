import {
  GET_MAILBOX,
  GET_MESSAGE,
  GET_PING,
  DELETE_MESSAGE,
  GET_ALT_INBOX,
  GET_STATISTICS,
  GET_STATUS,
} from "./queries.js";

const baseUrl = "https://api.maildrop.cc/graphql";

type MailboxVariable = {
  mailbox: string;
};

type PingVariables = {
  message?: string;
};

type MessageVariable = {
  mailbox: string;
  id: string;
};

export type Message = {
  id: string | null;
  ip: string | null;
  helo: string | null;
  date: string | null;
  mailfrom: string | null;
  rcptto: string[] | null;
  headerfrom: string | null;
  subject: string | null;
  data: string | null;
  html: string | null;
};

export type MailboxResponse = {
  inbox: Message[] | null;
};

export type MessageResponse = {
  message: Message | null;
};

export type DeleteMessageResponse = {
  delete: boolean | null;
};

export type AltInboxResponse = {
  altinbox: string | null;
};

export type StatisticsResponse = {
  statistics: {
    blocked: number | null;
    saved: number | null;
  } | null;
};

export type StatusResponse = {
  status: string | null;
};

export type PingResponse = {
  ping: string | null;
};

export type GraphQLError = {
  message: string;
  [key: string]: unknown;
};

export class MaildropApiError extends Error {
  readonly errors: readonly GraphQLError[];

  constructor(errors: readonly GraphQLError[]) {
    super(errors.map(({ message }) => message).join("; "));
    this.name = "MaildropApiError";
    this.errors = errors;
  }
}

type GraphQLPayload<T> = {
  data?: T;
  errors?: GraphQLError[];
};

const graphQLRequest = async <V, R>(query: string, variables: V): Promise<R> => {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Maildrop API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLPayload<R>;

  if (payload.errors?.length) {
    throw new MaildropApiError(payload.errors);
  }

  if (payload.data === undefined) {
    throw new MaildropApiError([{ message: "Maildrop API returned no data" }]);
  }

  return payload.data;
};

const apiCall =
  <V, R>(query: string) =>
  async (variables: V): Promise<R> =>
    graphQLRequest<V, R>(query, variables);

const Maildrop = () => {
  return {
    getMailbox: apiCall<MailboxVariable, MailboxResponse>(GET_MAILBOX),
    getMessage: apiCall<MessageVariable, MessageResponse>(GET_MESSAGE),
    deleteMessage: apiCall<MessageVariable, DeleteMessageResponse>(DELETE_MESSAGE),
    getAltInbox: apiCall<MailboxVariable, AltInboxResponse>(GET_ALT_INBOX),
    getStatistics: apiCall<Record<string, never>, StatisticsResponse>(GET_STATISTICS),
    getStatus: apiCall<Record<string, never>, StatusResponse>(GET_STATUS),
    ping: apiCall<PingVariables, PingResponse>(GET_PING),
  };
};

export { Maildrop };
export default Maildrop;
