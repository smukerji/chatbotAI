"use client";
import React, { use, useState } from "react";
import "./hero-section.scss";
import Image from "next/image";
import Link from "next/link";
import cancelIcon from "../../../../public/sections-images/header-background/clipboard-close.webp";
import messageIcon from "../../../../public/sections-images/header-background/message-text.svg";
import HeaderImage from "../../../../public/sections-images/header-background/Group1.svg";
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
import jessicaImg from "../../../../public/sections-images/header-background/jessica.png";
import davidImg from "../../../../public/sections-images/header-background/david.png";
import iconCall from "../../../../public/sections-images/header-background/call-outgoing.svg";
import iconMessage from "../../../../public/sections-images/header-background/message-text-2.svg";
import iconResponse from "../../../../public/sections-images/header-background/messages.svg";
import iconConversion from "../../../../public/sections-images/header-background/icon-cost.svg";
import iconCost from "../../../../public/sections-images/header-background/favorite-chart.svg";
import iconScroll from "../assets/icon-scroll.svg";
import { useRouter } from "next/navigation";

function HeroSection() {
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();

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
      {/* <div className="hero-section-container">
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

      {/* <section className={"heroSection"}>
        <div className={"container"}>
          <div className="ellipses">
            <Image src={ellipse1} alt="Ellipse 1" className="ellipse1" />
            <Image src={ellipse2} alt="Ellipse 2" className="ellipse2" />
            <Image src={ellipse3} alt="Ellipse 3" className="ellipse3" />
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
              />
            )}
            <input
              type="text"
              placeholder="Ask Torri"
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
      </section> */}

      <section className="hero-section">
        <div className="top-section">
          <div className="left">
            <h1>
              Reimagine Your <br /> Team with AI-
              <br />
              Powered Digital <br />
              Workers
            </h1>
            <p>
              Always-on. Always-learning. Always-ready. Chat or talk to our
              multimodal AI agents that think, respond, and grow with your
              business.
            </p>
            <div className="buttons">
              <button className="primary">Talk to an Agent Now</button>
              <button className="secondary">Create Your Own AI Agent</button>
            </div>
          </div>
          <div className="right">
            {/* Left Card: Image Top */}
            <div className="agent-card image-top">
              <div
                className="image-section"
                style={{ backgroundColor: "#fef08a" }}
              >
                <Image src={jessicaImg} alt="Jessica" />
                <div className="overlay-text">
                  <h3>Jessica</h3>
                  <p>Torri&apos;s Customer Service Agent</p>
                  <div className="actions">
                    <button
                      className="call"
                      onClick={() => router.push("/home/call?agent=jessica")}
                    >
                      <Image src={iconCall} alt="Call" />
                      Call
                    </button>
                    <button
                      className="message"
                      onClick={() => router.push("/home/chat?agent=jessica")}
                    >
                      <Image src={iconMessage} alt="Message" />
                      Message
                    </button>
                  </div>
                </div>
              </div>
              <div className="info-section">
                <div className="badge-group">
                  <p className="badge-time">24h</p>
                  <p className="badge-support">Support</p>
                </div>
              </div>
            </div>

            {/* Right Card: Image Bottom */}
            <div className="agent-card image-bottom">
              <div className="badge-group-second">
                <p className="badge-24">
                  <span className="badge-time">24h</span>
                  <span className="badge-support">Support</span>
                </p>
                <span className="badge-7">
                  <span className="badge-time">7d</span>
                  <span className="badge-support">Support</span>
                </span>
              </div>
              <div
                className="image-section"
                style={{ backgroundColor: "#a7f3d0" }}
              >
                <Image src={davidImg} alt="David" />
                <div className="overlay-text">
                  <h3>David</h3>
                  <p>Torri&apos;s Sales Agent</p>
                  <div className="actions">
                    <button
                      className="call"
                      onClick={() => router.push("/home/call?agent=david")}
                    >
                      <Image src={iconCall} alt="Call" />
                      Call
                    </button>
                    <button
                      className="message"
                      onClick={() => router.push("/home/chat?agent=david")}
                    >
                      <Image src={iconMessage} alt="Message" />
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="metrics">
        <div className="metrics-intro">
          <p className="subheading">
            While your team sleeps, your AI agents deliver.
          </p>
          <div className="intro-content">
            <div className="left-intro">
              <h2>
                AI Workers That Feel Human. <br />
                Perform Superhuman.
              </h2>
            </div>
            <div className="right-intro">
              <p className="description">
                Torri blends emotional intelligence with business logic. Our
                agents learn your products, adapt to your brand, and scale with
                your needs — instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon response-rate">
              <Image src={iconResponse} alt="Response Rate" />
            </div>
            <p className="label">Response Rate</p>
            <h3>3x Faster</h3>
          </div>
          <div className="metric-card">
            <div className="metric-icon conversion-rate">
              <Image src={iconConversion} alt="Ecommerce Conversion" />
            </div>
            <p className="label">Ecommerce Conversion</p>
            <h3>62% Higher</h3>
          </div>
          <div className="metric-card">
            <div className="metric-icon operational-rate">
              <Image src={iconCost} alt="Operational Cost" />
            </div>
            <p className="label">Operational Cost</p>
            <h3>35% Lower</h3>
          </div>
        </div>
      </div>
    </>
  );
}

export default HeroSection;
