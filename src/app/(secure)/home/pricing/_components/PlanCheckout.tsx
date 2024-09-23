"use client";
import React, { useEffect, useState } from "react";
import DummyPaymentMethod from "./DummyPaymentMethod";
import axios from "axios";
import { message } from "antd";
import { useCookies } from "react-cookie";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Loader from "./Loader";
import CryptoJS from "crypto-js";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

function PlanCheckout() {
  const searchParams = useSearchParams();
  const a: any = searchParams ? searchParams.get("priceId") : null;
  const source: any = searchParams ? searchParams.get("source") : null;
  const type: any = searchParams ? searchParams.get("type") : null;
  const isActive: any = searchParams ? searchParams.get("isActive") : false;
  const encryptedPriceId = decodeURIComponent(a);
  const [loader, setLoader] = useState(true);
  const [subscriptionDetail, setSubscriptionDetail]: any = useState();
  const [customerId, setCustomerId] = useState("");
  const cryptoSecret: any = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

  const [cookies, setCookie] = useCookies(["userId"]);
  const u_id: any = cookies.userId;
  //   const stripe = useStripe();
  let response: any;

  function decryptPriceId(encryptedPriceId: string) {
    const bytes = CryptoJS.AES.decrypt(encryptedPriceId, cryptoSecret);

    return bytes.toString(CryptoJS.enc.Utf8);
  }

  const priceId: any = encryptedPriceId
    ? decryptPriceId(encryptedPriceId)
    : null;

  const getCustomer = async () => {
    setLoader(true);
    try {
      response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getCustomer`,
        {
          u_id: u_id,
        }
      );

      setCustomerId(response?.data?.customerId);
    } catch {
      message.error("error while getting customer data");
      // throw error;
    }

    // try {
    //   const update: any = await axios.post(
    //     `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/create-subscription`,
    //     { priceId: [priceId], customerId: response.data.customerId }
    //   );

    //   setSubscriptionDetail(update.data);
    // } catch (error) {
    //   message.error(`${error}`);
    //   window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
    //   throw error;
    // }

    setLoader(false);
  };

  useEffect(() => {
    getCustomer();
  }, []);

  console.log(">>>>>>>", isActive);

  return (
    <>
      <div>
        <Elements stripe={stripePromise}>
          {loader ? (
            <Loader />
          ) : (
            // <CreatePaymentMethod
            //   plan={selectedPlan?.id}
            //   price={
            //     selectedPlan?.id == 4 || selectedPlan?.id == 2
            //       ? decryptedData
            //       : selectedPlan?.price
            //   }
            //   duration={selectedPlan?.days === 365 ? "year" : "month"}
            //   name={selectedPlan?.name}
            // />

            <DummyPaymentMethod
              price={subscriptionDetail?.price}
              interval={subscriptionDetail?.interval}
              customerId={customerId}
              priceId={priceId}
              source={source}
              type={type}
              isActive={isActive}
            />
          )}
        </Elements>
      </div>
    </>
  );
}

export default PlanCheckout;
