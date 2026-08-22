// These operations mirror the official Maildrop GraphQL schema:
// https://docs.maildrop.cc/api-reference/graphql-api-schema
export const GET_MAILBOX = `
  query GetMailbox($mailbox: String!) {
    inbox(mailbox: $mailbox) {
      id
      ip
      helo
      date
      mailfrom
      rcptto
      headerfrom
      subject
    }
  }
`;

export const GET_MESSAGE = `
  query GetMessage($mailbox: String!, $id: String!) {
    message(mailbox: $mailbox, id: $id) {
      id
      ip
      helo
      date
      mailfrom
      rcptto
      headerfrom
      subject
      data
      html
    }
  }
`;

export const GET_PING = `
  query Ping($message: String) {
    ping(message: $message)
  }
`;

export const DELETE_MESSAGE = `
  mutation DeleteMessage($mailbox: String!, $id: String!) {
    delete(mailbox: $mailbox, id: $id)
  }
`;

export const GET_ALT_INBOX = `
  query GetAltInbox($mailbox: String!) {
    altinbox(mailbox: $mailbox)
  }
`;

export const GET_STATISTICS = `
  query GetStatistics {
    statistics {
      blocked
      saved
    }
  }
`;

export const GET_STATUS = `
  query GetStatus {
    status
  }
`;
