"use client";

import React, { useState, useEffect, useDebugValue } from "react";
import axios from "axios";
import "../pricing/stripe.scss";
import Image from "next/image";
import PlanOne from "./_components/plan-box-1";
import PlanTwo from "./_components/plan-box-2";
import zoho from "../../../../../public/Rectangle 159.png";
import whatsapp from "../../../../../public/whatsapp.png";
import telegram from "../../../../../public/telegram.png";
import hubspot from "../../../../../public/hubspot.png";
import { useCookies } from "react-cookie";
import { Modal, message, Collapse } from "antd";
import Loader from "./_components/Loader";
import Coll from "./_components/Collapse";
import { useRouter } from "next/navigation";

export default function Home() {
  const [status, setStatus] = useState<number>(2);
  const [plan, setPlan] = useState(0);
  const [enableOne, setEnableOne] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cookies, setCookie] = useCookies(["userId"]);
  const [prePrice, setPrePrice] = useState(0);
  const [text, setText] = useState("Get 7 Day Free Trial on First registration");
  const router = useRouter();
  const [whatsappDisable, setWhatsappDisable] = useState(false);

  const u_id: any = cookies.userId;

  const CharacterAddOn = async () => {
    if (cookies?.userId) {
    router.push(`/home/pricing/checkout/${5}`);
    }
  };

  const MessageAddOn = async () => {
    if (cookies?.userId) {
    router.push(`/home/pricing/checkout/${6}`);
    }
  };

  const MessageAddOnAdvance = async () => {
    if (cookies?.userId) {
    router.push(`/home/pricing/checkout/${7}`);
    }
  };
  const WhatsappAddOn = async () => {
    if (cookies?.userId) {
    router.push(`/home/pricing/checkout/${8}`);
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
        { u_id: u_id }
      );
      console.log(checkPlan);
      setText(checkPlan.data.text);
      setWhatsappDisable(checkPlan.data.whatsAppIntegration);
      if (checkPlan.data.msg == 1) {
        setPrePrice(checkPlan.data.prePrice);
        setEnableOne(true);
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
  }, [plan, status]);

  const handlePlanType = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  return (
    <>
      {loading && <Loader />}
      {status === 2 && loading == false && (
        <div className="main">
          <h2 className="price-header">Pricing Plans</h2>
          {/* <div className="price-offer-container">
            <span className="price-offer">Early Bird&nbsp;</span>
            <span className="price-offer-normal">users will receive Flat</span>
            <span className="price-offer">&nbsp;20% discount.</span>
          </div> */}
          {/* <div className="plan-tab-container">
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
          </div> */}
          {/* <div className="annual-discount">Save 20% annualy</div> */}
          <br></br>

          <div className="plan-container">
            <PlanOne
              setPlan={setPlan}
              setPrice={setPrice}
              price={isYearlyPlan ? 144 : 15}
              enableOne={enableOne}
              text={text}
            />
            <PlanTwo
              setPlan={setPlan}
              setPrice={setPrice}
              price={isYearlyPlan ? 854 : 89}
              // enableTwo={true}
              prePrice={prePrice}
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
                      <Image src={whatsapp} alt="no image" />
                      <p className="integration-name">Whatsapp</p>
                    </div>
                    <button
                      className="app-integration-price-btn"
                      disabled={whatsappDisable}
                      onClick={WhatsappAddOn}
                    >
                      <span className="app-integration-price-btn-text">
                        Get for $7 USD
                      </span>
                    </button>
                  </div>
                  <div className="app-integration">
                    <div className="integration-name-container">
                      <Image src={telegram} alt="no image" />
                      <p className="integration-name">Telegram</p>
                    </div>
                    <div className="app-integration-price coming-soon">
                      Coming soon
                    </div>
                  </div>
                  <div className="app-integration">
                    <div className="integration-name-container">
                      <Image src={hubspot} alt="no image" />
                      <p className="integration-name">Hubspot CRM</p>
                    </div>
                    <div className="app-integration-price coming-soon">
                      Coming soon
                    </div>
                  </div>
                  <div className="app-integration">
                    <div className="integration-name-container">
                      <Image src={zoho} alt="no image" />
                      <p className="integration-name">Zoho CRM</p>
                    </div>
                    <div className="app-integration-price coming-soon">
                      Coming soon
                    </div>
                  </div>
                  {/* <button className="btn-add-ons" disabled={whatsappDisable}>
                    <span className="btn-text">Get Add-on</span>
                  </button> */}
                </div>
              </div>
            </div>
            <div className="add-ons-right">
              <div className="add-ons-integration">
                <p className="integration-head">Messaging per chatbot</p>
                <div className="integration-list">
                  <div className="app-integration">
                    <div className="integration-name-container">
                      <p className="integration-name">5K messages</p>
                    </div>
                    <button
                      className="app-integration-price-btn"
                      disabled={enableOne ? false : true}
                      onClick={MessageAddOn}
                      title={enableOne ? undefined : "You do not have valid plan"}
                    >
                      <span className="app-integration-price-btn-text">
                        Get for $5 USD
                      </span>
                    </button>
                  </div>
                  <div className="app-integration">
                    <div className="integration-name-container">
                      <p className="integration-name">10K messages</p>
                    </div>
                    <button
                      className="app-integration-price-btn"
                      disabled={enableOne ? false : true}
                      onClick={MessageAddOnAdvance}
                      title={enableOne ? undefined : "You do not have valid plan"}
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
                <p className="integration-head">Training data</p>
                <div className="integration-list">
                  <div className="app-integration">
                    <div className="integration-name-container">
                      <p className="integration-name">
                        Total Characters for training - 1M
                      </p>
                    </div>
                    <button
                      className="app-integration-price-btn"
                      disabled={enableOne ? false : true}
                      onClick={CharacterAddOn}
                      title={enableOne ? undefined : "You do not have valid plan"}
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
                <p className="left-head-text">Pricing FAQs</p>
              </div>
              <p className="left-text">
                We are offering an accessible interface to website or other
                platforms.
              </p>
            </div>
            <div className="footer-right">
              <Coll />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
