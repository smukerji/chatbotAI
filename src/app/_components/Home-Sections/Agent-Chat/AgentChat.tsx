import React from "react";
import Image from "next/image";
import jessicaImg from "../../../../../public/sections-images/header-background/jessica.png";
import "./agent-chat.scss";

function AgentChat() {
  return (
    <div className="agent-chat-wrapper">
      <div className="chat-container">
        {/* Left Agent Info */}
        <div className="agent-info">
          <button className="close-btn">✕</button>
          <div className="agent-profile">
            <Image
              src={jessicaImg}
              alt="Agent"
              width={80}
              height={80}
              className="avatar"
            />
            <h3>Jessica</h3>
            <p>Torri&apos;s Customer Service Agent</p>
          </div>
        </div>

        {/* Right Chat Section */}
        <div className="chat-window">
          <div className="chat-messages">
            <div className="message agent">
              <span className="emoji">👩‍💼</span>
              <div className="bubble">
                Hey there! I&apos;m Jessica. How can I help you today?
              </div>
            </div>
            <div className="message user">
              <div className="bubble">Hello, I want to try Torri AI</div>
            </div>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Message to Jessica" />
            <button className="send-btn">➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentChat;
