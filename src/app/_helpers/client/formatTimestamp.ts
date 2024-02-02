export function formatTimestamp(timestamp: number) {
  const options: any = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  const formattedDate = new Date(timestamp).toLocaleString("en-US", options);
  return formattedDate;
}
