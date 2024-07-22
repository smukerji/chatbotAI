"use client";
import Image from "next/image";
import { useWindowSize } from "react-use";
import React, { useEffect, useState } from "react";
import WhatsappGuide from "./WhatsappGuide";
import SlackGuide from "./SlackGuide";
import TelegramGuide from "./TelegramGuide";
import { useRouter } from "next/navigation";
import IntegrationGuideControls from "./IntegrationGuideControls";

function IntegrationGuide() {
  const { width } = useWindowSize();
  const [activeStep, setActiveStep] = useState(1);
  const router = useRouter();

  function handleStep(step: number) {
    setActiveStep(step);

    // Update the 'guide' query parameter
    const newGuide =
      step == 1
        ? "whatsapp"
        : step == 2
        ? "slack"
        : step == 3
        ? "telegram"
        : "";

    // Push the new URL to the history
    router.push(`/chatbot/dashboard/integration-guide?guide=${newGuide}`);
  }

  useEffect(() => {
    // Create a URLSearchParams object from the current URL's search string
    const params = new URLSearchParams(window.location.search);

    // Get the value of the 'guide' query parameter
    const guideValue = params.get("guide");

    // Set the guide value in the state
    const activeGuide =
      guideValue == "whatsapp"
        ? 1
        : guideValue == "slack"
        ? 2
        : guideValue == "telegram"
        ? 3
        : 1;
    setActiveStep(activeGuide);
  }, []);

  return (
    <>
      <div className="integration-wrapper">
        {width < 768 && (
          <IntegrationGuideControls
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            handleStep={handleStep}
          />
        )}
        {/* <div className="header">
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
                <Image
                  src={slackIcon}
                  alt="slack-icon"
                  height={35}
                  width={35}
                />
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
        </div> */}

        <div className="guides">
          {activeStep == 1 && (
            <WhatsappGuide
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              handleStep={handleStep}
            />
          )}
          {activeStep == 2 && (
            <SlackGuide
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              handleStep={handleStep}
            />
          )}
          {activeStep == 3 && (
            <TelegramGuide
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              handleStep={handleStep}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default IntegrationGuide;
