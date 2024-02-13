"use client";

import CheckoutForm from "./_components/CheckoutForm";
import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import axios from "axios";
import CreatePaymentMethod from "./_components/CreatePaymentMethod";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

export default function Home() {
  const [status, setStatus] = useState(2);
  const [flag, setFlag] = useState(false);
  const call = async () => {
    const response = await axios.post(
      "http://localhost:3000/home/pricing/stripe-payment-gateway",
      {}
    );

    if (response.data?.status == 500) {
      setStatus(1);
    } else {
      setStatus(0);
    }
  };
  useEffect(() => {
    call();
  }, [flag]);

  return (
    <Elements stripe={stripePromise}>
      {status === 1 && <CreatePaymentMethod setFlag={setFlag} />}
      {status === 0 && <CheckoutForm />}
    </Elements>
  );
}
