export function formatTimestamp(timestamp: number, onlyDate = false) {
  const options: any = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  // const onlyDateOptions: any = {};
  if (onlyDate) {
    const date = new Date(timestamp);
    // Get day, month, and year
    const day = date.getDate();
    const month = date.getMonth() + 1; // Note: Month starts from 0
    const year = date.getFullYear();

    // Pad day and month with leading zeros if needed
    const formattedDay = day < 10 ? "0" + day : day;
    const formattedMonth = month < 10 ? "0" + month : month;

    // Format the date as "DD/MM/YYYY"
    const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
    return formattedDate;
  } else {
    const formattedDate = new Date(timestamp).toLocaleString("en-US", options);
    return formattedDate;
  }
}
