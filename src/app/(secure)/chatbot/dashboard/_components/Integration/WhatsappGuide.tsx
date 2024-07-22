"use client";
import React, { useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import "../../whatsapp-integration-guide/whatsappintegration.scss";
import step2_1 from "../../../../../../../public/whataspp-guide-images/step2_1.png";
import step2_2 from "../../../../../../../public/whataspp-guide-images/step2_2.png";
import step2_3 from "../../../../../../../public/whataspp-guide-images/step2_3.png";
import step2_4 from "../../../../../../../public/whataspp-guide-images/step2_4.png";
import step2_5 from "../../../../../../../public/whataspp-guide-images/step2_5.png";
import step2_6 from "../../../../../../../public/whataspp-guide-images/step2_6.png";
import step2_7 from "../../../../../../../public/whataspp-guide-images/step2_7.png";
import step3_1 from "../../../../../../../public/whataspp-guide-images/step3_1.png";
import step3_2 from "../../../../../../../public/whataspp-guide-images/step3_2.png";
import step3_3 from "../../../../../../../public/whataspp-guide-images/step3_3.png";
import step3_4 from "../../../../../../../public/whataspp-guide-images/step3_4.png";
import step3_5 from "../../../../../../../public/whataspp-guide-images/step3_5.png";
import step4_1 from "../../../../../../../public/whataspp-guide-images/step4_1.png";
import step4_2 from "../../../../../../../public/whataspp-guide-images/step4_2.png";
import step4_3 from "../../../../../../../public/whataspp-guide-images/step4_3.png";
import step4_4 from "../../../../../../../public/whataspp-guide-images/step4_4.png";
import step4_5 from "../../../../../../../public/whataspp-guide-images/step4_5.png";
import step4_6 from "../../../../../../../public/whataspp-guide-images/step4_6.png";
import step4_7 from "../../../../../../../public/whataspp-guide-images/step4_7.png";
import step4_8 from "../../../../../../../public/whataspp-guide-images/step4_8.png";
import step4_9 from "../../../../../../../public/whataspp-guide-images/step4_9.png";
import step4_10 from "../../../../../../../public/whataspp-guide-images/step4_10.png";
import step4_11 from "../../../../../../../public/whataspp-guide-images/step4_11.png";
import step4_12 from "../../../../../../../public/whataspp-guide-images/step4_12.png";
import step4_13 from "../../../../../../../public/whataspp-guide-images/step4_13.png";
import step4_14 from "../../../../../../../public/whataspp-guide-images/step4_14.png";
import step4_15 from "../../../../../../../public/whataspp-guide-images/step4_15.png";
import step4_16 from "../../../../../../../public/whataspp-guide-images/step4_16.png";
import step4_17 from "../../../../../../../public/whataspp-guide-images/step4_17.png";
import step5_1 from "../../../../../../../public/whataspp-guide-images/step5_1.png";
import step5_2 from "../../../../../../../public/whataspp-guide-images/step5_2.png";
import step5_3 from "../../../../../../../public/whataspp-guide-images/step5_3.png";
import step5_4 from "../../../../../../../public/whataspp-guide-images/step5_4.png";
import step5_5 from "../../../../../../../public/whataspp-guide-images/step5_5.png";
import step5_6 from "../../../../../../../public/whataspp-guide-images/step5_6.png";
import step6_1 from "../../../../../../../public/whataspp-guide-images/step6_1.png";
import step6_2 from "../../../../../../../public/whataspp-guide-images/step6_2.png";
import step6_3 from "../../../../../../../public/whataspp-guide-images/step6_3.png";
import step6_4 from "../../../../../../../public/whataspp-guide-images/step6_4.png";
import step6_5 from "../../../../../../../public/whataspp-guide-images/step6_5.png";
import step7_1 from "../../../../../../../public/whataspp-guide-images/step7_1.png";
import Image from "next/image";
import arrowIcon from "../../../../../../../public/svgs/Feather Icon.svg";
import { whatsAppStepTitles } from "@/app/_helpers/constant";
import IntegrationGuideControls from "./IntegrationGuideControls";
import { useWindowSize } from "react-use";

function WhatsappGuide({ activeStep, setActiveStep, handleStep }: any) {
  const { width } = useWindowSize();

  const [cookies, setCookies] = useCookies(["userId"]);
  const [selectedStep, setSelectedStep] = useState(1);

  const rightRef = useRef<any>(null);

  const handleClick = (stepNumber: any) => {
    const stepElement = rightRef?.current.querySelector(`.step-${stepNumber}`);
    if (stepElement) {
      stepElement.scrollIntoView({
        behavior: "smooth",
      });
      setSelectedStep(stepNumber);
    }
  };

  const handleScroll = () => {
    console.log("goes uinder handle scroll");

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
    console.log("use effect triggered");

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
            {whatsAppStepTitles.map((step) => (
              <li
                key={step.id}
                onClick={() => handleClick(step.id)}
                className={selectedStep === step.id ? "selected" : ""}
              >
                {step.id}. {step.title}
              </li>
            ))}
          </ul>
        </div>
        {width < 768 && (
          <ul className="step-list">
            {whatsAppStepTitles.map((step) => (
              <li
                key={step.id}
                onClick={() => handleClick(step.id)}
                className={selectedStep === step.id ? "selected" : ""}
              >
                Step {step.id}
              </li>
            ))}
          </ul>
        )}

        <div className="right" ref={rightRef}>
          {width > 767 && (
            <IntegrationGuideControls
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              handleStep={handleStep}
            />
          )}
          {/* <h1 className="guide-heading">WhatsApp Integration Guide</h1> */}

          <div className="step-1">
            <h2 className="guide-step-title">
              Step 1: Setting Up Meta (Facebook) Business Suite and Meta for
              Developers account
            </h2>

            <ol className="ordered-points">
              <li>Create a Meta (Facebook) Business Suite account:</li>
              <ul className="unordered-sub-points">
                <li>
                  Visit{" "}
                  <a
                    href="https://business.facebook.com/"
                    target="_blank"
                    className="grey-link-with-underline"
                  >
                    Meta Business Suite.
                  </a>
                </li>
                <li>Create an account.</li>

                <li>
                  Enter your business name, your name, and business email
                  address. Click &apos;Next&apos;.
                </li>

                <div className="steps-img">
                  <Image src={step2_1} alt="step2_1" />
                </div>
              </ul>

              <li>
                Create a new Meta (Facebook) Developer account:
                <ul className="unordered-sub-points">
                  <li>
                    Visit{" "}
                    <a
                      href="https://developers.facebook.com/"
                      target="_blank"
                      className="grey-link-with-underline"
                    >
                      Meta for Developers.
                    </a>
                  </li>

                  <li>
                    <a
                      href="https://business.facebook.com/business/loginpage/?next=https%3A%2F%2Fdevelopers.facebook.com%2F&app=436761779744620&login_options%5B0%5D=FB&login_options%5B1%5D=SSO&is_work_accounts=1"
                      target="_blank"
                      className="grey-link-with-underline"
                    >
                      Log in
                    </a>
                    &nbsp;to your Meta for Developers Account.
                  </li>

                  <div className="steps-img">
                    <Image src={step2_2} alt="step2_2" />
                  </div>

                  <li>
                    Select{" "}
                    <a
                      href="https://developers.facebook.com/apps/?show_reminder=true"
                      target="_blank"
                      className="grey-link-with-underline"
                    >
                      My Apps.
                    </a>
                  </li>

                  <div className="steps-img">
                    <Image src={step2_3} alt="step2_3" />
                  </div>

                  <li>
                    Click{" "}
                    <a
                      href="https://developers.facebook.com/apps/creation/"
                      target="_blank"
                      className="grey-link-with-underline"
                    >
                      Create App
                    </a>
                  </li>

                  <div className="steps-img">
                    <Image src={step2_4} alt="step2_4" />
                  </div>

                  <li>
                    Choose User Case:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      &apos;Other&apos;
                    </span>{" "}
                    and click &apos;Next&apos;.
                  </li>

                  <div className="steps-img">
                    <Image src={step2_5} alt="step2_5" />
                  </div>
                  <li>
                    Choose App Type:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      &apos;Business&apos;
                    </span>{" "}
                    and click &apos;Next&apos;.
                  </li>

                  <div className="steps-img">
                    <Image src={step2_6} alt="step2_6" />
                  </div>

                  <li>
                    Provide app details:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      App Name, App Contact Email, Business Account (Optional),
                    </span>{" "}
                    and click &apos;
                    <span style={{ fontWeight: "bold" }}>
                      Create app&apos;.
                    </span>
                  </li>

                  <div className="steps-img">
                    <Image src={step2_7} alt="step2_7" />
                  </div>
                </ul>
              </li>
            </ol>
          </div>

          <div className="step-2">
            <h2 className="guide-step-title">
              Step 2: Setting Up WhatsApp Integration on Meta for Developers
              account
            </h2>

            <ol className="ordered-points">
              <li>Add WhatsApp to your Meta for Developers account.</li>

              <ul className="unordered-sub-points">
                <li>
                  Under the Dashboard tab, locate &apos;
                  <span style={{ fontWeight: "bold" }}>
                    Add products to your app
                  </span>
                  &apos;
                </li>

                <div className="steps-img">
                  <Image src={step3_1} alt="step3_1" />
                </div>

                <li>
                  Scroll down and choose{" "}
                  <span className="point-bold-text">&apos;WhatsApp&apos;</span>{" "}
                  for setup.
                </li>

                <div className="steps-img">
                  <Image src={step3_2} alt="step3_2" />
                </div>

                <li>
                  Select your Meta (Facebook) Business Account (if not selected
                  in step 1.2).
                </li>
                <li>
                  Navigate to{" "}
                  <span className="point-bold-text">
                    App settings &gt; Basic{" "}
                  </span>
                  from the sidebar
                </li>

                <div className="steps-img">
                  <Image src={step3_3} alt="step3_3" />
                </div>

                <li>
                  Set the Privacy Policy URL to{" "}
                  <a
                    href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}privacy`}
                    target="_blank"
                    className="grey-link-with-underline"
                  >
                    {`${process.env.NEXT_PUBLIC_WEBSITE_URL}privacy`}
                  </a>{" "}
                  and click Save changes.
                </li>

                <div className="steps-img">
                  <Image src={step3_4} alt="step3_4" />
                </div>

                <li>
                  Set App Mode to <span className="point-bold-text">Live.</span>
                </li>

                <div className="steps-img">
                  <Image src={step3_5} alt="step3_5" />
                </div>
              </ul>
            </ol>
          </div>

          <div className="step-3">
            <h2 className="guide-step-title">
              Step 3: Generate WhatsApp Token
            </h2>
            <p className="ordered-points">
              To obtain a permanent WhatsApp Access Token, follow 1 to 3 steps:
            </p>
            <ol className="ordered-points">
              <li>Create a &apos;System User&apos;:</li>
              <ul className="unordered-sub-points">
                <li>
                  Visit the{" "}
                  <a
                    href="https://business.facebook.com/"
                    target="_blank"
                    className="grey-link-with-underline"
                  >
                    Meta Business Suite.
                  </a>
                </li>
                <li>
                  Find your business account in the top-left dropdown menu and
                  click its{" "}
                  <span className="point-bold-text">Settings (gear)</span> icon.
                </li>

                <div className="steps-img">
                  <Image src={step4_1} alt="step4_1" />
                </div>

                <li>
                  Go to{" "}
                  <span className="point-bold-text">
                    <a
                      href="https://business.facebook.com/settings/system-users"
                      target="_blank"
                      className="grey-link-with-underline"
                    >
                      Users &gt; System users.
                    </a>
                  </span>{" "}
                </li>
                <div className="steps-img">
                  <Image src={step4_2} alt="step4_2" />
                </div>

                <li>
                  Add an <span className="point-bold-text">Admin</span> system
                  user.
                </li>

                <div className="steps-img">
                  <Image src={step4_3} alt="step4_3" />
                </div>
              </ul>
              <li>Add Assets.</li>
              <ul className="unordered-sub-points">
                <li>
                  After creating the system user, click on{" "}
                  <span className="point-bold-text">Add Assets.</span>
                </li>

                <div className="steps-img">
                  <Image src={step4_4} alt="step4_4" />
                </div>

                <li>
                  Navigate to{" "}
                  <span className="point-bold-text">
                    Apps &gt; &apos;Your app name&apos;.
                  </span>
                </li>
                <li>
                  Select your app and grant full control to manage the app.
                </li>
                <li>
                  Click <span style={{ fontWeight: "bold" }}>Save.</span>
                </li>
                <div className="steps-img">
                  <Image src={step4_5} alt="step4_5" />
                </div>
              </ul>
              <li>Generate System User Access Tokens.</li>
              <ul className="unordered-sub-points">
                <li>
                  Click the{" "}
                  <span className="point-bold-text">Generate New Token</span>{" "}
                  button on the system user.
                </li>
                <div className="steps-img">
                  <Image src={step4_6} alt="step4_6" />
                </div>

                <li>Choose the app that will use the token.</li>

                <li>
                  Set the token expiration to{" "}
                  <span style={{ fontWeight: "bold" }}>Never.</span>
                </li>

                <div className="steps-img">
                  <Image src={step4_7} alt="step4_7" />
                </div>

                <li>
                  Select{" "}
                  <span className="point-bold-text">
                    &apos;whatsapp_business_management&apos;
                  </span>{" "}
                  and{" "}
                  <span className="point-bold-text">
                    &apos;whatsapp_business_messaging&apos;
                  </span>{" "}
                  permissions.
                </li>

                <li>
                  Click Generate <span className="point-bold-text">token.</span>
                </li>

                <div className="steps-img">
                  <Image src={step4_8} alt="step4_8" />
                </div>

                <li>
                  Copy the access token that has been generated and store it
                  securely.{" "}
                </li>
                <li>
                  Click <span className="point-bold-text">OK.</span>
                </li>

                <div className="steps-img">
                  <Image src={step4_9} alt="step4_9" />
                </div>
              </ul>

              <li>Add a new Business Number for WhatsApp</li>
              <ul className="unordered-sub-points">
                <li>
                  You can use your own business number or utilize the provided
                  test number for your WhatsApp chatbot.
                </li>
                <li>
                  In{" "}
                  <a
                    href="https://developers.facebook.com/apps/"
                    target="_blank"
                    className="grey-link-with-underline"
                  >
                    Meta for Developers
                  </a>
                  , navigate to WhatsApp &gt; API Setup from the sidebar.
                </li>

                <div className="steps-img">
                  <Image src={step4_10} alt="step4_10" />
                </div>

                <li>
                  Proceed to{" "}
                  <span className="point-bold-text">
                    &apos;Step 5: Add a Phone Number,&apos;
                  </span>{" "}
                  click{" "}
                  <span className="point-bold-text">Add phone number.</span>
                </li>

                <div className="steps-img">
                  <Image src={step4_11} alt="step4_11" />
                </div>

                <li>Provide details required in the following form. </li>

                <div className="steps-img">
                  <Image src={step4_12} alt="step4_12" />
                </div>

                <li>Verify your number using the received code.</li>
                <li>
                  Once successfully added, select your phone number in{" "}
                  <span className="point-bold-text">Step 1 of API Setup.</span>
                </li>

                <div className="steps-img">
                  <Image src={step4_13} alt="step4_13" />
                </div>
              </ul>
              <li>Add a Payment Method</li>
              <ul className="unordered-sub-points">
                <li>
                  To send messages via WhatsApp, you need a valid payment
                  method. Visit{" "}
                  <a
                    href="https://developers.facebook.com/docs/whatsapp/pricing/"
                    target="_blank"
                    className="grey-link-with-underline"
                  >
                    here
                  </a>{" "}
                  for details.
                </li>
                <li>
                  After adding your business phone number, click{" "}
                  <span className="point-bold-text">
                    &apos;Add payment method&apos;
                  </span>{" "}
                  to address the{" "}
                  <span className="point-bold-text">
                    &apos;Missing valid payment method&apos;
                  </span>{" "}
                  alert.
                </li>

                <div className="steps-img">
                  <Image src={step4_14} alt="step4_14" />
                </div>

                <li>
                  You will be directed to your Business settings on Meta
                  Business Suite. Click{" "}
                  <span className="point-bold-text">Billing and payments.</span>{" "}
                </li>

                <div className="steps-img">
                  <Image src={step4_15} alt="step4_15" />
                </div>

                <li>
                  Click on{" "}
                  <span className="point-bold-text">
                    Payment Methods &gt; Add business payment method
                  </span>{" "}
                  and follow the prompts to add your card details.
                </li>
                <div className="steps-img">
                  <Image src={step4_16} alt="step4_15" />
                </div>
              </ul>

              <li>Test your new Business Number for WhatsApp</li>
              <ul className="unordered-sub-points">
                <li>
                  Return to Meta for Developers Dashboard, navigate to{" "}
                  <span className="point-bold-text">
                    API Setup &gt; Step 1.
                  </span>
                </li>
                <li>
                  Enter a{" "}
                  <span className="point-bold-text">&apos;To&apos;</span> number
                  to test message delivery.
                </li>
                <li>
                  Click{" "}
                  <span className="point-bold-text">
                    &apos;Send message&apos;
                  </span>{" "}
                  to verify successful message delivery.
                </li>
                <div className="steps-img">
                  <Image src={step4_17} alt="step4_16" />
                </div>
              </ul>
            </ol>
          </div>

          <div className="step-4">
            <h2 className="guide-step-title">
              Step 4: Configure WhatsApp API Webhook settings
            </h2>

            <ol className="ordered-points">
              <li>Verify WhatsApp Webhook Callback.</li>

              <ul className="unordered-sub-points">
                <li>
                  n Meta for Developers Dashboard, navigate to{" "}
                  <span className="point-bold-text">
                    WhatsApp &gt; Configuration.
                  </span>
                </li>
                <li>
                  Under <span className="point-bold-text">Webhook</span>, click
                  edit
                </li>

                <div className="steps-img">
                  <Image src={step5_1} alt="step5_1" />
                </div>

                <li>
                  Copy the <span className="point-bold-text">Callback URL</span>{" "}
                  and{" "}
                  <span className="point-bold-text">Verification Token</span>{" "}
                  from Torri.AI WhatsApp Integration modal to your Meta for
                  Developers Dashboard.
                </li>

                <div className="steps-img">
                  <Image src={step5_2} alt="step5_2" />
                </div>
                <li>
                  Click{" "}
                  <span className="point-bold-text">Verify and save.</span>
                </li>
                <div className="steps-img">
                  <Image src={step5_3} alt="step5_3" />
                </div>
              </ul>

              <li>Configure Webhook Subscription Field</li>

              <ul className="unordered-sub-points">
                <li>
                  Under &apos;
                  <span className="point-bold-text">Webhook Fields</span>
                  ,&apos; click <span className="point-bold-text">Manage.</span>
                </li>

                <div className="steps-img">
                  <Image src={step5_4} alt="step5_4" />
                </div>

                <li>
                  Find the{" "}
                  <span className="point-bold-text">&apos;messages&apos;</span>{" "}
                  field and subscribe to it by checking the box.
                </li>

                <div className="steps-img">
                  <Image src={step5_5} alt="step5_5" />
                </div>

                <li>
                  Return to Torri and click{" "}
                  <span className="point-bold-text">Verify.</span>
                </li>

                <div className="steps-img">
                  <Image src={step5_6} alt="step5_6" />
                </div>
              </ul>
            </ol>
          </div>

          <div className="step-5">
            <h2 className="guide-step-title">
              Step 5: Add WhatsApp Account to your Torri Chatbot
            </h2>

            <ol className="ordered-points">
              <li>Retrieve WhatsApp Account Information</li>

              <ul className="unordered-sub-points">
                <li>
                  In Meta for Developers Dashboard, navigate to{" "}
                  <span className="point-bold-text">
                    App Settings &gt; Basic
                  </span>
                </li>
                <li>
                  Copy <span className="point-bold-text">App secret</span> and
                  paste it in Torri integration modal in{" "}
                  <span className="point-bold-text">Facebook App Secret</span>
                </li>

                <div className="steps-img">
                  <Image src={step6_1} alt="step6_1" />
                </div>

                <li>
                  Copy the the{" "}
                  <span className="point-bold-text">
                    Temporary access token
                  </span>{" "}
                  from{" "}
                  <span className="point-bold-text">
                    Whatsapp &gt; API Setup
                  </span>{" "}
                  into Torri integration modal under{" "}
                  <span className="point-bold-text">
                    WhatsApp Access Token.
                  </span>
                </li>
                <div className="steps-img">
                  <Image src={step6_2} alt="step6_2" />
                </div>

                <li>
                  Click <span className="point-bold-text">Add Account.</span>
                </li>

                <div className="steps-img">
                  <Image src={step6_3} alt="step6_3" />
                </div>

                <li>
                  Copy your{" "}
                  <span className="point-bold-text">
                    Phone Number, Phone Number ID
                  </span>
                  , and{" "}
                  <span className="point-bold-text">
                    WhatsApp Business Account ID
                  </span>{" "}
                  into the Torri WhatsApp Integration modal.
                </li>

                <div className="steps-img">
                  <Image src={step6_4} alt="step6_4" />
                </div>

                <li>
                  Click <span className="point-bold-text">Save</span> to
                  complete integration.
                </li>

                <div className="steps-img">
                  <Image src={step6_5} alt="step6_5" />
                </div>
              </ul>
            </ol>
          </div>

          <div className="step-6">
            <h2 className="guide-step-title">
              Step 6: Confirm Integration Completion
            </h2>

            <p className="ordered-points">
              Congratulations! Your chatbot is now ready to assist clients via
              your WhatsApp number.
            </p>
            <p className="ordered-points">
              You can enable, disable, edit, or delete your WhatsApp integration
              settings as needed.
            </p>

            <ol className="ordered-points">
              <ul className="unordered-sub-points">
                <div className="steps-img">
                  <Image src={step7_1} alt="step7_1" />
                </div>
              </ul>
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}

export default WhatsappGuide;
