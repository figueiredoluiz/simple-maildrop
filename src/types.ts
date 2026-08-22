export type MailboxVariables = {
  mailbox: string;
};

export type PingVariables = {
  message?: string;
};

export type MessageVariables = {
  mailbox: string;
  id: string;
};

export type EmptyVariables = Record<string, never>;

export type MaildropOptions = {
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
  timeout?: number;
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

/** Maildrop currently returns non-null message elements in this list. */
export type MailboxResponse = { inbox: Message[] | null };
export type MessageResponse = { message: Message | null };
export type DeleteMessageResponse = { delete: boolean | null };
export type AltInboxResponse = { altinbox: string | null };

export type StatisticsResponse = {
  statistics: { blocked: number | null; saved: number | null } | null;
};

export type StatusResponse = { status: string | null };
export type PingResponse = { ping: string | null };

export type GraphQLError = {
  message: string;
  [key: string]: unknown;
};

export type GraphQLPayload<T> = {
  data?: T;
  errors?: GraphQLError[];
};
