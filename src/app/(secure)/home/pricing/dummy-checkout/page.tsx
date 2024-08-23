"use client";

import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React, { useEffect, useState } from "react";
import Loader from "../_components/Loader";
import { useSearchParams } from "next/navigation";
import { useCookies } from "react-cookie";
import { message } from "antd";
import axios from "axios";
import DummyPaymentMethod from "../_components/DummyPaymentMethod";

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

function page() {
  const searchParams = useSearchParams();
  const priceId: any = searchParams ? searchParams.get("priceId") : null;
  const [loader, setLoader] = useState(true);
  const [subscriptionDetail, setSubscriptionDetail]: any = useState();
  const [customerId, setCustomerId] = useState("");

  const [cookies, setCookie] = useCookies(["userId"]);
  const u_id: any = cookies.userId;
  //   const stripe = useStripe();
  let response: any;

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

  console.log("subscriptoooo", subscriptionDetail);

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
            />
          )}
        </Elements>
      </div>
    </>
  );
}

export default page;
