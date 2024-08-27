import {
  CardCvcElement,
  CardElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button, message } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Loader from "./Loader";

function DummyPaymentMethod({
  price,
  interval,
  customerId,
  priceId,
}: {
  price: string;
  interval: string;
  customerId: string;
  priceId: string;
}) {
  const [disabled, setDisabled] = useState(false);
  const [error, setError] = useState("");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isCheckedSlack, setIsCheckedSlack] = useState(false);
  const [newPriceId, setNewPriceId] = useState([priceId]);
  const [totalPrice, setTotalPrice] = useState(0);

  console.log("customerid", customerId);

  function handleCardInputChange(event: any) {
    // Listen for changes in card input
    // and display errors, if any, to the user
    // Also control the disabled state of the submit button
    // if the input field is empty
    setDisabled(event?.empty);
    setError(event?.error?.message ?? "");
  }

  async function handleSubmit(event: any) {
    event.preventDefault();
    setLoading(true); // Start loader

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet.
      // Stripe.js has not loaded yet.
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) {
      setLoading(false);
      setError("Card element not found");
      return;
    }

    // Call the subscribe endpoint and create a Stripe subscription
    // object. Returns the subscription ID and client secret
    const subscription = await axios.post(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/create-subscription`,
      { priceId: newPriceId, customerId: customerId }
    );

    console.log(
      "subscriptionnn",

      ">>>>",
      subscription.data,
      subscription.data.clientSecret
    );
    const stripePayload = await stripe.confirmCardPayment(
      subscription.data.clientSecret, // returned by subscribe endpoint
      {
        payment_method: {
          card: cardElement,
        },
      }
    );

    if (stripePayload.error) {
      setError(
        stripePayload.error.message ?? "Payment failed. Please try again."
      );
      setLoading(false);
    } else {
      // setSuccess("Payment succeeded! Thank you for your purchase.");
      message.success("Payment succeeded! Thank you for your purchase.");
      setLoading(false);
    }
  }

  const handleWhatsappChange = async (e: any) => {
    setIsChecked(e.target.checked);
    const price: any = await fetchProductDetail(
      "price_1PqpudHhVvYsUDoGJA8m5Biz"
    );

    if (e.target.checked) {
      setTotalPrice((prev) => prev + price);
      setNewPriceId([...newPriceId, "price_1PqpudHhVvYsUDoGJA8m5Biz"]); // add whatsapp price id to the array
    } else {
      setTotalPrice((prev) => prev - price);
      setNewPriceId(
        newPriceId.filter((id) => id !== "price_1PqpudHhVvYsUDoGJA8m5Biz")
      ); // remove whatsapp price id from the array
    }
  };

  const handleSlackChange = async (e: any) => {
    setIsCheckedSlack(e.target.checked);
    const price: any = await fetchProductDetail(
      "price_1PqpuqHhVvYsUDoGdxU77hzP"
    );

    if (e.target.checked) {
      setTotalPrice((prev) => prev + price);
      setNewPriceId([...newPriceId, "price_1PqpuqHhVvYsUDoGdxU77hzP"]);
    } else {
      setNewPriceId(
        newPriceId.filter((id) => id !== "price_1PqpuqHhVvYsUDoGdxU77hzP")
      );
      setTotalPrice((prev) => prev - price);
    }
  };

  const fetchProductDetail = async (id: string) => {
    try {
      const productDetail = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/retrieve-product?priceId=${id}`
      );
      // setTotalPrice((prev) => prev + productDetail.data.data.unit_amount / 100);
      return productDetail.data.data.unit_amount / 100;
    } catch (error) {
      console.log("rrrrrrrrrr", error);
    }
  };

  useEffect(() => {
    fetchProductDetail(priceId).then((price: any) => {
      setTotalPrice(price);
    });
  }, []);

  console.log("new price id", totalPrice, newPriceId);

  return (
    <>
      {/* {loading ? (
        <Loader />
      ) : ( */}
      <div className="card-main">
        <div className="card-head">Billing Info</div>
        <form className="cardElementForm" onSubmit={handleSubmit}>
          <div className="left">
            <div className="top-left">
              <div className="plan-name">Individual Plan</div>
              <div className="price">
                {/* <span>${Number(price) / 100}</span> */}
                <span>$10</span>
                <span className="price-duration">Per Month</span>
              </div>
            </div>
            {/* <Image src={line} alt={"no image"} /> */}
            {/* {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && ( */}
            <div className="checkbox">
              <input
                type="checkbox"
                // defaultChecked={defaultChecked}
                checked={isChecked}
                className="price-checkbox"
                id="whatsappIntegrationCheckbox"
                onChange={(e) => {
                  handleWhatsappChange(e);
                }}
              />
              <label
                htmlFor="whatsappIntegrationCheckbox"
                className="checkbox-label"
              >
                Add whatsapp Integration
              </label>
            </div>
            {/* )} */}
            {/* {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && ( */}
            <div className="checkbox">
              <input
                type="checkbox"
                // defaultChecked={defaultChecked}
                checked={isCheckedSlack}
                id="slackIntegrationCheckbox"
                className="price-checkbox"
                onChange={(e) => {
                  handleSlackChange(e);
                }}
              />
              <label
                htmlFor="slackIntegrationCheckbox"
                className="checkbox-label"
              >
                Add Slack Integration
              </label>
            </div>
            {/* )} */}
            <div className="bottom-left">
              <div className="total">Total</div>
              <div className="total-price">${Number(totalPrice)}</div>
            </div>
          </div>
          <div className="right">
            <div className="right-top">Pay with Card</div>
            <div className="card-element">
              <label className="card-label">Card Number</label>
              <div className="cardNumber">
                <CardNumberElement onChange={handleCardInputChange} />
              </div>
              <label className="card-label">Card Expiry</label>
              <div className="cardExpiry">
                <CardExpiryElement onChange={handleCardInputChange} />
              </div>
              <label className="card-label">Card CVC</label>
              <div className="cardCvc">
                <CardCvcElement onChange={handleCardInputChange} />
              </div>
            </div>
            {/* <form onSubmit={handleSubmit}>
              <CardElement onChange={handleCardInputChange} />
            </form> */}
            {error && <div>{error}</div>}
            <Button
              className="btn-card-submit"
              // type="submit"
              disabled={!stripe && disabled}
              onClick={handleSubmit}
              loading={loading}
              style={{ display: "flex" }}
            >
              Pay
            </Button>
          </div>
        </form>
      </div>
      {/* )} */}
    </>
  );
}

export default DummyPaymentMethod;
