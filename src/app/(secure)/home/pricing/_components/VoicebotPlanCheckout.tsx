"use client";
import { Elements } from "@stripe/react-stripe-js";
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import Loader from "./Loader";
import { loadStripe } from "@stripe/stripe-js";
import VoicePaymentCard from "./VoicePaymentCard";
import { useSearchParams } from "next/navigation";
import CryptoJS from "crypto-js";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

const cryptoSecret: any = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

function VoicebotPlanCheckout() {
  const searchParams = useSearchParams();
  const a: any = searchParams ? searchParams.get("amount") : null;
  const b: any = searchParams ? searchParams.get("credit") : null;

  

  const encryptedPriceId = decodeURIComponent(a);
  const encryptedCredits = decodeURIComponent(b);

  const [cookies, setCookie] = useCookies(["userId"]);
  const u_id: any = cookies.userId;
  const [loader, setLoader] = useState(false);

  function decryptPriceId(encryptedPriceId: string) {
    const bytes = CryptoJS.AES.decrypt(encryptedPriceId, cryptoSecret);

    return bytes.toString(CryptoJS.enc.Utf8);
  }

  const amount: any = encryptedPriceId
    ? decryptPriceId(encryptedPriceId)
    : null;

  const credits: any = encryptedCredits
    ? decryptPriceId(encryptedCredits)
    : null;

  return (
    <>
      <div>
        <Elements stripe={stripePromise}>
          {loader ? (
            <Loader />
          ) : (
            <VoicePaymentCard
              amount={amount}
              credits={credits}

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
