"use client";

import React, { useState } from "react";
import "./hero-header.scss";
import Image from "next/image";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import dynamic from "next/dynamic";

const AuthBtn = dynamic(() => import("../AuthBtn"), { ssr: false });

function HeroHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  return (
    <div className="hero-header">
      <div className="header-title-container">
        <Image className="logo" src={LuciferLogo} alt="img-logo" />

        <div className={`hamburger-menu-icon`} onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>

        <div className={`hamburger-menu ${menuOpen ? "open" : ""}`}>
          <div className={`navbar `}>
            <ul>
              <li>
                <a href="#features">Features</a>
              </li>

              <li>
                <a href="/home/pricing">Pricingggg</a>
              </li>

              <li>
                <a href="#service-offerings">Service Offerings</a>
              </li>
              <li>
                <a href="/blog">Blog</a>
              </li>
            </ul>
          </div>

          <div className="login-register-container">
            {/* If user is logged in display my Chatbot else try for free */}
            <AuthBtn />
          </div>
        </div>
      </div>

      <div className="header-content-container">
        <p className="header-text">
          Enhance Your Business with Custom GPT: Revolutionise Customer &
          Insights
        </p>

        <p className="header-sub-text">
          Unlock the full potential of AI for your business with our Custom
          ChatGPT solution. Torri AI is dedicated to transforming the way
          businesses interact with data. By harnessing the power of advanced AI
          technologies, Torri AI provides innovative solutions that streamline
          data analysis and insight generation. Our mission is to make data
          accessible and actionable for all, through the power of conversational
          AI
        </p>

        <a
          style={{ color: "white", textDecoration: "none" }}
          href="#contact-us"
        >
          <button className="request-demo-btn">Book a Demo</button>
        </a>
        {/* <div className="request-demo-email-container">
          <div className="email-input">
            <Image src={smsIcon} alt="sms-icon" />
            <input type="text" placeholder="Email Address" />
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default HeroHeader;
