"use client";

// import CheckoutForm from "./_components/CheckoutForm";
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
import { Spinner } from "@nextui-org/react";
import { useCookies } from "react-cookie";
import { message } from "antd";
import Loader from "./_components/Loader";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

export default function Home() {
  const [status, setStatus] = useState<number>(2);
  const [plan, setPlan] = useState(0);
  const [enableOne, setEnableOne] = useState(false);
  const [enableTwo, setEnableTwo] = useState(false);
  const [isYearlyPlan, setIsYearlyPlan] = useState(false);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie] = useCookies(["userId"]);
  const [prePrice, setPrePrice] = useState(0);

  const u_id: any = cookies.userId;

  // const success = () => {
  //   messageApi.open({
  //     type: 'success',
  //     content: 'This is a success message',
  //   });
  // };

  // const error = () => {
  //   messageApi.open({
  //     type: 'error',
  //     content: 'This is an error message',
  //   });
  // };

  const makePayment = async () => {
    try {
      setLoading(true)
      const response = await axios.post(
        `http://localhost:3000/home/pricing/stripe-payment-gateway/getPlanDetails`,
        { u_id: u_id }
      );

      if (response.data?.status == 500) {
        setStatus(1);
        // message.success('This is a success message')
      } else {
        setStatus(0);
        //  message.error('This is a error msg')
      }
      setLoading(false)
    } catch (error) {
      message.error(`${error}`);
    }
  };
  const getPlanDetails = async () => {
    try {
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
      const checkPlan = await axios.put(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`,
        { u_id: u_id }
      );
      console.log(checkPlan);
      if (checkPlan.data.msg == 2) {
        setEnableOne(true);
        setEnableTwo(true);
      } else if (checkPlan.data.msg == 1) {
        console.log(checkPlan.data.prePrice, checkPlan.data.msg);
        setPrePrice(checkPlan.data.prePrice);
        setEnableOne(true);
      }
    } catch (error) {
      message.error(`${error}`);
    }
    setLoading(false);
  };
  const handleSubmit = async () => {
    // const retrievedCookieData = cookies.getdata(userId);
    const stripe = await loadStripe(
      String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
    );
    // event.preventDefault();
    if (!stripe) {
      return;
    }
    // setLoading(true)
    console.log(plan);
    let duration = null;
    if (isYearlyPlan) {
      duration = "year";
    } else {
      duration = "month";
    }
    try {
      const result = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`,
        { plan: plan, price: price, u_id: u_id }
      );
      const r = stripe.confirmPayment({
        clientSecret: result.data.client_secret,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/success`,
        },
      });
    } catch (error) {
      message.error(`${error}`);
    }
    try {
      const a = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/add-payment`,
        { plan: plan, duration: duration, u_id: u_id }
      );
      message.success("success");
      setLoading(false);
    } catch (error) {
      message.error(`${error}`);
    }

  };
  useEffect(() => {
    checkPlan();
    if (plan == 1 || plan == 2) {
      console.log(plan);
      makePayment();
    }
    if (status == 0) {
      console.log("checkout");
      handleSubmit();
    }
  }, [plan, status]);

  const handlePlanType = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  

  return (
    <>
      {loading && (
        <Loader />
      )}
      {status === 2 && loading == false && (
        <div className="main">
          <h2 className="price-header">Pricing Plans</h2>
          <div className="price-offer-container">
            <span className="price-offer">Early Bird&nbsp;</span>
            <span className="price-offer-normal">users will receive Flat</span>
            <span className="price-offer">&nbsp;20% discount.</span>
          </div>
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
          <div className="annual-discount">Save 20% annualy</div>

          <div className="plan-container">
            <PlanOne
              setPlan={setPlan}
              setPrice={setPrice}
              price={isYearlyPlan ? 144 : 15}
              enableOne={enableOne}
            />
            <PlanTwo
              setPlan={setPlan}
              setPrice={setPrice}
              price={isYearlyPlan ? 854 : 89}
              enableTwo={enableTwo}
              // enableOne={enableOne}
              prePrice={prePrice}
            />
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
              <p className="left-text">
                We are offering an accessible interface to website or other
                platforms.
              </p>
            </div>
            <div className="footer-right"></div>
          </div>
        </div>
      )}
      <Elements stripe={stripePromise}>
        {status === 1 && (
          <CreatePaymentMethod
            setStatus={setStatus}
            plan={plan}
            price={price}
          />
        )}
      </Elements>
    </>
  );
}