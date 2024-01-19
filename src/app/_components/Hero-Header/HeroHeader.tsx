"use client";

import React, { useEffect } from "react";
import "./hero-header.scss";
import { Button, Input, Space } from "antd";
import Image from "next/image";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import smsIcon from "../../../../public/svgs/sms.svg";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
const AuthBtn = dynamic(() => import("../AuthBtn"), { ssr: false });

function HeroHeader() {
  return (
    <div className="hero-header">
      <div className="header-title-container">
        <Image className="logo" src={LuciferLogo} alt="img-logo" />

        <div className="navbar">
          <ul>
            <li>
              <a href="#">How It Works</a>
            </li>

            <li>
              <a href="#">API</a>
            </li>

            <li>
              <a href="#">Pricing</a>
            </li>
          </ul>
        </div>

        <div className="login-register-container">
          {/* If user is logged in display my Chatbot else try for free */}
          <AuthBtn />
        </div>
      </div>

      <div className="header-content-container">
        <p className="header-text">Welcome to AI Chatbot</p>

        <p className="header-sub-text">
          At Lucifer.AI, we bring you the future of AI-driven conversations.
          Step into a world where your online interactions are powered by
          intelligent machines. We are thrilled to welcome you to a new era of
          conversational excellence. Say Hello to Lucifer.AI, your intelligent
          companion in the digital realm
        </p>

        <div className="request-demo-email-container">
          <div className="email-input">
            <Image src={smsIcon} alt="sms-icon" />
            <input type="text" placeholder="Email Address" />
          </div>
          <button className="request-demo-btn">Book a Demo</button>
        </div>
      </div>
    </div>
  );
}

export default HeroHeader;
