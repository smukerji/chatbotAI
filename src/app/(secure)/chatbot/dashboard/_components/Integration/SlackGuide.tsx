"use client";
import React, { useEffect, useRef, useState } from "react";
import arrowIcon from "../../../../../../../public/svgs/Feather Icon.svg";
import { useCookies } from "react-cookie";
import Image from "next/image";
import "../../whatsapp-integration-guide/whatsappintegration.scss";
import step1_1 from "../../../../../../../public/slack-guide-images/step1_1.png";
import step1_2 from "../../../../../../../public/slack-guide-images/step1_2.png";
import step1_3 from "../../../../../../../public/slack-guide-images/step1_3.png";
import step1_4 from "../../../../../../../public/slack-guide-images/step1_4.png";
import step1_5 from "../../../../../../../public/slack-guide-images/step1_5.png";
import step1_6 from "../../../../../../../public/slack-guide-images/step1_6.png";
import step1_7 from "../../../../../../../public/slack-guide-images/step1_7.png";
import step1_8 from "../../../../../../../public/slack-guide-images/step1_8.png";
import step1_9 from "../../../../../../../public/slack-guide-images/step1_9.png";
import step1_10 from "../../../../../../../public/slack-guide-images/step1_10.png";
import step1_11 from "../../../../../../../public/slack-guide-images/step1_11.png";
import step1_12 from "../../../../../../../public/slack-guide-images/step1_12.png";
import step1_13 from "../../../../../../../public/slack-guide-images/step1_13.png";
import step1_14 from "../../../../../../../public/slack-guide-images/step1_14.png";
import step2_1 from "../../../../../../../public/slack-guide-images/step2_1.png";
import step2_2 from "../../../../../../../public/slack-guide-images/step2_2.png";
import step3_1 from "../../../../../../../public/slack-guide-images/step3_1.png";

function SlackGuide() {
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
        (rect.top <= 90 &&
          (index === stepElements.length - 1 ||
            stepElements[index + 1].getBoundingClientRect().top > 90)) ||
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
          <ul className="step-list">
            {[1, 2, 3].map((step) => (
              <li
                key={step}
                onClick={() => handleClick(step)}
                className={selectedStep === step ? "selected" : ""}
              >
                Step {step}
              </li>
            ))}
          </ul>
        </div>

        <div className="right" ref={rightRef}>
          <h1 className="guide-heading">Slack Integration Guide</h1>

          <p className="intro-para">
            Slack integration has become an essential part of modern workflows,
            allowing seamless communication and collaboration within teams.
            Leveraging Slack&apos;s API Events and Web API opens up a myriad of
            possibilities for customizing and automating interactions. This
            comprehensive guide will walk you through the process of integrating
            Slack into your applications, harnessing the power of API Events and
            Web API to enhance productivity and efficiency.
          </p>

          <div className="step-1">
            <h2 className="guide-step-title">
              Step 1: Log in to your slack account
            </h2>

            <ol className="ordered-points">
              {/* <li>Sign in to Torri.AI and Create Your Bot:</li> */}
              <ul className="unordered-sub-points">
                <div className="steps-img">
                  <Image src={step1_1} alt="step1_1" />
                </div>

                <li>
                  Now, In another tab, type Slack API and click on the “Slack
                  API”
                </li>

                <div className="steps-img">
                  <Image src={step1_2} alt="step1_2" />
                </div>

                <li>
                  On the top right, click on Your App, then create your own app
                </li>

                <div className="steps-img">
                  <Image src={step1_3} alt="step1_3" />
                </div>

                <li>
                  Give your app a good name and select the workspace (You must
                  have already created)
                </li>

                <div className="steps-img">
                  <Image src={step1_4} alt="step1_4" />
                </div>

                <p className="ordered-points">Click on Create App</p>

                <li>
                  In the Basic Information, scroll down and in App Credential
                  Copy, App ID
                </li>

                <div className="steps-img">
                  <Image src={step1_5} alt="step1_5" />
                </div>

                <li>Now, click on OAuth & Permission</li>

                <div className="steps-img">
                  <Image src={step1_6} alt="step1_6" />
                </div>

                <li>As highlighted in the picture below, add two scope</li>

                <div className="steps-img">
                  <Image src={step1_7} alt="step1_7" />
                </div>

                <li>
                  Now scroll up and install this created Bot app to workspace as
                  shown in the picture below
                </li>

                <div className="steps-img">
                  <Image src={step1_8} alt="step1_8" />
                </div>

                <li>It will ask permission, click on allow</li>

                <div className="steps-img">
                  <Image src={step1_9} alt="step1_9" />
                </div>

                <li>
                  Once you install successfully, it will generate one OAuth
                  Token copy that
                </li>

                <div className="steps-img">
                  <Image src={step1_10} alt="step1_10" />
                </div>

                <li>
                  Now, paste App Id and OAuth Token in the Lucifer-AI as shown
                  in the below image
                </li>

                <div className="steps-img">
                  <Image src={step1_11} alt="step1_11" />
                </div>

                <p className="ordered-points">Click on “Connect”!</p>

                <li>
                  Now inside the Event Subscription, add the following URL
                  inside Request URL
                  “https://b19c-125-20-216-178.ngrok-free.app/chatbot/dashboard/slack-botintegration/webhook”
                </li>

                <div className="steps-img">
                  <Image src={step1_12} alt="step1_12" />
                </div>

                <li>
                  Once the URL is verified you are now ready to chat with your
                  Bot through Slack
                </li>

                <div className="steps-img">
                  <Image src={step1_13} alt="step1_13" />
                </div>

                <li>
                  Now subscribe Bot Event, “app_mention” and then click on save,
                  as shown in the picture
                </li>

                <div className="steps-img">
                  <Image src={step1_14} alt="step1_14" />
                </div>
              </ul>
            </ol>
          </div>

          <div className="step-2">
            <h2 className="guide-step-title">
              Step 2: Go back to your slack and you will see your app in the
              left side
            </h2>

            <ol className="ordered-points">
              {/* <li>Create a Meta (Facebook) Business Account:</li> */}
              <ul className="unordered-sub-points">
                <div className="steps-img">
                  <Image src={step2_1} alt="step2_1" />
                </div>

                <li>Now, add your app to the channel you created</li>

                <div className="steps-img">
                  <Image src={step2_2} alt="step2_2" />
                </div>
              </ul>
            </ol>
          </div>

          <div className="step-3">
            <h2 className="guide-step-title">
              Step 3: Ask question to your bot and it will response as shown in
              the below
            </h2>

            <ol className="ordered-points" style={{ marginBottom: "120px" }}>
              {/* <li>Create a Meta (Facebook) Business Account:</li> */}
              <ul className="unordered-sub-points">
                <div className="steps-img">
                  <Image src={step3_1} alt="step3_1" />
                </div>
              </ul>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

export default SlackGuide;
