import {
  GET_MAILBOX,
  GET_MESSAGE,
  DELETE_MESSAGE,
  GET_ALT_INBOX,
  GET_STATISTICS,
  GET_STATUS,
} from "./queries.js";

const baseUrl = "https://api.maildrop.cc/graphql";

type MailboxVariable = {
  mailbox: string;
};

type MessageVariable = {
  mailbox: string;
  id: string;
};

const graphQLRequest = async <V>(query: string, variables: V) => {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Maildrop API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data: unknown };
  return payload.data;
};

const apiCall =
  <V>(query: string) =>
  async (variables: V) =>
    graphQLRequest(query, variables);

const Maildrop = () => {
  return {
    getMailbox: apiCall<MailboxVariable>(GET_MAILBOX),
    getMessage: apiCall<MessageVariable>(GET_MESSAGE),
    deleteMessage: apiCall<MessageVariable>(DELETE_MESSAGE),
    getAltInbox: apiCall<MailboxVariable>(GET_ALT_INBOX),
    getStatistics: apiCall<{}>(GET_STATISTICS),
    getStatus: apiCall<{}>(GET_STATUS),
  };
};

export default Maildrop;
