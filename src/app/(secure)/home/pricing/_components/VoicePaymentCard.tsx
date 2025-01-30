"use client";
import React, { useEffect, useState } from "react";
import Loader from "./Loader";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCookies } from "react-cookie";
import { redirect, useSearchParams } from "next/navigation";
import { Button } from "antd";
import DangerIcon from "../../../../../../public/svgs/danger.svg";
import Image from "next/image";
import axios from "axios";
import PaymentSucessmodal from "./PaymentSucessmodal";

function VoicePaymentCard({ amount, credits }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [cookies, setCookie] = useCookies(["userId"]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const u_id: any = cookies.userId;
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const param: any = useSearchParams();
  const firstVoicePurchase = param.get("firstVoicePurchase");

  const [subscriptionDetail, setSubscriptionDetail] = useState({});
  const [cardErrors, setCardErrors] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    paymentFailed: false,
  });

  console.log("voicebot purchase query params ", firstVoicePurchase);

  // card detail input change functionality
  function handleCardInputChange(event: any) {
    // Listen for changes in card input
    // and display errors, if any, to the user
    // Also control the disabled state of the submit button
    // if the input field is empty

    if (event.elementType === "cardNumber") {
      setCardErrors((prev) => {
        return {
          ...prev,
          cardNumber: event?.error?.message ?? "",
        };
      });
    } else if (event.elementType === "cardExpiry") {
      setCardErrors((prev) => {
        return {
          ...prev,
          expiryDate: event?.error?.message ?? "",
        };
      });
    } else if (event.elementType === "cardCvc") {
      setCardErrors((prev) => {
        return {
          ...prev,
          cvc: event?.error?.message ?? "",
        };
      });
    }

    setDisabled(event?.empty);
    // setError(event?.error?.message ?? "");
  }

  const handleSubmit = async (event: any) => {
    try {
      setCardErrors((prev) => {
        return {
          ...prev,
          paymentFailed: false,
        };
      });
      event.preventDefault();
      // setLoading(true); // Start loader
      setPaymentLoading(true);

      if (!stripe || !elements) {
        // Stripe.js has not loaded yet.
        // setLoading(false);
        setPaymentLoading(false);
        return;
      }

      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) {
        // setLoading(false);
        setPaymentLoading(false);
        setError("Card element not found");
        return;
      }

      let response, paymentIntentStatus;

      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        // Handle error (e.g., show error message to the user)
        setCardErrors((prev) => ({
          ...prev,
          paymentFailed: true,
          errorMessage: error.message,
        }));
      }

      response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/stripe-payment-gateway/create-payment`,
        {
          amount: amount,
          u_id: u_id,
          paymentMethodId: paymentMethod?.id,
        }
      );

      const { clientSecret } = response.data;

      // Confirm the PaymentIntent
      const { paymentIntent, error: confirmError } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethod?.id,
        });

      if (confirmError) {
        setCardErrors((prev) => ({
          ...prev,
          paymentFailed: true,
          errorMessage: confirmError.message,
        }));
        return;
      }

      console.log("Payment successful:", paymentIntent);
      setIsModalOpen(true);
      setSubscriptionDetail(paymentIntent);
    } catch (error) {
      console.log("eeeeee", error);

      setPaymentLoading(false);
    } finally {
      setLoading(false);
      setPaymentLoading(false);
    }
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <>
          {isModalOpen && (
            <PaymentSucessmodal
              isModalOpen={isModalOpen}
              subscriptionDetail={subscriptionDetail}
              isVoiceInvoice={true}
              firstPurchase = {firstVoicePurchase}
            />
          )}

          <div className="card-main new-card">
            <div className="card-head">Billing Info</div>
            <form
              className="cardElementForm broad-card"
              onSubmit={handleSubmit}
            >
              <div className="left white-left">
                <div className="wallet-credit">
                  <label htmlFor="walletcredit" className="label">
                    Wallet Credits
                  </label>

                  <div className="pricing">
                    <p>${credits}</p>
                  </div>
                </div>

                <div className="recharge-credit">
                  <label htmlFor="rechargecredit" className="label">
                    Amount to Recharge
                  </label>

                  <div className="pricing">
                    <p>${amount}</p>
                  </div>
                </div>

                <div className="total-credit">
                  <label htmlFor="totalcredit" className="label">
                    Total
                  </label>

                  <div className="pricing">
                    <p>${Number(amount) + Number(credits)}</p>
                  </div>
                </div>
              </div>
              <div className="right white-right">
                <div className="right-top">Pay with Card</div>
                <div className="card-element">
                  <label className="card-label">Card Number</label>
                  <div className="cardNumber">
                    <CardNumberElement onChange={handleCardInputChange} />
                  </div>
                  {cardErrors.cardNumber && (
                    <div className="card-error cvc-error">
                      {cardErrors.cardNumber}
                    </div>
                  )}
                  <label className="card-label">Card Expiry</label>
                  <div className="cardExpiry">
                    <CardExpiryElement onChange={handleCardInputChange} />
                  </div>
                  {cardErrors.expiryDate && (
                    <div className="card-error cvc-error">
                      {cardErrors.expiryDate}
                    </div>
                  )}
                  <label className="card-label">Card CVC</label>
                  <div className="cardCvc">
                    <CardCvcElement onChange={handleCardInputChange} />
                  </div>
                  {cardErrors.cvc && (
                    <div className="card-error cvc-error">{cardErrors.cvc}</div>
                  )}
                </div>
                {/* <form onSubmit={handleSubmit}>
              <CardElement onChange={handleCardInputChange} />
              </form> */}

                <Button
                  className="btn-card-submit"
                  // type="submit"
                  disabled={disabled}
                  onClick={handleSubmit}
                  loading={paymentLoading}
                  style={{ display: "flex" }}
                >
                  Buy Credit
                </Button>

                {cardErrors.paymentFailed && (
                  <div className="payment-failed">
                    <div>
                      <Image src={DangerIcon} alt="danger" />
                    </div>
                    <div>
                      <p className="title">Payment failed</p>
                      <p className="description">
                        Payment failed. Please try again.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}

export default VoicePaymentCard;
