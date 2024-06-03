"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../pricing/stripe.scss";
import Image from "next/image";
import PlanOne from "./plan-box-1";
import PlanTwo from "./plan-box-2";
import zoho from "../../../../../../public/zoho.webp";
import whatsapp from "../../../../../../public/whatsapp.webp";
import telegram from "../../../../../../public/telegram.webp";
import hubspot from "../../../../../../public/hubspot.webp";
import { useCookies } from "react-cookie";
import { Modal, message, Collapse } from "antd";
import Loader from "./Loader";
import Coll from "./Collapse";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import slack from "../../../../../../public/slack.webp";
import { NOTVALIDPLAN } from "../../../../_helpers/errorConstants";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";
import PriceOffer from "./PriceOffer";

export default function PricingWrapper() {
  const [planStatus, setStatus] = useState<number>(2);
  const [plan, setPlan] = useState(0);
  const [enableOne, setEnableOne] = useState(false);
  const [enableTwo, setEnableTwo] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookie] = useCookies(["userId"]);
  const [prePrice, setPrePrice] = useState(0);
  const [textOne, setText] = useState("Select Plan");
  const [textTwo, setTextTwo] = useState("Get Plan");
  const router = useRouter();
  const [whatsappDisable, setWhatsappDisable] = useState(false);
  const [slackDisable, setSlackDisable] = useState(false);
  const [telegramDisable, setTelegramDisable] = useState(false);
  const [hubspotDisable, setHubspotDisable] = useState(false);

  const { status } = useSession();

  const u_id: any = cookies.userId;

  const CharacterAddOn = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${5}`);
    } else {
      router.push("/account/login");
    }
  };

  const MessageAddOn = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${6}`);
    } else {
      router.push("/account/login");
    }
  };

  const MessageAddOnAdvance = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${7}`);
    } else {
      router.push("/account/login");
    }
  };
  const WhatsappAddOn = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${8}`);
    } else {
      router.push("/account/login");
    }
  };

  const slackAddOn = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${9}`);
    } else {
      router.push("/account/login");
    }
  };

  const TelegramAddOn = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${10}`);
    } else {
      router.push("/account/login");
    }
  };

  const HubspotAddOn = async () => {
    if (cookies?.userId) {
      router.push(`/home/pricing/checkout/${11}`);
    } else {
      router.push("/account/login");
    }
  };

  const getPlanDetails = async () => {
    try {
      //ANCHOR - getting all plans details
      const planDetails = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getPlanDetails`
      );
    } catch (error) {
      message.error(`${error}`);
    }
  };
  const checkPlan = async () => {
    try {
      setLoading(true);
      //ANCHOR - Checking existing plan details
      const checkPlan = await axios.put(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`,
        {
          u_id: u_id,
        }
      );
      setHubspotDisable(checkPlan.data.hubspotIntegration);
      setSlackDisable(checkPlan.data.slackIntegration);
      console.log("Diable whatsappp", checkPlan.data.whatsAppIntegration);

      setWhatsappDisable(checkPlan.data.whatsAppIntegration);
      setTelegramDisable(checkPlan.data.telegramIntegration);
      if (checkPlan.data.msg == 1) {
        setPrePrice(checkPlan.data.prePrice);
        setEnableOne(true);
        setText(checkPlan.data.text);
      } else if (checkPlan.data.msg == 2) {
        setEnableTwo(true);
        setEnableOne(true);
        setTextTwo(checkPlan.data.text);
      } else {
        setText(checkPlan.data.text);
      }
    } catch (error) {
      message.error(`${error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (cookies.userId) {
      setLoading(true);
      checkPlan();
      // if (plan == 1 || plan == 2) {
      //   // makePayment();
      // }
    } else {
      setLoading(false);
    }
  }, [plan, planStatus]);

  const handlePlanType = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {status === "unauthenticated" && !u_id && <SecondaryHeader />}
      {loading && <Loader />}
      <div className="main">
        <h2 className="price-header">Pricing Plans</h2>
        <PriceOffer />
        <div className="plan-tab-container">
          <button
            className={`plan-type ${!isYearlyPlan && "active"}`}
            onClick={handlePlanType}
          >
            Monthly
          </button>
          <button
            className={`plan-type ${isYearlyPlan && "active"}`}
            onClick={handlePlanType}
          >
            Yearly
          </button>
        </div>
        <div className="annual-discount">Save 20% annually</div>
        <br></br>

        <div className="plan-container">
          <PlanOne
            setPlan={setPlan}
            setPrice={setPrice}
            price={isYearlyPlan ? 144 : 15}
            enableOne={enableOne}
            text={textOne}
            messages={isYearlyPlan ? "2000 messages/month" : "2000 messages"}
          />
          <PlanTwo
            setPlan={setPlan}
            setPrice={setPrice}
            price={isYearlyPlan ? 854 : 89}
            enableTwo={enableTwo}
            prePrice={prePrice}
            text={textTwo}
            messages={isYearlyPlan ? "5000 messages/month" : "5000 messages"}

            // disableMonth={isYearlyPlan ? false : disableMonth}
          />
        </div>
        <p className="add-ons-head">Add-ons</p>
        <div className="add-ons-container">
          <div className="add-ons-left">
            <div className="add-ons-integration">
              <span className="integration-head">Integration Options</span>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={whatsapp}
                      alt="no image"
                      style={{ width: "40px", height: "40px" }}
                    />
                    <p className="integration-name">Whatsapp</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    disabled={whatsappDisable || !enableOne}
                    title={
                      telegramDisable || !enableOne ? NOTVALIDPLAN : undefined
                    }
                    onClick={WhatsappAddOn}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $7 USD
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
                    <p className="integration-name">Telegram</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    disabled={telegramDisable || !enableOne}
                    onClick={TelegramAddOn}
                    title={
                      telegramDisable || !enableOne ? NOTVALIDPLAN : undefined
                    }
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $7 USD
                    </span>
                  </button>
                  {/* <div className="app-integration-price coming-soon">
                      Coming soon
                    </div> */}
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image
                      src={hubspot}
                      height={40}
                      width={40}
                      alt="no image"
                    />
                    <p className="integration-name">Hubspot CRM</p>
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
                    <Image src={slack} height={40} width={40} alt="no image" />
                    <p className="integration-name">Slack</p>
                  </div>
                  {/* <div className='app-integration-price coming-soon'>Coming soon</div> */}
                  <button
                    className="app-integration-price-btn"
                    disabled={slackDisable || !enableOne}
                    title={
                      slackDisable || !enableOne ? NOTVALIDPLAN : undefined
                    }
                    onClick={slackAddOn}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $7 USD
                    </span>
                  </button>
                </div>
                {/* <button className="btn-add-ons" disabled={whatsappDisable}>
                    <span className="btn-text">Get Add-on</span>
                  </button> */}
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image src={zoho} height={40} width={40} alt="no image" />
                    <p className="integration-name">Zoho CRM</p>
                  </div>
                  <div className="app-integration-price coming-soon">
                    Coming soon
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="add-ons-right">
            <div className="add-ons-integration">
              <p className="integration-head">Messaging Per Chatbot</p>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">5K Messages</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    disabled={enableOne ? false : true}
                    onClick={MessageAddOn}
                    title={enableOne ? undefined : NOTVALIDPLAN}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $5 USD
                    </span>
                  </button>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">10K Messages</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    disabled={enableOne ? false : true}
                    onClick={MessageAddOnAdvance}
                    title={enableOne ? undefined : NOTVALIDPLAN}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $8 USD
                    </span>
                  </button>
                </div>
              </div>
              {/* <button
                  className="btn-add-ons"
                  onClick={MessageAddOn}
                  disabled={enableOne ? false : true}
                  title={enableOne ? undefined : "Please purchase plan first"}
                >
                  <span className="btn-text">Get Add-on</span>
                </button> */}
            </div>
            <div className="add-ons-integration">
              <p className="integration-head">Training Data</p>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">1M Characters</p>
                  </div>
                  <button
                    className="app-integration-price-btn"
                    disabled={enableOne ? false : true}
                    onClick={CharacterAddOn}
                    title={enableOne ? undefined : NOTVALIDPLAN}
                  >
                    <span className="app-integration-price-btn-text">
                      Get for $5 USD
                    </span>
                  </button>
                </div>
              </div>
              {/* <button
                  className="btn-add-ons"
                  onClick={CharacterAddOn}
                  disabled={enableOne ? false : true}
                  title={enableOne ? undefined : "Please purchase plan first"}
                >
                  <span className="btn-text">Get Add-on</span>
                </button> */}
            </div>
          </div>
        </div>

        <div className="price-footer-container">
          <div className="footer-left">
            <div className="left-head">
              <p className="left-head-text">FAQ</p>
            </div>
            {/* <p className="left-text">
              We are offering an accessible interface to website or other
              platforms.
            </p> */}
          </div>
          <div className="footer-right">
            <Coll />
          </div>
        </div>
      </div>
    </>
  );
}
