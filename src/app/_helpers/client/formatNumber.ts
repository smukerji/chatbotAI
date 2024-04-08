export function formatNumber(num: number) {
  if (num >= 1000 && num < 1000000) {
    const formattedNum = num / 1000;
    return formattedNum % 1 === 0
      ? formattedNum.toFixed(0) + "k"
      : formattedNum.toFixed(1) + "k";
  } else if (num >= 1000000 && num < 1000000000) {
    const formattedNum = num / 1000000;
    return formattedNum % 1 === 0
      ? formattedNum.toFixed(0) + "M"
      : formattedNum.toFixed(1) + "M";
  } else if (num >= 1000000000) {
    const formattedNum = num / 1000000000;
    return formattedNum % 1 === 0
      ? formattedNum.toFixed(0) + "B"
      : formattedNum.toFixed(1) + "B";
  } else {
    return num.toString();
  }
}
