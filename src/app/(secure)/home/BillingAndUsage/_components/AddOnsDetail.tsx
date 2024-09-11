import Image from "next/image";
import React, { useEffect, useState } from "react";
import ArrowDown from "../../../../../../public/svgs/arrow-down-bold.svg";
import { Button, message, Modal } from "antd";
import WhatsappIcon from "../../../../../../public/svgs/whatsapp-icon.svg";
import TelegramIcon from "../../../../../../public/svgs/telegram-svg.svg";
import SlackIcon from "../../../../../../public/svgs/slack-svg.svg";
import TrainingDataIcon from "../../../../../../public/svgs/training-data.svg";
import MsgIcon from "../../../../../../public/svgs/messages-svg.svg";
import CHIcon from "../../../../../../public/svgs/conversationhistory.svg";
import LeadsIcon from "../../../../../../public/svgs/leads.svg";
import axios from "axios";
import { useCookies } from "react-cookie";
import moment from "moment";
import { useRouter } from "next/navigation";

const whatsappPriceIdMonthly: any =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY;
const whatsappPriceIdYearly: any =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_YEARLY;
const slackPriceIdMonthly: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID_MONTHLY;
const slackPriceIdYearly: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID_YEARLY;
const telegramPriceIdMonthly: any =
  process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_MONTHLY;
const telegramPriceIdYearly: any =
  process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_YEARLY;

const trainingDataMonthly: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;
const trainingDataYearly: any = process.env.NEXT_PUBLIC_TRAINING_DATA_YEARLY;

const conversationHistoryMonthly: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MONTHLY;
const conversationHistoryYearly: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_YEARLY;

const leadsMonthly: any = process.env.NEXT_PUBLIC_LEADS_MONTHLY;
const leadsYearly: any = process.env.NEXT_PUBLIC_LEADS_YEARLY;

const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;

const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;

function formatDate(timestamp: number) {
  const timestampMS = timestamp * 1000; // Convert Unix timestamp to milliseconds

  // Create a Date object
  const date = new Date(timestampMS);

  // Format the date to DD/MM/YYYY
  const formattedDate = date.toLocaleDateString("en-GB"); // en-GB formats it as DD/MM/YYYY

  return formattedDate;
}

function AddOnsDetail({ date }: any) {
  const formattedDate = moment(date, "MMM DD, YYYY").format("DD/MM/YYYY");
  const [isOpen, setIsOpen] = useState(true);
  const [cookies, setCookie] = useCookies(["userId"]);
  const [addonData, setAddonData] = useState<any>();
  const [endDate, setEndDate] = useState("");
  const [interval, setInterval] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [addonToCancel, setAddonToCancel] = useState<any>(null);
  const [isNextAddon, setIsNextAddon] = useState<any>(null);
  const router = useRouter();

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  // Utility function to check if a plan is active
  const isPlanActive = (planId: number) => {
    return addonData?.some((item: any) => item.id === planId);
  };

  const cancelAddon = async (priceId: any, planName: string) => {
    setAddonToCancel({ id: priceId, name: planName });
    setModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (addonToCancel) {
      // cancelAddon(addonToCancel.id, addonToCancel.name);
      try {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api/cancel-plan/addon`,
          {
            u_id: cookies.userId,
            price_id: addonToCancel.id,
            plan_name: addonToCancel.name,
          }
        );

        if (response.data.status) {
          message.success("Addon Cancelled Successfully");
          fetchAddonDetail();
        } else {
          message.error("Failed to cancel addon. Please, try again.");
        }
      } catch (error) {
        message.error("Failed to cancel addon. Please, try again.");
      }
      setModalOpen(false);
      setAddonToCancel(null);
    }
  };

  const fetchAddonDetail = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api/cancel-plan/addon`,
        {
          u_id: cookies.userId,
        }
      );

      setEndDate(formatDate(response.data.endDate));
      setAddonData(response.data.subscriptionData);
      setInterval(response.data.subscriptionData[0].interval);
      setIsNextAddon(response.data.addonDetails);
    } catch (error) {
      console.log("error", error);
    }
  };

  const addAddon = () => {
    router.push("/home/pricing");
  };

  useEffect(() => {
    fetchAddonDetail();
  }, []);

  return (
    <>
      <Modal
        title="Are you sure to cancel the add-on?"
        open={isModalOpen}
        onOk={handleConfirmCancel}
        onCancel={() => setModalOpen(false)}
        cancelText="Keep Add-On"
        okText="Cancel Add-On"
        closeIcon={null}
        className="cancel-addon"
        centered
      >
        <p>
          If you cancel, your add-on will be expired on {formattedDate} at
          0.00am
        </p>
      </Modal>
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
                  {(isPlanActive(whatsappPriceIdMonthly) ||
                    isPlanActive(whatsappPriceIdYearly)) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {(isPlanActive(whatsappPriceIdMonthly) ||
                  isPlanActive(whatsappPriceIdYearly)) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextWhatsapp === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}

              {/* if plan is active show cancel button */}
              {isNextAddon?.isNextWhatsapp === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : (
                isPlanActive(whatsappPriceIdMonthly) ||
                (isPlanActive(whatsappPriceIdYearly) ? (
                  <p
                    className="cancel-plan"
                    onClick={() =>
                      cancelAddon(
                        interval === "month"
                          ? whatsappPriceIdMonthly
                          : whatsappPriceIdYearly,
                        "Whatsapp"
                      )
                    }
                  >
                    Cancel
                  </p>
                ) : (
                  <button
                    className="app-integration-price-btn"
                    onClick={addAddon}
                  >
                    <span className="app-integration-price-btn-text">
                      Get Add-on
                    </span>
                  </button>
                ))
              )}
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
                  {(isPlanActive(telegramPriceIdMonthly) ||
                    isPlanActive(telegramPriceIdYearly)) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {(isPlanActive(telegramPriceIdYearly) ||
                  isPlanActive(telegramPriceIdMonthly)) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextTelegram === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}

              {isNextAddon?.isNextTelegram === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : (
                isPlanActive(telegramPriceIdMonthly) ||
                (isPlanActive(telegramPriceIdYearly) ? (
                  <p
                    className="cancel-plan"
                    onClick={() =>
                      cancelAddon(
                        interval === "month"
                          ? telegramPriceIdMonthly
                          : telegramPriceIdYearly,
                        "Telegram"
                      )
                    }
                  >
                    Cancel
                  </p>
                ) : (
                  <button
                    className="app-integration-price-btn "
                    onClick={addAddon}
                  >
                    <span className="app-integration-price-btn-text">
                      Get Add-on
                    </span>
                  </button>
                ))
              )}
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
                  {(isPlanActive(slackPriceIdMonthly) ||
                    isPlanActive(slackPriceIdYearly)) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {(isPlanActive(slackPriceIdMonthly) ||
                  isPlanActive(slackPriceIdYearly)) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextSlack === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}

              {isNextAddon?.isNextSlack === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : isPlanActive(slackPriceIdMonthly) ||
                isPlanActive(slackPriceIdYearly) ? (
                <p
                  className="cancel-plan"
                  onClick={() =>
                    cancelAddon(
                      interval === "month"
                        ? slackPriceIdMonthly
                        : slackPriceIdYearly,
                      "Slack"
                    )
                  }
                >
                  Cancel
                </p>
              ) : (
                <button
                  className="app-integration-price-btn"
                  onClick={addAddon}
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              )}
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
                  {(isPlanActive(trainingDataMonthly) ||
                    isPlanActive(trainingDataYearly)) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {(isPlanActive(trainingDataMonthly) ||
                  isPlanActive(trainingDataYearly)) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextTrainingData === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              {isNextAddon?.isNextTrainingData === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : isPlanActive(trainingDataMonthly) ||
                isPlanActive(trainingDataYearly) ? (
                <p
                  className="cancel-plan"
                  onClick={() =>
                    cancelAddon(
                      interval === "month"
                        ? trainingDataMonthly
                        : trainingDataYearly,
                      "TrainingData"
                    )
                  }
                >
                  Cancel
                </p>
              ) : (
                <button
                  className="app-integration-price-btn"
                  onClick={addAddon}
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              )}
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
                  {isPlanActive(msgSmall) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {isPlanActive(msgSmall) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextMsgSmall === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              {isNextAddon?.isNextMsgSmall === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : isPlanActive(msgSmall) ? (
                <p
                  className="cancel-plan"
                  onClick={() => cancelAddon(msgSmall, "MsgSmall")}
                >
                  Cancel
                </p>
              ) : (
                <button
                  className="app-integration-price-btn"
                  onClick={addAddon}
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              )}
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
                  {isPlanActive(msgLarge) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {isPlanActive(msgLarge) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextMsgLarge === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              {isNextAddon?.isNextMsgLarge === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : isPlanActive(msgLarge) ? (
                <p
                  className="cancel-plan"
                  onClick={() => cancelAddon(msgLarge, "MsgLarge")}
                >
                  Cancel
                </p>
              ) : (
                <button
                  className="app-integration-price-btn"
                  onClick={addAddon}
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              )}
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
                  {(isPlanActive(conversationHistoryMonthly) ||
                    isPlanActive(conversationHistoryYearly)) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {(isPlanActive(conversationHistoryMonthly) ||
                  isPlanActive(conversationHistoryYearly)) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextConversationHistory === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              {isNextAddon?.isNextConversationHostory === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : isPlanActive(conversationHistoryMonthly) ||
                isPlanActive(conversationHistoryYearly) ? (
                <p
                  className="cancel-plan"
                  onClick={() =>
                    cancelAddon(
                      interval === "month"
                        ? conversationHistoryMonthly
                        : conversationHistoryYearly,

                      "ConversationHistory"
                    )
                  }
                >
                  Cancel
                </p>
              ) : (
                <button
                  className="app-integration-price-btn"
                  onClick={addAddon}
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              )}
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
                  {(isPlanActive(leadsMonthly) ||
                    isPlanActive(leadsYearly)) && (
                    <div className="plan-duration">
                      <span className="plan-duration-text">
                        Billed {interval === "month" ? "Monthly" : "Yearly"}
                      </span>
                    </div>
                  )}
                </div>

                {(isPlanActive(leadsMonthly) || isPlanActive(leadsYearly)) && (
                  <div className="next-renewal-date">
                    <div className="next-renewal-date-text">
                      {isNextAddon?.isNextLeads === false
                        ? "Expiry Date:"
                        : "Auto Renewal duo on"}
                    </div>
                    <div className="next-renewal-date-date">{endDate}</div>
                  </div>
                )}
              </div>
              {/* <Button className="pricing-button">Get Add-on</Button> */}
              {isNextAddon?.isNextLeads === false ? (
                <button
                  className="app-integration-price-btn cursor-disabled"
                  disabled
                >
                  <span className="app-integration-price-btn-text">
                    Get Add-on
                  </span>
                </button>
              ) : isPlanActive(leadsMonthly) || isPlanActive(leadsYearly) ? (
                <p
                  className="cancel-plan"
                  onClick={() =>
                    cancelAddon(
                      interval === "month" ? leadsMonthly : leadsYearly,
                      "Leads"
                    )
                  }
                >
                  Cancel
                </p>
              ) : (
                <button className="app-integration-price-btn">
                  <span
                    className="app-integration-price-btn-text"
                    onClick={addAddon}
                  >
                    Get Add-on
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AddOnsDetail;
