"use client";
import React, { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CreatePaymentMethod from "../../_components/CreatePaymentMethod";
import { useSearchParams } from "next/navigation";
import CryptoJS from 'crypto-js';
import { chat } from "googleapis/build/src/apis/chat";
import Loader from "../../_components/Loader";
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
  { id: 7, name: "Message add on", price: 8, days: 30 },
  { id: 8, name: "Whatsapp Integration", price: 7, days: 30 },
  { id: 9, name: "Slack Integration", price: 7, days: 30 },
];

const CheckoutPage = ({ params }: any) => {
  const { planId } = params;
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const param: any = useSearchParams();
  const chatbot = (decodeURIComponent(param.get("a")));
  const [decryptedData , setDecryptedData] = useState("");
  const [loader, setLoader] = useState(false)
  
  const dataDecrypt =() => {
    console.log('.....', chatbot);
    
    // const data: any = decodeURIComponent(chatbot)
    // console.log(data)
    const bytes = CryptoJS.AES.decrypt(chatbot, "xyz");
    console.log(bytes)
    const decryptedData = (bytes.toString(CryptoJS.enc.Utf8)); 
    setDecryptedData(decryptedData)  
    setLoader(false)
  }

  useEffect(() => {
    setLoader(true)
    setSelectedPlan(plans.find((plan: any) => plan.id === Number(planId)));
    if(planId == 2 || planId ==4){
      dataDecrypt()
    }
    else{
      setLoader(false)
    }
  }, []);

  return (
    <div>
      <Elements stripe={stripePromise}>
        {loader ? <Loader /> : (

          <CreatePaymentMethod
          plan={selectedPlan?.id}
          price={(selectedPlan?.id == 4 || selectedPlan?.id == 2)  ? decryptedData : selectedPlan?.price}
          duration={selectedPlan?.days === 365 ? "year" : "month"}
          name={selectedPlan?.name}
          />
          )}
      </Elements>
    </div>
  );
};

export default CheckoutPage;
