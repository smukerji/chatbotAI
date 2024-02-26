"use client";
import React, { useState } from "react";
import {
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
  CardNumberElement,
  CardCvcElement,
  CardExpiryElement,
} from "@stripe/react-stripe-js";
import axios from "axios";
import Stripe from "stripe";
import { useRouter } from "next/navigation";
import Loader from "../_components/Loader";
import { StripeElements } from "@stripe/stripe-js";
const stripee = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import "../../pricing/stripe.scss";
import { useCookies } from "react-cookie";
import { message } from "antd";
import line from "../../../../../../public/svgs/line.svg";
import Image from 'next/image';

export default function CreatePaymentMethod({ plan, price, duration }: any) {
  const stripe = useStripe();
  const elements: any = useElements();
  const [error, setError] = useState(null);
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["userId"]);
  const [loading, setLoading] = useState(false);
  console.log(price);
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true)
    const cardNumber: any = elements.getElement(CardNumberElement);
    const cardCvc: any = elements.getElement(CardCvcElement);
    const cardExpiry: any = elements.getElement(CardExpiryElement);

    const u_id: any = cookies.userId;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getCustomer`,
        {
          u_id: u_id,
        }
      );
      console.log("Payment method created:", response);
    } catch {
      message.error("error while getting customer data");
      throw error;
    }
    try {
      const paymentMethod = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
      });
      console.log(paymentMethod.paymentMethod?.id);
      const id: any = paymentMethod.paymentMethod?.id;
      if (paymentMethod.paymentMethod?.id) {
        const update = await axios.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/updatePaymentMethod`,
          { paymentId: paymentMethod.paymentMethod?.id, u_id: u_id }
        );

        if (update.data.acknowledged) {
          //ANCHOR - api call to create paymentIntent
          const result = await axios.post(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`,
            { plan: plan, price: price, u_id: u_id }
          );
          //ANCHOR - payment confirmation
          const r = stripe.confirmPayment({
            clientSecret: result.data.client_secret,
            confirmParams: {
              return_url: 'http://localhost:3000/chatbot',
            },
          });
          //ANCHOR - adding data to backend
          const a = await axios.post(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/add-payment`,
            { plan: plan, duration: duration, u_id: u_id }
          );
          message.success("success");
          window.location.href = 'http://localhost:3000/chatbot'
          // setLoading(false)
        }
      } else {
        message.error(
          "Finding error while making payment with this card, please check your card details"
          );
      }
    } catch (error) {
      message.error(`${error}`);
      console.error("Error creating payment method:");
      throw error;
    }
  };

  return (
    <>
    {loading && <Loader />}
    {
      <div className="card-main">
      <div className="card-head">Billing Info</div>
      <form className="cardElementForm" onSubmit={handleSubmit}>
        <div className="left">
          <div className="top-left">
          {plan == 1 && <div className="plan-name">Individual Plan</div>}
            {plan == 2 && <div className="plan-name">Agency Plan</div>}
            <div className="price">
              <span>${price}</span>
              <span className="price-duration">Per {duration}</span>
            </div>
          </div>
            <Image src={line} alt={"no image"} />
            <div className="bottom-left">
              <div className="total">Total</div>
              <div className="total-price">${price}</div>
            </div>
            </div>
        <div className="right">
          <div className="right-top">Pay with Card</div>
          <div className="card-element">
          <label className="card-label">Card Number</label>
            <div className="cardNumber">
              <CardNumberElement />
            </div>
            <label className="card-label">Card Expiry</label>
            <div className="cardExpiry">
              <CardExpiryElement />
            </div>
            <label className="card-label">Card CVC</label>
            <div className="cardCvc">
              <CardCvcElement />
              </div>
          </div>
          {error && <div>{error}</div>}
          <button className="btn-card-submit" type="submit" disabled={!stripe}>
          Pay
          </button>
        </div>
      </form>
    </div>
  }
  </>
    );

}
