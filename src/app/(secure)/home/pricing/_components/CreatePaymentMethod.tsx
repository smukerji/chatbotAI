"use client";
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import Stripe from "stripe";
import { useRouter } from "next/navigation";
import { StripeElements } from "@stripe/stripe-js";
const stripee = new Stripe(String(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY));

export default function createPaymentMethod({ setStatus }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (event: any) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement: any = elements.getElement(CardElement);
    try {
      const response = await axios.post(
        "http://localhost:3000/home/pricing/stripe-payment-gateway/getCustomer"
      );
      console.log("Payment method created:", response);

      const paymentMethod = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });
      console.log(paymentMethod.paymentMethod?.id);
      const id: any = paymentMethod.paymentMethod?.id;

      const update = await axios.post(
        "http://localhost:3000/home/pricing/stripe-payment-gateway/updatePaymentMethod",
        { paymentId: paymentMethod.paymentMethod?.id }
      );
      setStatus(0);
    } catch (error) {
      console.error("Error creating payment method:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div>{error}</div>}
      <button type="submit" disabled={!stripe}>
        Pay
      </button>
    </form>
  );
}
