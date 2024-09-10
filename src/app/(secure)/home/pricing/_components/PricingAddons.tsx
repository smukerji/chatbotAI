import Image from "next/image";
import React, { useState } from "react";
import zoho from "../../../../../../public/svgs/zohocrm.svg";
import whatsapp from "../../../../../../public/whatsapp.webp";
import telegram from "../../../../../../public/telegram.webp";
import hubspot from "../../../../../../public/hubspot.webp";
import slack from "../../../../../../public/slack.svg";
import messenger from "../../../../../../public/svgs/messenger.svg";
import sevenrooms from "../../../../../../public/svgs/sevenrooms.svg";
import mindbody from "../../../../../../public/svgs/mindbody.svg";
import instagram from "../../../../../../public/svgs/instagram.svg";
import { Button } from "antd";
import ArrowDown from "../../../../../../public/svgs/arrow-down-bold.svg";
import Msgs from "../../../../../../public/svgs/messages-svg.svg";
import Training from "../../../../../../public/svgs/training-data.svg";
import Conversation from "../../../../../../public/svgs/conversationhistory.svg";
import Leads from "../../../../../../public/svgs/leads.svg";
import Sentiment from "../../../../../../public/svgs/sentimentdashboard.svg";
import Onboarding from "../../../../../../public/svgs/onboarding.svg";

const trainingDataMonthly: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;
const trainingDataYearly: any = process.env.NEXT_PUBLIC_TRAINING_DATA_YEARLY;
const conversationHistoryMonthly: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MONTHLY;
const conversationHistoryYearly: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_YEARLY;
const leadsMonthly: any = process.env.NEXT_PUBLIC_LEADS_MONTHLY;
const leadsYearly: any = process.env.NEXT_PUBLIC_LEADS_YEARLY;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const whatsappIdMonthly: any = process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY;
const whatsappIdYearly: any = process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_YEARLY;
const slackIdMonthly: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID_MONTHLY;
const slackIdYearly: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID_YEARLY;
const telegramIdMonthly: any = process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_MONTHLY;
const telegramIdYearly: any = process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_YEARLY;
const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;

function findPrice(prices: any, envPriceId: string) {
  const priceObj = prices.find(
    (price: any) => price.priceId === envPriceId
    // && price.interval === interval
  );
  return priceObj ? priceObj.unit_amount / 100 : null;
}

function PricingAddons({ pricing, handleAddonClick, isYearlyPlan }: any) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const msgSmallPrice = findPrice(pricing, msgSmall);
  const msgLargePrice = findPrice(pricing, msgLarge);
  const onBoardingPrice = findPrice(pricing, onBoarding);
  const trainingDataPrice = findPrice(
    pricing,
    isYearlyPlan ? trainingDataYearly : trainingDataMonthly
  );
  const conversationHistoryPrice = findPrice(
    pricing,
    isYearlyPlan ? conversationHistoryYearly : conversationHistoryMonthly
  );
  const leadsPrice = findPrice(
    pricing,
    isYearlyPlan ? leadsYearly : leadsMonthly
  );
  const whatsappPrice = findPrice(
    pricing,
    isYearlyPlan ? whatsappIdYearly : whatsappIdMonthly
  );
  const slackPrice = findPrice(
    pricing,
    isYearlyPlan ? slackIdYearly : slackIdMonthly
  );
  const telegramPrice = findPrice(
    pricing,
    isYearlyPlan ? telegramIdYearly : telegramIdMonthly
  );

  return (
    <>
      <div>
        <p className="add-ons-head add-ons-title" onClick={handleClick}>
          Add-ons{" "}
          <span>
            <Image src={ArrowDown} alt="down-arrow" />
          </span>
        </p>

        {isOpen && (
          <>
            <div className="add-ons">
              <div className="integration-head">
                <span className=" integration-title">Integration Options</span>
              </div>
              <div className="add-ons-container add-ons-new-container">
                <div className="add-ons-left">
                  <div className="add-ons-integration">
                    <div className="integration-list">
                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={whatsapp}
                            alt="no image"
                            style={{ width: "40px", height: "40px" }}
                          />
                          <div className="integration">
                            <p className="integration-name">Whatsapp</p>
                            <p className="price">
                              ${whatsappPrice} <span>per month</span>
                            </p>
                          </div>
                        </div>
                        <button
                          className="app-integration-price-btn"
                          //   disabled={whatsappDisable || !enableOne}
                          //   title={
                          //     telegramDisable || !enableOne ? NOTVALIDPLAN : undefined
                          //   }
                          //   onClick={WhatsappAddOn}
                          onClick={() =>
                            handleAddonClick(
                              isYearlyPlan
                                ? whatsappIdYearly
                                : whatsappIdMonthly
                            )
                          }
                        >
                          <span className="app-integration-price-btn-text">
                            Get Add-on
                          </span>
                        </button>
                      </div>
                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={telegram}
                            alt="no image"
                            style={{ width: "40px", height: "40px" }}
                          />
                          <div className="integration">
                            <p className="integration-name">Telegram</p>
                            <p className="price">
                              ${telegramPrice} <span>per month</span>
                            </p>
                          </div>
                        </div>
                        <button
                          className="app-integration-price-btn"
                          //   disabled={telegramDisable || !enableOne}
                          //   onClick={TelegramAddOn}
                          //   title={
                          //     telegramDisable || !enableOne ? NOTVALIDPLAN : undefined
                          //   }
                          onClick={() =>
                            handleAddonClick(
                              isYearlyPlan
                                ? telegramIdYearly
                                : telegramIdMonthly
                            )
                          }
                        >
                          <span className="app-integration-price-btn-text">
                            Get Add-on
                          </span>
                        </button>
                        {/* <div className="app-integration-price coming-soon">
                      Coming soon
                    </div> */}
                      </div>
                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={slack}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <div className="integration">
                            <p className="integration-name">Slack</p>
                            <p className="price">
                              ${slackPrice} <span>per month</span>
                            </p>
                          </div>
                        </div>
                        {/* <div className='app-integration-price coming-soon'>Coming soon</div> */}
                        <button
                          className="app-integration-price-btn"
                          //   disabled={slackDisable || !enableOne}
                          //   title={
                          //     slackDisable || !enableOne ? NOTVALIDPLAN : undefined
                          //   }
                          //   onClick={slackAddOn}
                          onClick={() =>
                            handleAddonClick(
                              isYearlyPlan ? slackIdYearly : slackIdMonthly
                            )
                          }
                        >
                          <span className="app-integration-price-btn-text">
                            Get Add-on
                          </span>
                        </button>
                      </div>

                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={instagram}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <p className="integration-name">Instagram</p>
                        </div>
                        {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                        <div className="app-integration-price coming-soon">
                          Coming soon
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="add-ons-right">
                  <div className="add-ons-integration">
                    {/* <p className="integration-head">Messaging Per Chatbot</p> */}
                    <div className="integration-list">
                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={messenger}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <p className="integration-name">Messenger</p>
                        </div>
                        {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                        <div className="app-integration-price coming-soon">
                          Coming soon
                        </div>
                      </div>

                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={sevenrooms}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <p className="integration-name">Sevenrooms</p>
                        </div>
                        {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                        <div className="app-integration-price coming-soon">
                          Coming soon
                        </div>
                      </div>

                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={mindbody}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <p className="integration-name">Mindbody</p>
                        </div>
                        {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                        <div className="app-integration-price coming-soon">
                          Coming soon
                        </div>
                      </div>

                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={hubspot}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <p className="integration-name">Hubspot</p>
                        </div>
                        {/* <button
                      className='app-integration-price-btn'
                      disabled={hubspotDisable || !enableOne}
                      onClick={HubspotAddOn}
                    >
                      <span className='app-integration-price-btn-text'>Get for $7 USD</span>
                    </button> */}
                        <div className="app-integration-price coming-soon">
                          Coming soon
                        </div>
                      </div>

                      <div className="app-integration">
                        <div className="integration-name-container">
                          <Image
                            src={zoho}
                            height={40}
                            width={40}
                            alt="no image"
                          />
                          <p className="integration-name">Zoho CRM</p>
                        </div>
                        <div className="app-integration-price coming-soon">
                          Coming soon
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card">
                <div className="pricing-info">
                  <div>
                    <Image src={Msgs} alt="msgs" />
                  </div>
                  <div>
                    <div className="pricing-title">5K Messages</div>
                    <div className="pricing-amount">
                      ${msgSmallPrice}{" "}
                      <span className="pricing-period">per month</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="pricing-button"
                  onClick={() => handleAddonClick(msgSmall)}
                >
                  Get Add-on
                </Button>
              </div>
              <div className="pricing-card">
                <div className="pricing-info">
                  <div>
                    <Image src={Msgs} alt="msgs" />
                  </div>
                  <div>
                    <div className="pricing-title">10K Messages</div>
                    <div className="pricing-amount">
                      ${msgLargePrice}{" "}
                      <span className="pricing-period">per month</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="pricing-button"
                  onClick={() => handleAddonClick(msgLarge)}
                >
                  Get Add-on
                </Button>
              </div>

              <div className="pricing-card">
                <div className="pricing-info">
                  <div>
                    <Image src={Training} alt="training" />
                  </div>
                  <div>
                    <div className="pricing-title">Training Data (1M)</div>
                    <div className="pricing-amount">
                      ${trainingDataPrice}{" "}
                      <span className="pricing-period">per month</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="pricing-button"
                  onClick={() =>
                    handleAddonClick(
                      isYearlyPlan ? trainingDataYearly : trainingDataMonthly
                    )
                  }
                >
                  Get Add-on
                </Button>
              </div>
              <div className="pricing-card">
                <div className="pricing-info">
                  <div>
                    <Image src={Conversation} alt="conversation" />
                  </div>
                  <div>
                    <div className="pricing-title">
                      Conversation History (3 Years)
                    </div>
                    <div className="pricing-amount">
                      ${conversationHistoryPrice}{" "}
                      <span className="pricing-period">per month</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="pricing-button"
                  onClick={() =>
                    handleAddonClick(
                      isYearlyPlan
                        ? conversationHistoryYearly
                        : conversationHistoryMonthly
                    )
                  }
                >
                  Get Add-on
                </Button>
              </div>

              <div className="pricing-card">
                <div className="pricing-info">
                  <div>
                    <Image src={Leads} alt="leads" />
                  </div>
                  <div>
                    <div className="pricing-title">
                      Lead (Unlimited) Individual
                    </div>
                    <div className="pricing-amount">
                      ${leadsPrice}{" "}
                      <span className="pricing-period">per month</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="pricing-button"
                  onClick={() =>
                    handleAddonClick(isYearlyPlan ? leadsYearly : leadsMonthly)
                  }
                >
                  Get Add-on
                </Button>
              </div>
              <div className="pricing-card coming-soon">
                <div className="pricing-info">
                  <div className="upcoming">
                    <Image src={Sentiment} alt="sentiment" />
                    <div className="pricing-title">Sentiment Dashboard</div>
                  </div>
                  <div className="pricing-period">Coming soon</div>
                </div>
              </div>
            </div>

            <div className="onboarding">
              <p className="title">Onboarding</p>
              <div className="pricing-card highlight">
                <div className="pricing-info">
                  <div>
                    <Image src={Onboarding} alt="onboarding" />
                  </div>

                  <div>
                    <div className="pricing-title">Onboarding</div>
                    <div className="pricing-amount">
                      ${onBoardingPrice}{" "}
                      <span className="pricing-period">One off</span>
                    </div>
                  </div>
                </div>
                <Button
                  className="pricing-button"
                  onClick={() => handleAddonClick(onBoarding)}
                >
                  Get Add-on
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default PricingAddons;
