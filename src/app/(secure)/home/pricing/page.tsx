"use client";

import CheckoutForm from "./_components/CheckoutForm";
import React, { useState, useEffect, useDebugValue } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axios from "axios";
import CreatePaymentMethod from "./_components/CreatePaymentMethod";
import "../pricing/stripe.scss";
import Image from "next/image";
import PlanOne from "./_components/plan-box-1";
import PlanTwo from "./_components/plan-box-2";
import zoho from "../../../../../public/Rectangle 159.png";
import whatsapp from "../../../../../public/whatsapp.png";
import telegram from "../../../../../public/telegram.png";
import hubspot from "../../../../../public/hubspot.png";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

export default function Home() {
  const [status, setStatus] = useState<number>(2);
  const [plan, setPlan] = useState(0);
  const [enableOne, setEnableOne] = useState(false)
  const [enableTwo, setEnableTwo] = useState(false)
  const makePayment = async () => {
    const response = await axios.get(
      "http://localhost:3000/home/pricing/stripe-payment-gateway"
    );
    console.log(response);
    if (response.data?.status == 500) {
      setStatus(1);
    } else {
      setStatus(0);
    }
  };
  const getPlanDetails = async () => {
    const planDetails = await axios.get(
      "http://localhost:3000/home/pricing/stripe-payment-gateway/getPlanDetails"
    );
  };
  const checkPlan = async() => {
    const checkPlan = await axios.put(
      "http://localhost:3000/home/pricing/stripe-payment-gateway"
    );
    console.log(checkPlan)
    if(checkPlan.data.msg == 2){
      console.log("2")
      setEnableOne(true)
      setEnableTwo(true)
    }
    else if(checkPlan.data.msg == 1){
      console.log("1")
      setEnableOne(true)
    }
  }
  useEffect(() => {
    checkPlan()
    if (plan == 1 || plan == 2) {
      console.log(plan);
      makePayment();
    }
  }, [plan]);
  return (
    <>
      {status === 2 && (
        <div className="main">
          <h2 className="price-header">Pricing Plans</h2>
          <div className="price-offer-container">
            <span className="price-offer">Early Bird&nbsp;</span>
            <span className="price-offer-normal">users will receive Flat</span>
            <span className="price-offer">&nbsp;20% discount.</span>
          </div>

          <div className="plan-container">
            <PlanOne setPlan={setPlan} enableOne={enableOne}/>
            <PlanTwo setPlan={setPlan} enableTwo={enableTwo}/>
          </div>
          <div className="add-ons-container">
            <p className="add-ons-head">Add-ons</p>
            <div className="add-ons-integration">
              <span className="integration-head">Integration Options</span>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image src={whatsapp} alt="no image" />
                    <p className="integration-name">Whatsapp</p>
                  </div>
                  <div className="app-integration-price">$7 USD monthly</div>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image src={telegram} alt="no image" />
                    <p className="integration-name">Telegram</p>
                  </div>
                  <div className="app-integration-price">$7 USD monthly</div>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image src={hubspot} alt="no image" />
                    <p className="integration-name">Hubspot CRM</p>
                  </div>
                  <div className="app-integration-price">$7 USD monthly</div>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <Image src={zoho} alt="no image" />
                    <p className="integration-name">Zoho CRM</p>
                  </div>
                  <div className="app-integration-price">$7 USD monthly</div>
                </div>
              </div>
            </div>
            <div className="add-ons-integration">
              <p className="integration-head">Messaging per chatbot</p>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">5K messages</p>
                  </div>
                  <div className="app-integration-price">$5 USD</div>
                </div>
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">5K messages</p>
                  </div>
                  <div className="app-integration-price">$8 USD</div>
                </div>
              </div>
            </div>
            <div className="add-ons-integration">
              <p className="integration-head">Training data</p>
              <div className="integration-list">
                <div className="app-integration">
                  <div className="integration-name-container">
                    <p className="integration-name">5K messages</p>
                  </div>
                  <div className="app-integration-price">$5 USD</div>
                </div>
              </div>
            </div>
          </div>
          <div className="price-footer-container">
            <div className="footer-left">
              <div className="left-head">
                <p className="left-head-text">Pricing FAQs</p>
              </div>
                <p className="left-text">We are offering an accessible interface to website or other platforms.</p>
            </div>
            <div className="footer-right"></div>
          </div>
        </div>
      )}
      <Elements stripe={stripePromise}>
        {status === 1 && <CreatePaymentMethod setStatus={setStatus} plan={plan} />}
        {status === 0 && <CheckoutForm plan={plan} />}
      </Elements>
    </>
  );
}
