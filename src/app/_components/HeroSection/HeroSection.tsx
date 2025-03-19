"use client";
import React, { useState } from "react";
import "./hero-section.scss";
import Image from "next/image";
import Link from "next/link";
import Micicon from "../../../../public/sections-images/header-background/microphone-2.svg";
import User1 from "../../../../public/sections-images/header-background/yellowbgimg.png";
import User2 from "../../../../public/sections-images/header-background/greenbgimg.png";
import MSGIcon from "../../../../public/sections-images/header-background/messages-3.svg";
import VoiceIcon from "../../../../public/sections-images/header-background/voice-cricle.svg";
import ellipse1 from "../../../../public/sections-images/header-background/Ellipse 76.png";
import ellipse2 from "../../../../public/sections-images/header-background/Ellipse 77.png";
import ellipse3 from "../../../../public/sections-images/header-background/Ellipse 78.png";
import sendIcon from "../../../../public/svgs/send.svg";
import HeroSectionChatPopup from "../HeroSectionChatPopup/HeroSectionChatPopup";

function HeroSection() {
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      setIsChatOpen(true);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* <div
        className="hero-section-container"
      >
        <h1 className="title">
          Seamless Support Starts Here: AI Chatbot Solutions for Every Customer
          Query
        </h1>

        <p className="description">
          Elevate your customer service experience to new heights by empowering
          your audience with the instant, reliable answers they seek, any time
          of the day. Torri AI scans your website, help center or other sources
          to provide quick and accurate AI-generated answers to customer
          questions.
        </p>

        <div className="request-demo-email-container">
         
          <Link
            style={{ color: "white", textDecoration: "none" }}
            href="/account/register"
          >
            <button className="request-demo-btn">Join with $1</button>
          </Link>
        </div>
        <div className="schemes-list">
          <ul>
           
            <li>
              <span>
                <Image
                  src={messageIcon}
                  alt="msg-icon"
                  loading="lazy"
                  width={23}
                  height={23}
                />
              </span>
              <span>Conversational Bot in 1 minute</span>
            </li>
            <li>
              <span>
                <Image
                  src={cancelIcon}
                  alt="cancel-icon"
                  loading="lazy"
                  width={23}
                  height={23}
                />
              </span>
              <span>Cancel anytime</span>
            </li>
          </ul>
        </div>

        <div className="grp-img">
          <Image src={HeaderImage} alt="image" fill />
        </div>
      </div> */}

      <section className={"heroSection"}>
        <div className={"container"}>
          <div className="ellipses">
            {/* <Image src={ellipse1} alt="Ellipse 1" className="ellipse1" /> */}
            <Image src={ellipse2} alt="Ellipse 2" className="ellipse2" />
            {/* <Image src={ellipse3} alt="Ellipse 3" className="ellipse3" /> */}
          </div>
          <span className={"badge"}>Torri AI Agent</span>
          <h1>Hey, welcome!</h1>
          <h1>Looking for something?</h1>
          <div className={"micContainer"}>
            <div className={"micButton"}>
              <Image src={Micicon} alt="Microphone" />
            </div>
          </div>
          <div className={"inputContainer"}>
            {isChatOpen && (
              <HeroSectionChatPopup
                onClose={() => {
                  setIsChatOpen(false);
                  setMessage("");
                }}
                // firstMessage={message}
                // threadId={threadId}
                // newThread={createThread}
              />
            )}
            <input
              type="text"
              placeholder="Ask Torri"
              // onChange={(e) => setMessage(e.target.value)}
              // onKeyDown={handleKeyPress}
              // value={message}
              onClick={() => {
                setIsChatOpen(true);
              }}
            />

            <button className={"sendButton"} onClick={handleSendMessage}>
              <Image src={sendIcon} alt="Send" />
            </button>
          </div>
          <div className={"avatars"}>
            <Image src={User1} className="user1" alt="User 1" />
            <Image src={User2} className="user2" alt="User 2" />
            <Image src={MSGIcon} className="msg-icon" alt="Message Icon" />
            <Image src={VoiceIcon} className="voice-icon" alt="Voice Icon" />
          </div>
        </div>
      </section>
    </>
  );
}

export default HeroSection;
