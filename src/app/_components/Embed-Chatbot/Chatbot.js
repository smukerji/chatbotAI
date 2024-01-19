"use client";
import React, { useState } from "react";
import "./chatbot.css"; // You can style it with CSS
import { MessageOutlined, CloseOutlined } from "@ant-design/icons";
import Chat from "@/app/(secure)/chatbot/dashboard/_components/Chat/Chat";
import { useSearchParams } from "next/navigation";

function Chatbot() {
  const params = useSearchParams();
  const chatbot = { id: params.get("chatbotID") };

  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! What can I help you with?` },
  ]);

  /// state to keep the chatbot open or close
  const [state, setState] = useState(false);
  function toggleChatbot() {
    setState(!state);
  }

  return (
    <>
      {state && (
        <div className="embed-chatbot-container">
          <Chat
            chatbot={chatbot}
            messages={messages}
            setMessages={setMessages}
          />
        </div>
      )}

      <div className="chatbot-icon" onClick={toggleChatbot}>
        {state ? (
          <CloseOutlined className="chat-icon" />
        ) : (
          <MessageOutlined className="chat-icon" />
        )}
      </div>
    </>
  );
}

export default Chatbot;
