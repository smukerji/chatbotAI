"use client";
import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
// import Stripe from "stripe";
import { StripeElements, loadStripe,Stripe } from "@stripe/stripe-js";
import CreatePaymentMethod from "./CreatePaymentMethod";
import {Stripe as s} from "stripe";
const stripee = new s(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));


export default function CheckoutForm() {

  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    const stripe = (await loadStripe(String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY))) as Stripe;
    // event.preventDefault();
    if (!stripe ) {
      return;
    }
    const result = await axios.post(
      "http://localhost:3000/home/pricing/stripe-payment-gateway",
    );
    console.log(result)

    const r = stripe.confirmPayment({
      clientSecret:result.data.client_secret,
      confirmParams: {
        return_url:
          "http://localhost:3000/home/pricing/stripe-payment-gateway/success",
      },
    });
  };
  useEffect(() => {
    handleSubmit();
  }, []);

  return (
    <button type="submit">
      Pay
    </button>
  );
}
