"use client";
import { Elements } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import Loader from "./Loader";
import { loadStripe } from "@stripe/stripe-js";
import VoicePaymentCard from "./VoicePaymentCard";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

function VoicebotPlanCheckout() {
  const [cookies, setCookie] = useCookies(["userId"]);
  const u_id: any = cookies.userId;
  const [loader, setLoader] = useState(false);

  return (
    <>
      <div>
        <Elements stripe={stripePromise}>
          {loader ? (
            <Loader />
          ) : (
            <VoicePaymentCard
            //   price={subscriptionDetail?.price}
            //   interval={subscriptionDetail?.interval}
            //   customerId={customerId}
            //   priceId={priceId}
            //   source={source}
            //   type={type}
            //   isActive={isActive}
            //   firstPurchase={firstPurchase}
            />
          )}
        </Elements>
      </div>
    </>
  );
}

export default VoicebotPlanCheckout;
