export const sortMessagesByTimestamp = (messages) =>
  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
