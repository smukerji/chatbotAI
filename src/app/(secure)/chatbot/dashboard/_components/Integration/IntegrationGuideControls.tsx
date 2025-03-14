"use client";
import React from "react";
import whatsAppIcon from "../../../../../../../public/whatsapp.png";
import telegramIcon from "../../../../../../../public/telegram.svg";
import slackIcon from "../../../../../../../public/slackwhite.png";
import Image from "next/image";

function IntegrationGuideControls({
  activeStep,
  setActiveStep,
  handleStep,
}: any) {
  return (
    <div className="header">
      <p className="intro">Integration Guide</p>
      <div className="guide-btns">
        <button
          className={`btn ${activeStep == 1 ? "active" : ""}`}
          onClick={() => handleStep(1)}
        >
          <span>
            <Image
              src={whatsAppIcon}
              alt="whatsapp-icon"
              height={35}
              width={35}
            />
          </span>
          Whatsapp
        </button>
        <button
          className={`btn ${activeStep == 2 ? "active" : ""}`}
          onClick={() => handleStep(2)}
        >
          <span>
            <Image src={slackIcon} alt="slack-icon" height={35} width={35} />
          </span>
          Slack
        </button>
        <button
          className={`btn ${activeStep == 3 ? "active" : ""}`}
          onClick={() => handleStep(3)}
        >
          <span>
            <Image
              src={telegramIcon}
              alt="telegram-icon"
              height={35}
              width={35}
            />
          </span>
          Telegram
        </button>
      </div>
    </div>
  );
}

export default IntegrationGuideControls;
