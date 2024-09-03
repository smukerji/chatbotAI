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
import ArrowDown from "../../../../../../public/svgs/arrow-down-bold.svg";
import Image from "next/image";
import { useCookies } from "react-cookie";

const whatsappPriceId: any = process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID;
const slackPriceId: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID;
const telegramPriceId: any = process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID;
const trainingData: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;
const conversationHistory: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MONTHLY;
const leads: any = process.env.NEXT_PUBLIC_LEADS_MONTHLY;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;

function findPrice(prices: any, envPriceId: string) {
  const priceObj = prices.find(
    (price: any) => price.priceId === envPriceId
    // && price.interval === interval
  );
  return priceObj ? priceObj.unit_amount / 100 : null;
}

function DummyPaymentMethod({
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
  const [cookies, setCookie] = useCookies(["userId"]);
  const [newPriceId, setNewPriceId] = useState([priceId]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [planPrice, setPlanPrice] = useState(0);
  const [isSocialDropdownOpen, setIsSocialDropdownOpen] = useState(true);
  const [isOtherDropdownOpen, setIsOtherDropdownOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [prices, setPrices] = useState([]);
  const [addonPrices, setAddonPrices] = useState<any>({
    msgSmallPrice: null,
    msgLargePrice: null,
    onBoardingPrice: null,
    trainingDataPrice: null,
    conversationHistoryPrice: null,
    leadsPrice: null,
    whatsappPlanPrice: null,
    slackPlanPrice: null,
    telegramPlanPrice: null,
  });

  const u_id: any = cookies.userId;

  const [checkedIntegrations, setCheckedIntegrations] = useState<{
    [key: string]: boolean;
  }>({
    [whatsappPriceId]: false,
    [slackPriceId]: false,
    [telegramPriceId]: false,
    // Add other integrations here
  });

  function handleCardInputChange(event: any) {
    // Listen for changes in card input
    // and display errors, if any, to the user
    // Also control the disabled state of the submit button
    // if the input field is empty
    setDisabled(event?.empty);
    setError(event?.error?.message ?? "");
  }

  const toggleDropdown = (dropdownType: string) => {
    if (dropdownType === "social") {
      setIsSocialDropdownOpen((prev) => !prev);
    } else if (dropdownType === "other") {
      setIsOtherDropdownOpen((prev) => !prev);
    }
  };

  async function handleSubmit(event: any) {
    event.preventDefault();
    setLoading(true); // Start loader
    setPaymentLoading(true);

    if (!stripe || !elements) {
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
      setPaymentLoading(false);
    } else {
      // setSuccess("Payment succeeded! Thank you for your purchase.");
      message.success("Payment succeeded! Thank you for your purchase.");
      setLoading(false);
      setPaymentLoading(false);
    }
  }

  const handleChange = async (e: any, integrationId: string) => {
    const isChecked = e.target.checked;
    const price: any = await fetchProductDetail(integrationId);

    setCheckedIntegrations((prev) => ({
      ...prev,
      [integrationId]: isChecked,
    }));

    if (isChecked) {
      setTotalPrice((prev) => prev + price);
      setNewPriceId((prev) => [...prev, integrationId]); // Add the integrationId to the array
    } else {
      setTotalPrice((prev) => prev - price);
      setNewPriceId((prev) => prev.filter((id) => id !== integrationId)); // Remove the integrationId from the array
    }
  };

  const fetchProductDetail = async (id: string) => {
    try {
      setLoading(true);
      const productDetail = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/retrieve-product?priceId=${id}`
      );
      // setTotalPrice((prev) => prev + productDetail.data.data.unit_amount / 100);
      // console.log("product detail", productDetail);

      return productDetail.data.data.unit_amount / 100;
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/get-plan-prices`,
        {
          u_id: u_id,
        }
      );
      setPrices(response.data.prices);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (prices?.length > 0) {
      const msgSmallPrice = findPrice(prices, msgSmall);
      const msgLargePrice = findPrice(prices, msgLarge);
      const onBoardingPrice = findPrice(prices, onBoarding);
      const trainingDataPrice = findPrice(prices, trainingData);
      const conversationHistoryPrice = findPrice(prices, conversationHistory);
      const leadsPrice = findPrice(prices, leads);
      const whatsappPlanPrice = findPrice(prices, whatsappPriceId);
      const slackPlanPrice = findPrice(prices, slackPriceId);
      const telegramPlanPrice = findPrice(prices, telegramPriceId);

      // Set these prices in your state or directly in your JSX where needed
      setAddonPrices({
        msgSmallPrice,
        msgLargePrice,
        onBoardingPrice,
        trainingDataPrice,
        conversationHistoryPrice,
        leadsPrice,
        whatsappPlanPrice,
        slackPlanPrice,
        telegramPlanPrice,
      });
    }
  }, [prices]);

  useEffect(() => {
    fetchProductDetail(priceId).then((price: any) => {
      setTotalPrice(price);
      setPlanPrice(price);
    });
    fetchPrices();
  }, []);

  return (
    <>
      {/* {loading ? (
        <Loader />
      ) : ( */}
      <div className="card-main new-card">
        <div className="card-head">Billing Info</div>
        <form className="cardElementForm broad-card" onSubmit={handleSubmit}>
          <div className="left white-left">
            <div className="top-left">
              <div className="plan-name">Individual Plan</div>
              <div className="price">
                {/* <span>${Number(price) / 100}</span> */}
                <span>${planPrice}</span>
                <span className="price-duration">Per Month</span>
              </div>
            </div>
            {/* <Image src={line} alt={"no image"} /> */}
            {/* {(plan == 1 || plan == 3 || plan == 2 || plan == 4) && defaultChecked && ( */}
            <div className="social-integration">
              <div
                className="drop-down-icon"
                onClick={() => toggleDropdown("social")}
              >
                <span>
                  <Image src={ArrowDown} alt="arrow-down" />
                </span>
                Social Integrations
              </div>
              {isSocialDropdownOpen && (
                <div
                  className="dropdown-content"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "baseline",
                    width: "100%",
                  }}
                >
                  {/* Social Integrations checkboxes */}

                  <div
                    className={`checkbox ${
                      checkedIntegrations[whatsappPriceId] ? "active-label" : ""
                    }`}
                  >
                    <div className={`check-label`}>
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[whatsappPriceId] || false}
                        className="price-checkbox"
                        id="whatsappIntegrationCheckbox"
                        onChange={(e) => {
                          handleChange(e, whatsappPriceId);
                        }}
                      />
                      <label
                        htmlFor="whatsappIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Whatsapp Integration
                      </label>
                    </div>

                    <div className="pricing">
                      <p>${addonPrices.whatsappPlanPrice ?? 0}</p>
                    </div>
                  </div>
                  <div
                    className={`checkbox ${
                      checkedIntegrations[slackPriceId] ? "active-label" : ""
                    }`}
                  >
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[slackPriceId] || false}
                        id="slackIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, slackPriceId);
                        }}
                      />
                      <label
                        htmlFor="slackIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Slack Integration
                      </label>
                    </div>
                    <div className="pricing">
                      <p>${addonPrices.slackPlanPrice ?? 0}</p>
                    </div>
                  </div>

                  <div
                    className={`checkbox ${
                      checkedIntegrations[telegramPriceId] ? "active-label" : ""
                    }`}
                  >
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="telegramIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="telegramIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Telegram Integration
                      </label>
                    </div>

                    <div className="pricing">
                      <p>${addonPrices.telegramPlanPrice ?? 0}</p>
                    </div>
                  </div>

                  {/* instagram */}
                  <div className="checkbox hidden">
                    <div className="check-label ">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="instagramIntegrationCheckbox"
                        className="price-checkbox"
                        // onChange={(e) => {
                        //   handleChange(e, telegramPriceId);
                        // }}
                        disabled
                      />
                      <label
                        htmlFor="instagramIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Instagram
                      </label>
                    </div>

                    <div className="pricing coming-soon">
                      <p>Coming Soon</p>
                    </div>
                  </div>
                  {/* Messenger */}
                  <div className="checkbox hidden">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="messengerIntegrationCheckbox"
                        className="price-checkbox"
                        // onChange={(e) => {
                        //   handleChange(e, telegramPriceId);
                        // }}
                        disabled
                      />
                      <label
                        htmlFor="messengerIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Messenger
                      </label>
                    </div>
                    <div className="pricing coming-soon">
                      <p>Coming Soon</p>
                    </div>
                  </div>
                  {/* Sevenrooms */}
                  <div className="checkbox hidden">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="sevenroomsIntegrationCheckbox"
                        className="price-checkbox"
                        // onChange={(e) => {
                        //   handleChange(e, telegramPriceId);
                        // }}
                        disabled
                      />
                      <label
                        htmlFor="sevenroomsIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Sevenrooms
                      </label>
                    </div>

                    <div className="pricing coming-soon">
                      <p>Coming Soon</p>
                    </div>
                  </div>
                  {/* Mindbody */}
                  <div className="checkbox hidden">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="mindbodyIntegrationCheckbox"
                        className="price-checkbox"
                        // onChange={(e) => {
                        //   handleChange(e, telegramPriceId);
                        // }}
                        disabled
                      />
                      <label
                        htmlFor="mindbodyIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Mindbody
                      </label>
                    </div>
                    <div className="pricing coming-soon">
                      <p>Coming Soon</p>
                    </div>
                  </div>
                  {/* Hubspot */}
                  <div className="checkbox hidden">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="hubspotIntegrationCheckbox"
                        className="price-checkbox"
                        // onChange={(e) => {
                        //   handleChange(e, telegramPriceId);
                        // }}
                        disabled
                      />
                      <label
                        htmlFor="hubspotIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Hubspot
                      </label>
                    </div>

                    <div className="pricing coming-soon">
                      <p>Coming Soon</p>
                    </div>
                  </div>
                  {/* Zoho crm */}
                  <div className="checkbox hidden">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="zohocrmIntegrationCheckbox"
                        className="price-checkbox"
                        // onChange={(e) => {
                        //   handleChange(e, telegramPriceId);
                        // }}
                        disabled
                      />
                      <label
                        htmlFor="zohocrmIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Zoho CRM
                      </label>
                    </div>

                    <div className="pricing coming-soon">
                      <p>Coming Soon</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="other-addons social-integration">
              <div
                className="drop-down-icon"
                onClick={() => toggleDropdown("other")}
              >
                {" "}
                <span>
                  <Image src={ArrowDown} alt="arrow-down" />
                </span>
                Other Add-ons
              </div>
              {isOtherDropdownOpen && (
                <div
                  className="dropdown-content"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "baseline",
                    width: "100%",
                  }}
                >
                  {/* Other Add-ons checkboxes */}

                  <div className="checkbox">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="onboardingIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="onboardingIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Onboarding
                      </label>
                    </div>

                    <div className="pricing">
                      <p>${addonPrices.onBoardingPrice ?? 0}</p>
                    </div>
                  </div>
                  <div className="checkbox">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="5kmessagesIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="5kmessagesIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        5K Messages
                      </label>
                    </div>

                    <div className="pricing">
                      <p>${addonPrices.msgSmallPrice ?? 0}</p>
                    </div>
                  </div>
                  <div className="checkbox">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="10kIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="10kIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        10K Messeges
                      </label>
                    </div>
                    <div className="pricing">
                      <p>${addonPrices.msgLargePrice ?? 0}</p>
                    </div>
                  </div>
                  <div className="checkbox">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="trainingIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="trainingIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Training Data(1M)
                      </label>
                    </div>

                    <div className="pricing">
                      <p>${addonPrices.trainingDataPrice ?? 0}</p>
                    </div>
                  </div>
                  <div className="checkbox">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="conversationhistoryIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="conversationhistoryIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Conversation History (3 Years)
                      </label>
                    </div>
                    <div className="pricing">
                      <p>${addonPrices.conversationHistoryPrice ?? 0}</p>
                    </div>
                  </div>
                  <div className="checkbox">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="leadIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="leadIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Lead (Unlimited) Individual
                      </label>
                    </div>
                    <div className="pricing">
                      <p>${addonPrices.leadsPrice ?? 0}</p>
                    </div>
                  </div>
                  <div className="checkbox hidden">
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[telegramPriceId] || false}
                        id="sentimetIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, telegramPriceId);
                        }}
                      />
                      <label
                        htmlFor="sentimetIntegrationCheckbox"
                        className="checkbox-label"
                      >
                        Sentiment Dashbaord
                      </label>
                    </div>
                    <div className="pricing coming-soon">
                      <p>Coming soon</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* )} */}
            <div className="bottom-left">
              <div className="total">Total</div>
              <div className="total-price">${Number(totalPrice)}</div>
            </div>
          </div>
          <div className="right white-right">
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
              loading={paymentLoading}
              style={{ display: "flex" }}
            >
              Subscribe
            </Button>
          </div>
        </form>
      </div>
      {/* )} */}
    </>
  );
}

export default DummyPaymentMethod;
