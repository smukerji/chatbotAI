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
import { StripeElements } from "@stripe/stripe-js";
const stripee = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));
import "../../pricing/stripe.scss";
import { useCookies } from "react-cookie";
import { message } from "antd";

export default function createPaymentMethod({ setStatus, plan , price }: any) {
  const stripe = useStripe();
  const elements: any = useElements();
  const [error, setError] = useState(null);
  const router = useRouter();
  const [cookies, setCookie] = useCookies(["userId"]);
  console.log(price)
  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardNumber: any = elements.getElement(CardNumberElement);
    const cardCvc: any = elements.getElement(CardCvcElement);
    const cardExpiry: any = elements.getElement(CardExpiryElement);

    const u_id:any = cookies.userId;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getCustomer`,
        {
          u_id: u_id
        }
      );
      console.log("Payment method created:", response);

      const paymentMethod = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
      });
      console.log(paymentMethod.paymentMethod?.id);
      const id: any = paymentMethod.paymentMethod?.id;

      const update = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/updatePaymentMethod`,
        { paymentId: paymentMethod.paymentMethod?.id ,u_id:u_id}
      );
      setStatus(0);
    } catch (error) {
      message.error(`${error}`);
      console.error("Error creating payment method:", error);
    }
  };

  return (
    <form className="cardElementForm" onSubmit={handleSubmit}>
      <div className="left">
        {plan == 1 && <h2>Individual Plan</h2>}
        {plan == 2 && <h2>Agency Plan</h2>}
        <span>${price}</span>
      </div>
      <div className="right">
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
  );
}