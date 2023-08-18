import React from "react";

export default function ChatbotName() {
  /// setting chatbot name
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const dateString = `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
  return dateString;
}
