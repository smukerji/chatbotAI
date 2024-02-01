"use client";
import React, { useState, useEffect } from "react";
import "./chatbot.css"; // You can style it with CSS
import { MessageOutlined, CloseOutlined } from "@ant-design/icons";
import Chat from "@/app/(secure)/chatbot/dashboard/_components/Chat/Chat";
import { useSearchParams } from "next/navigation";
import { getDate, getTime } from "../../_helpers/client/getTime";
import { v4 as uuid } from "uuid";
import axios from "axios";

function Chatbot() {
  const params = useSearchParams();
  const chatbot = { id: params.get("chatbotID") };

  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! What can I help you with?` },
  ]);

  const [messagesTime, setMessagesTime] = useState(
    chatbot.initial_message == null
      ? [
          {
            role: "assistant",
            content: `Hi! What can I help you with?`,
            messageTime: getTime(),
          },
        ]
      : [{ role: "assistant" }]
  );

  const [sessionID, setSessionID] = useState();
  const [sessionStartDate, setSessionStartDate] = useState();

  const [userId, setUserId] = useState();
  const [chatbotName, setChatBotName] = useState();

  /// state to keep the chatbot open or close
  const [state, setState] = useState(false);
  function toggleChatbot() {
    setState(!state);
  }

  /// used to fetch the bot details
  const [isBotDetailsFetched, setIsBotDetailsFetched] = useState(false);

  useEffect(() => {
    setSessionID(uuid());
    setSessionStartDate(getDate());

    const fetchBotDetails = async () => {
      setIsBotDetailsFetched(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/details/api?chatbotId=${chatbot?.id}`
      );

      const botDetails = response.data;
      setChatBotName(botDetails?.chatbotName);
      setUserId(botDetails?.userId);
    };

    if (!isBotDetailsFetched && chatbot.id) fetchBotDetails();
  }, [chatbot.id]);

  return (
    <>
      {state && (
        <div className="embed-chatbot-container">
          <Chat
            chatbot={chatbot}
            messages={messages}
            setMessages={setMessages}
            messagesTime={messagesTime}
            setMessagesTime={setMessagesTime}
            sessionID={sessionID}
            sessionStartDate={sessionStartDate}
            setSessionID={setSessionID}
            setSessionStartDate={setSessionStartDate}
            isPopUp={true}
            userId={userId}
            chatbotName={chatbotName}
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
