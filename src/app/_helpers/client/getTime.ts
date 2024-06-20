export function getTime() {
  const currentTime = new Date();

  /// format the time
  const hours = addLeadingZero(currentTime.getHours());
  const minutes = addLeadingZero(currentTime.getMinutes());

  return `${hours}:${minutes}`;
}

export function getDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = addLeadingZero(currentDate.getMonth() + 1); // Months are 0-based (0 = January, 1 = February, ...)
  const day = addLeadingZero(currentDate.getDate());
  const hours = addLeadingZero(currentDate.getHours());
  const minutes = addLeadingZero(currentDate.getMinutes());
  const seconds = addLeadingZero(currentDate.getSeconds());

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

export function getTimeAgo(dateTime: string) {
  const pastDate: any = new Date(dateTime);
  const now: any = new Date();

  const diffMs = now - pastDate; // Difference in milliseconds

  // Convert difference from milliseconds to seconds, minutes, and hours
  const secondsDiff = Math.floor(diffMs / 1000);
  const minutesDiff = Math.floor(diffMs / (1000 * 60));
  const hoursDiff = Math.floor(diffMs / (1000 * 60 * 60));

  // Check if the difference exceeds 24 hours
  if (hoursDiff >= 24) {
    // Return the original date/time in a desired format (e.g., ISO 8601)
    return pastDate.toLocaleDateString();
  } else if (secondsDiff < 60) {
    return `${secondsDiff} seconds ago`;
  } else if (minutesDiff < 60) {
    return `${minutesDiff} minutes ago`;
  } else {
    return `${hoursDiff} hours ago`;
  }
}

function addLeadingZero(num: number) {
  return num < 10 ? "0" + num : num;
}
