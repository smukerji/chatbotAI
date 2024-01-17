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

function addLeadingZero(num: number) {
  return num < 10 ? "0" + num : num;
}
