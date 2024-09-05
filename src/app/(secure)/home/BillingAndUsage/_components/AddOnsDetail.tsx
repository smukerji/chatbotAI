import Image from "next/image";
import React, { useState } from "react";
import ArrowDown from "../../../../../../public/svgs/arrow-down-bold.svg";
import { Button } from "antd";
import WhatsappIcon from "../../../../../../public/svgs/whatsapp-icon.svg";
import TelegramIcon from "../../../../../../public/svgs/telegram-svg.svg";
import SlackIcon from "../../../../../../public/svgs/slack-svg.svg";
import TrainingDataIcon from "../../../../../../public/svgs/training-data.svg";
import MsgIcon from "../../../../../../public/svgs/messages-svg.svg";
import CHIcon from "../../../../../../public/svgs/conversationhistory.svg";
import LeadsIcon from "../../../../../../public/svgs/leads.svg";

function AddOnsDetail() {
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };
  return (
    <>
      <div className="add-ons-detail">
        <p className="add-ons-head add-ons-title" onClick={handleClick}>
          Add-ons{" "}
          <span>
            <Image src={ArrowDown} alt="down-arrow" />
          </span>
        </p>

        {isOpen && (
          <div className="pricing-grid">
            {/* ------------------------------Whatsapp------------------------------ */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={WhatsappIcon} alt="whatsapp" />
                    </span>{" "}
                    Whatsapp
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* ------------------------------Telegram------------------------------ */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={TelegramIcon} alt="TelegramIcon" />
                    </span>{" "}
                    Telegram
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* ----------------------------------Slack------------------------------------ */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={SlackIcon} alt="slackicon" />
                    </span>{" "}
                    Slack
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* --------------------------------------Training Data------------------------------- */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={TrainingDataIcon} alt="training-icon" />
                    </span>{" "}
                    Training Data
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* -----------------------------------------5K msgs----------------------------------------- */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={MsgIcon} alt="MsgIcon" />
                    </span>{" "}
                    5K Messages
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* --------------------------------------------10K msgs----------------------------------------- */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={MsgIcon} alt="MsgIcon" />
                    </span>{" "}
                    10K Messages
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* -----------------------------------------------Conversation history---------------------- */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={CHIcon} alt="CHIcon" />
                    </span>{" "}
                    Conversation History
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>

            {/* ------------------------------------------------Unlimited Lead--------------------------------- */}
            <div className="pricing-card">
              <div className="pricing-info">
                <div className="title-interval">
                  <p className="pricing-title">
                    <span>
                      <Image src={LeadsIcon} alt="leadsIcon" />
                    </span>{" "}
                    Unlimited Leads
                  </p>
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                </div>

                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{"03/04/24"}</div>
                </div>
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              <p className="cancel-plan">Cancel</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AddOnsDetail;
