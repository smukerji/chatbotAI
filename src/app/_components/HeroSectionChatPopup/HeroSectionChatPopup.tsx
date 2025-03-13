"use client";
import React, { useState } from "react";
import Image from "next/image";
import RefreshIcon from "../../../../public/svgs/refreshbtn.svg";
import CallIcon from "../../../../public/voiceBot/SVG/call-outgoing.svg";
import CloseIcon from "../../../../public/svgs/close-circle.svg";
import SendIcon from "../../../../public/svgs/send-2.svg";
import "./hero-section-chat-popup.scss";

function HeroSectionChatPopup({ onClose }: any) {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: `Hey there! I'm Torri, your personal assistant. How can I make your day easier?`,
    },
  ]);
  const [userMessage, setUserMessage] = useState("");

  const sendMessage = () => {
    if (userMessage.trim() !== "") {
      setMessages([...messages, { sender: "user", text: userMessage }]);
      setUserMessage("");
    }
  };
  return (
    <div className={"chatPopup"}>
      <div className={"chatHeader"}>
        <div>
          <button onClick={onClose} className={"closeButton"}>
            <Image src={CloseIcon} alt="Close" />
          </button>
        </div>

        <div className="headerRight">
          <button className={"refreshButton"}>
            <Image src={RefreshIcon} alt="Refresh" />
          </button>
          <button className={"callButton"}>
            <Image src={CallIcon} alt="Call" />
            Call
          </button>
        </div>
      </div>

      <div className={"chatBody"}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={msg.sender === "user" ? "userMessage" : "botMessage"}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className={"chatFooter"}>
        <input
          type="text"
          placeholder="Enter your message"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>
          <Image src={SendIcon} alt="Send" />
        </button>
      </div>
    </div>
  );
}

export default HeroSectionChatPopup;
