"use client";
import React from "react";
import "./telegram-guide.scss";
import telegramImage from "../../../../../../public/create-chatbot-svgs/telegram.png";
import Image from "next/image";
import arrowIcon from "../../../../../../public/svgs/Feather Icon.svg";

function Page() {
  return (
    <div className="telegram-guide-parent">
      <div
        className="back-arrow"
        onClick={() => {
          window.history.back();
        }}
        style={{ cursor: "pointer" }}
      >
        <Image
          src={arrowIcon}
          alt="arrow-icon"
          style={{ transform: "rotate(180deg)" }}
        />
        <span>back</span>
      </div>
      <div className="telegram-guide-container">
        <h1 className="telegram-title">Telegram Integration Guide</h1>
        <div className="telegram-steps">
          <h2 className="telegram-step">
            1. Search BotFather in your Telegram app
          </h2>
          <h2 className="telegram-step">
            2. Type <span>/newbot</span>
          </h2>
          <h2 className="telegram-step">3. Choose name for your bot</h2>
          <h2 className="telegram-step">4. Choose username for your bot</h2>
          <h2 className="telegram-step">5. Now you will receive token</h2>
          <h2 className="telegram-step">
            6. Copy token and paste in our torri.AI telegram modal and{" "}
            <span>click</span> connect
          </h2>
        </div>
        <Image
          className="telegram-guide-img"
          src={telegramImage}
          alt="telegram-image"
        />
      </div>
    </div>
  );
}

export default Page;
