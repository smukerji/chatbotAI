"use client";
import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CreatePaymentMethod from "../../_components/CreatePaymentMethod";
import { useSearchParams } from "next/navigation";
import CryptoJS from 'crypto-js';
const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

const plans = [
  { id: 1, name: "individual", price: 15, days: 30 },
  { id: 2, name: "agency", price: 89, days: 30 },
  { id: 3, name: "individual", price: 144, days: 365 },
  { id: 4, name: "agency", price: 854, days: 365 },
  { id: 5, name: "Character add on", price: 5, days: 30 },
  { id: 6, name: "Message add on", price: 5, days: 30 },
  { id: 7, name: "Message add on", price: 8, days: 30 },
  { id: 8, name: "Whatsapp Integration", price: 7, days: 30 },
];

const CheckoutPage = ({ params }: any) => {
  const { planId } = params;
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const param: any = useSearchParams();
  const chatbot = (decodeURIComponent(param.get("a")));
  
    const bytes = CryptoJS.AES.decrypt(chatbot, "xyz");
    const decryptedData = (bytes.toString(CryptoJS.enc.Utf8));  

  useEffect(() => {
    setSelectedPlan(plans.find((plan: any) => plan.id === Number(planId)));
  }, []);

  return (
    <div>
      <Elements stripe={stripePromise}>
        <CreatePaymentMethod
          plan={selectedPlan?.id}
          price={selectedPlan?.id == 4 || selectedPlan?.id == 2  ? decryptedData : selectedPlan?.price}
          duration={selectedPlan?.days === 365 ? "year" : "month"}
        />
      </Elements>
    </div>
  );
};

export default CheckoutPage;
