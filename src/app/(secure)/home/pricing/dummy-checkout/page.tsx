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

const stripePromise = loadStripe(
  String(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
);

function page() {
  const searchParams = useSearchParams();
  const priceId = searchParams ? searchParams.get("priceId") : null;
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const [subscriptionDetail, setSubscriptionDetail]: any = useState();

  const [cookies, setCookie] = useCookies(["userId"]);
  const u_id: any = cookies.userId;
  //   const stripe = useStripe();

  const handleSubmit = () => {};

  const getCustomer = async () => {
    setLoader(true);
    let response: any;
    try {
      response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/getCustomer`,
        {
          u_id: u_id,
        }
      );
    } catch {
      message.error("error while getting customer data");
      // throw error;
    }

    try {
      const update: any = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/create-subscription`,
        { priceId: [priceId], customerId: response.data.customerId }
      );

      setSubscriptionDetail(update.data);
    } catch (error) {
      message.error(`${error}`);
      window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`;
      throw error;
    }

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
            <div className="card-main">
              <div className="card-head">Billing Info</div>
              <form className="cardElementForm" onSubmit={handleSubmit}>
                <div className="left">
                  <div className="top-left">
                    <div className="plan-name">Individual Plan</div>
                    <div className="price">
                      <span>${Number(subscriptionDetail?.price / 100)}</span>
                      <span className="price-duration">
                        Per {subscriptionDetail?.interval}
                      </span>
                    </div>
                  </div>
                  {/* <Image src={line} alt={"no image"} /> */}
                  {/* {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && ( */}
                  {/* <div className='checkbox'>
                  <input
                    type='checkbox'
                    // defaultChecked={defaultChecked}
                    checked={isChecked}
                    className='price-checkbox'
                    id='whatsappIntegrationCheckbox'
                    onChange={(e) => {
                      setIsChecked(e.target.checked);
                    }}
                  />
                  <label htmlFor='whatsappIntegrationCheckbox' className='checkbox-label'>
                    Add whatsapp Integration
                  </label>
                </div> */}
                  {/* )} */}
                  {/* {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && ( */}
                  {/* <div className='checkbox'>
                  <input
                    type='checkbox'
                    defaultChecked={defaultChecked}
                    checked={isCheckedSlack}
                    id='slackIntegrationCheckbox'
                    className='price-checkbox'
                    onChange={(e) => {
                      setIsCheckedSlack(e.target.checked);
                    }}
                  />
                  <label htmlFor='slackIntegrationCheckbox' className='checkbox-label'>
                    Add Slack Integration
                  </label>
                </div> */}
                  {/* )} */}
                  <div className="bottom-left">
                    <div className="total">Total</div>
                    <div className="total-price">
                      ${Number(subscriptionDetail?.price / 100)}
                    </div>
                  </div>
                </div>
                <div className="right">
                  <div className="right-top">Pay with Card</div>
                  <div className="card-element">
                    <label className="card-label">Card Number</label>
                    <div className="cardNumber">
                      <CardNumberElement />
                    </div>
                    <label className="card-label">Card Expiry</label>
                    <div className="cardExpiry">
                      <CardExpiryElement />
                    </div>
                    <label className="card-label">Card CVC</label>
                    <div className="cardCvc">
                      <CardCvcElement />
                    </div>
                  </div>
                  {error && <div>{error}</div>}
                  <button
                    className="btn-card-submit"
                    type="submit"
                    // disabled={!stripe}
                  >
                    Pay
                  </button>
                </div>
              </form>
            </div>
          )}
        </Elements>
      </div>
    </>
  );
}

export default page;
