"use client";
import React, { useEffect, useRef, useState } from "react";
import arrowIcon from "../../../../../../../public/svgs/Feather Icon.svg";
import { useCookies } from "react-cookie";
import Image from "next/image";
import "../../whatsapp-integration-guide/whatsappintegration.scss";
import step2_1 from "../../../../../../../public/telegram-guide-images/step1_1.png";
import IntegrationGuideControls from "./IntegrationGuideControls";
import { useWindowSize } from "react-use";

function TelegramGuide({ activeStep, setActiveStep, handleStep }: any) {
  const { width } = useWindowSize();

  const [selectedStep, setSelectedStep] = useState(1);

  const rightRef = useRef<any>(null);

  const handleClick = (stepNumber: any) => {
    const stepElement = rightRef?.current.querySelector(`.step-${stepNumber}`);
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: "smooth" });
      setSelectedStep(stepNumber);
    }
  };

  const handleScroll = () => {
    const rightDiv = rightRef.current;
    const stepElements = rightDiv.querySelectorAll('[class^="step-"]');
    let currentStep = 1;

    stepElements.forEach((stepElement: any, index: any) => {
      const rect = stepElement.getBoundingClientRect();

      if (
        (rect.top <= 130 &&
          (index === stepElements.length - 1 ||
            stepElements[index + 1].getBoundingClientRect().top > 130)) ||
        (index === stepElements.length - 1 && rect.bottom <= window.innerHeight)
      ) {
        // If the top of the stepElement is above the window top and the next stepElement is below the window top (or there's no next stepElement)
        currentStep = index + 1; // Update currentStep directly based on index
      }
    });

    // Update selectedStep state to reflect the current visible step
    setSelectedStep(currentStep);
  };

  useEffect(() => {
    const sectionRight = document.querySelector(".right");
    sectionRight?.addEventListener("scroll", handleScroll);
    return () => {
      sectionRight?.removeEventListener("scroll", handleScroll);
    };
  });
  return (
    <>
      <div className="whatsapp-container">
        <div className="left">
          {/* <div
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
          </div> */}
          {/* <ul className="step-list">
            {[{ id: 1, title: "Telegram Integration Guide" }].map((step) => (
              <li
                key={step.id}
                onClick={() => handleClick(step.id)}
                className={selectedStep === step.id ? "selected" : ""}
              >
                {step.id}. {step.title}
              </li>
            ))}
          </ul> */}
        </div>
        {/* {width < 768 && (
          <ul className="step-list">
            {[{ id: 1, title: "Telegram Integration Guide" }].map((step) => (
              <li
                key={step.id}
                onClick={() => handleClick(step.id)}
                className={selectedStep === step.id ? "selected" : ""}
              >
                Step {step.id}
              </li>
            ))}
          </ul>
        )} */}

        <div className="right" ref={rightRef}>
          {width > 767 && (
            <IntegrationGuideControls
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              handleStep={handleStep}
            />
          )}
          {/* <h1 className="guide-heading">Telegram Integration Guide</h1> */}

          <div className="step-1">
            {/* <h2 className="guide-step-title">
              Step 1: Log in to your slack account
            </h2> */}

            <ul className="ordered-points" style={{ listStyleType: "none" }}>
              <li>
                <span>Step 1:</span> Search BotFather in your Telegram app
              </li>
              <li>
                <span>Step 2:</span> Type{" "}
                <span style={{ fontWeight: "bold" }}>/newbot</span>
              </li>
              <li>
                <span>Step 3:</span>Choose name for your bot
              </li>
              <li>
                <span>Step 4:</span>Choose username for your bot
              </li>
              <li>
                <span>Step 5:</span>Now you will receive token
              </li>
              <li>
                <span>Step 6:</span> Copy token and paste in our torri.AI
                telegram modal and{" "}
                <span style={{ fontWeight: "bold" }}>click</span> connect
              </li>

              <ul className="unordered-sub-points">
                <div className="steps-img">
                  <Image src={step2_1} alt="step1_1" />
                </div>
              </ul>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default TelegramGuide;
