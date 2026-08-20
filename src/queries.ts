export const GET_MAILBOX = `
  query GetMailbox($mailbox: String!) {
    inbox(mailbox: $mailbox) {
      id
      headerfrom
      subject
      date
    }
  }
`;

export const GET_MESSAGE = `
  query GetMessage($mailbox: String!, $id: String!) {
    message(mailbox: $mailbox, id: $id) {
      id
      date
      mailfrom
      headerfrom
      subject
      data
      html
    }
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
