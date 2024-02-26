"use client";
import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CreatePaymentMethod from "../../_components/CreatePaymentMethod";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

const plans = [
  { id: 1, name: "Individual Plan", price: 15, days: 30 },
  { id: 2, name: "Agency Plan", price: 89, days: 30 },
  { id: 3, name: "Individual Plan", price: 144, days: 365 },
  { id: 4, name: "Agency Plan", price: 854, days: 365 },
  { id: 5, name: "Character add on", price: 5, days: 30 },
  { id: 6, name: "Message add on", price: 5, days: 30 },

];

const CheckoutPage = ({ params }: any) => {
  const { planId } = params;
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    setSelectedPlan(plans.find((plan: any) => plan.id === Number(planId)));
  }, []);

  return (
    <div>
      <Elements stripe={stripePromise}>
        <CreatePaymentMethod
          plan={selectedPlan?.id}
          price={selectedPlan?.price}
          duration={selectedPlan?.days === 365 ? "year" : "month"}
        />
      </Elements>
    </div>
  );
};

export default CheckoutPage;
