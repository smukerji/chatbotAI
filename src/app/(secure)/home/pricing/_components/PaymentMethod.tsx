import {
  CardCvcElement,
  CardElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button, message, Modal, Tooltip } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import Loader from "./Loader";
import ArrowDown from "../../../../../../public/svgs/arrow-down-bold.svg";
import Image from "next/image";
import { useCookies } from "react-cookie";
import DangerIcon from "../../../../../../public/svgs/danger.svg";
import PaymentSucessmodal from "./PaymentSucessmodal";

const whatsappPriceIdMonthly: any =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_MONTHLY;
const whatsappPriceIdYearly: any =
  process.env.NEXT_PUBLIC_WHATSAPP_PLAN_ID_YEARLY;
const slackPriceIdMonthly: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID_MONTHLY;
const slackPriceIdYearly: any = process.env.NEXT_PUBLIC_SLACK_PLAN_ID_YEARLY;
const telegramPriceIdMonthly: any =
  process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_MONTHLY;
const telegramPriceIdYearly: any =
  process.env.NEXT_PUBLIC_TELEGRAM_PLAN_ID_YEARLY;
const trainingData: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;
const trainingDataYearly: any = process.env.NEXT_PUBLIC_TRAINING_DATA_YEARLY;
const conversationHistoryMonthly: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_MONTHLY;
const conversationHistoryYearly: any =
  process.env.NEXT_PUBLIC_CONVERSATION_HISTORY_YEARLY;
const leadsMonthly: any = process.env.NEXT_PUBLIC_LEADS_MONTHLY;
const leadsYearly: any = process.env.NEXT_PUBLIC_LEADS_YEARLY;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;

const businessMonthly: any = process.env.NEXT_PUBLIC_BUSINESS_PLAN_MONTHLY;
const businessYearly: any = process.env.NEXT_PUBLIC_BUSINESS_PLAN_YEARLY;

function findPrice(prices: any, envPriceId: string) {
  const priceObj = prices.find(
    (price: any) => price.priceId === envPriceId
    // && price.interval === interval
  );
  return priceObj ? priceObj.unit_amount / 100 : null;
}

function PaymentMethod({
  customerId,
  priceId,
  source,
  type,
  isActive,
  firstPurchase,
}: {
  price: string;
  interval: string;
  customerId: string;
  priceId: string;
  source: string;
  type: string;
  isActive: boolean;
  firstPurchase: boolean;
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
  const [interval, setInterval] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subscriptionDetail, setSubscriptionDetail] = useState();
  const [parentPlanName, setParentPlanName] = useState("");
  const [cardErrors, setCardErrors] = useState({
    cardNumber: "",
    expiryDate: "",
    cvc: "",
    paymentFailed: false,
  });
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
    [whatsappPriceIdMonthly]: false,
    [whatsappPriceIdYearly]: false,
    [slackPriceIdMonthly]: false,
    [slackPriceIdYearly]: false,
    [telegramPriceIdMonthly]: false,
    [telegramPriceIdYearly]: false,
    [trainingData]: false,
    [trainingDataYearly]: false,
    [conversationHistoryMonthly]: false,
    [conversationHistoryYearly]: false,
    [leadsMonthly]: false,
    [leadsYearly]: false,
    [onBoarding]: false,
    [msgSmall]: false,
    [msgLarge]: false,

    // Add other integrations here
  });

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
    setError(event?.error?.message ?? "");
  }

  // toggle addon dropdown
  const toggleDropdown = (dropdownType: string) => {
    if (dropdownType === "social") {
      setIsSocialDropdownOpen((prev) => !prev);
    } else if (dropdownType === "other") {
      setIsOtherDropdownOpen((prev) => !prev);
    }
  };

  // On submit subscription functionality
  async function handleSubmit(event: any) {
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

      // Call the subscribe endpoint and create a Stripe subscription
      let subscription;
      let paymentIntentStatus;

      if (source == "addon") {
        // Call your update endpoint to add an addon to the existing subscription

        subscription = await axios.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/add-addon`,
          {
            priceId: newPriceId,
            customerId: customerId,
            u_id: u_id,
            paymentMethodId: paymentMethod?.id,
          }
        );

        // const isOneOff = subscription.data.isOneOff;

        if (!subscription.data.parentFound) {
          setPaymentLoading(false);
          message.error(subscription.data.msg);
          return;
        }
      } else {
        // object. Returns the subscription ID and client secret
        subscription = await axios.post(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/create-subscription`,
          {
            priceId: newPriceId,
            customerId: customerId,
            u_id: u_id,
            paymentMethodId: paymentMethod?.id,
          }
        );

        if (subscription.data.alreadyExist) {
          message.error(subscription.data.msg);
          setPaymentLoading(false);
          return;
        }
      }

      paymentIntentStatus = subscription.data.paymentIntentStatus;

      // Check if payment intent is already confirmed
      if (
        paymentIntentStatus === "requires_payment_method" ||
        paymentIntentStatus === "requires_confirmation"
      ) {
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(subscription.data.clientSecret, {
            payment_method: {
              card: cardElement,
            },
          });

        if (stripeError) {
          setCardErrors((prev) => ({
            ...prev,
            paymentFailed: true,
          }));
        } else {
          setSubscriptionDetail(subscription.data);

          setIsModalOpen(true);
        }
      } else if (
        paymentIntentStatus === "succeeded" ||
        paymentIntentStatus === "paid"
      ) {
        setSubscriptionDetail(subscription.data);

        // Payment has already succeeded, no need to confirm again
        setIsModalOpen(true);
      }

      setPaymentLoading(false);
    } catch (error) {
      // setLoading(false);
      setPaymentLoading(false);
    }
  }

  // addons checkbox functionality onchange
  const handleChange = async (e: any, integrationId: string) => {
    const isChecked = e.target.checked;
    const price: any = await fetchProductDetail(integrationId);

    setCheckedIntegrations((prev) => ({
      ...prev,
      [integrationId]: isChecked,
    }));

    if (isChecked) {
      setTotalPrice((prev) => prev + Number(price?.amount));
      setNewPriceId((prev) => [...prev, integrationId]); // Add the integrationId to the array
    } else {
      setTotalPrice((prev) => prev - Number(price?.amount));
      setNewPriceId((prev) => prev.filter((id) => id !== integrationId)); // Remove the integrationId from the array
    }
  };

  // fetch already subscribed product details
  const fetchProductDetail = async (id: string) => {
    try {
      // setLoading(true);
      const productDetail = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/retrieve-product?priceId=${id}`
      );
      // setTotalPrice((prev) => prev + productDetail.data.data.unit_amount / 100);

      return {
        amount: productDetail.data.data.unit_amount / 100,
        interval: productDetail?.data?.data?.recurring?.interval ?? "month",
        productName: productDetail.data.product,
      };
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // fetch all products prices
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
      // console.log("error", error);
    } finally {
      setLoading(false);
    }
  };

  // setting addon prices dynamically
  useEffect(() => {
    if (prices?.length > 0) {
      const msgSmallPrice = findPrice(prices, msgSmall);
      const msgLargePrice = findPrice(prices, msgLarge);
      const onBoardingPrice = findPrice(prices, onBoarding);
      const trainingDataPrice = findPrice(prices, trainingData);
      const conversationHistoryPrice = findPrice(
        prices,
        interval === "year"
          ? conversationHistoryYearly
          : conversationHistoryMonthly
      );
      const leadsPrice = findPrice(
        prices,
        interval === "year" ? leadsYearly : leadsMonthly
      );
      const whatsappPlanPrice = findPrice(
        prices,
        interval === "year" ? whatsappPriceIdYearly : whatsappPriceIdMonthly
      );
      const slackPlanPrice = findPrice(
        prices,
        interval === "year" ? slackPriceIdYearly : slackPriceIdMonthly
      );
      const telegramPlanPrice = findPrice(
        prices,
        interval === "year" ? telegramPriceIdYearly : telegramPriceIdMonthly
      );

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
      setTotalPrice(price?.amount);
      setPlanPrice(price?.amount);
      setInterval(price?.interval);
      setParentPlanName(price?.productName);
    });
    fetchPrices();
  }, []);

  // check the checkbox if coming from any addon
  useEffect(() => {
    if (source === "addon") {
      setCheckedIntegrations((prev) => ({
        ...prev,
        [priceId]: true,
      }));
    }
  }, []);

  useEffect(() => {
    if (priceId === businessMonthly) {
      setCheckedIntegrations((prev) => ({
        ...prev,
        [whatsappPriceIdMonthly]: true,
        [telegramPriceIdMonthly]: true,
      }));
    } else if (priceId === businessYearly) {
      setCheckedIntegrations((prev) => ({
        ...prev,
        [whatsappPriceIdYearly]: true,
        [telegramPriceIdYearly]: true,
      }));
    }
  }, []);

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
              firstPurchase={firstPurchase}
            />
          )}
          {/* ----------------------------Main card start----------------------------- */}
          <div className="card-main new-card">
            <div className="card-head">Billing Info</div>
            <form
              className="cardElementForm broad-card"
              onSubmit={handleSubmit}
            >
              <div className="left white-left">
                {source != "addon" && (
                  <div className="top-left">
                    <div className="plan-name">{parentPlanName}</div>
                    <div className="price">
                      {/* <span>${Number(price) / 100}</span> */}
                      <span>${planPrice}</span>
                      <span className="price-duration">
                        Per {interval === "year" ? "Year" : "Month"}
                      </span>
                    </div>
                  </div>
                )}

                {/* -----------------------------------Onboarding------------------------------------------ */}
                <div className="checkbox">
                  <div className="check-label">
                    <input
                      type="checkbox"
                      // defaultChecked={defaultChecked}
                      checked={checkedIntegrations[onBoarding] || false}
                      id="onboardingIntegrationCheckbox"
                      className="price-checkbox"
                      onChange={(e) => {
                        handleChange(e, onBoarding);
                      }}
                      disabled={type != "oneoff" || isActive}
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

                <div className="social-integration">
                  <div
                    className={`drop-down-icon ${
                      isSocialDropdownOpen ? "expand" : ""
                    }`}
                    onClick={() => toggleDropdown("social")}
                  >
                    <span>
                      <Image src={ArrowDown} alt="arrow-down" />
                    </span>
                    Integrations
                  </div>

                  {/* ------------------------whatsapp integration---------------------------*/}
                  <div
                    className={`checkbox ${
                      checkedIntegrations[
                        interval === "year"
                          ? whatsappPriceIdYearly
                          : whatsappPriceIdMonthly
                      ]
                        ? "active-label"
                        : ""
                    }`}
                  >
                    <div className={`check-label`}>
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={
                          checkedIntegrations[
                            interval === "year"
                              ? whatsappPriceIdYearly
                              : whatsappPriceIdMonthly
                          ] || false
                        }
                        className="price-checkbox"
                        id="whatsappIntegrationCheckbox"
                        onChange={(e) => {
                          handleChange(
                            e,
                            interval === "year"
                              ? whatsappPriceIdYearly
                              : whatsappPriceIdMonthly
                          );
                        }}
                        disabled={
                          type == "oneoff" ||
                          isActive ||
                          priceId === businessMonthly ||
                          priceId === businessYearly
                        }
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
                          checkedIntegrations[
                            interval === "year"
                              ? slackPriceIdYearly
                              : slackPriceIdMonthly
                          ]
                            ? "active-label"
                            : ""
                        }`}
                      >
                        <div className="check-label">
                          <input
                            type="checkbox"
                            // defaultChecked={defaultChecked}
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? slackPriceIdYearly
                                  : slackPriceIdMonthly
                              ] || false
                            }
                            id="slackIntegrationCheckbox"
                            className="price-checkbox"
                            onChange={(e) => {
                              handleChange(
                                e,
                                interval === "year"
                                  ? slackPriceIdYearly
                                  : slackPriceIdMonthly
                              );
                            }}
                            disabled={type == "oneoff" || isActive}
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
                          checkedIntegrations[
                            interval === "year"
                              ? telegramPriceIdYearly
                              : telegramPriceIdMonthly
                          ]
                            ? "active-label"
                            : ""
                        }`}
                      >
                        <div className="check-label">
                          <input
                            type="checkbox"
                            // defaultChecked={defaultChecked}
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="telegramIntegrationCheckbox"
                            className="price-checkbox"
                            onChange={(e) => {
                              handleChange(
                                e,
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              );
                            }}
                            disabled={
                              type == "oneoff" ||
                              isActive ||
                              priceId === businessMonthly ||
                              priceId === businessYearly
                            }
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
                      {/* <div className="checkbox hidden">
                        <div className="check-label ">
                          <input
                            type="checkbox"
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="instagramIntegrationCheckbox"
                            className="price-checkbox"
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
                      </div> */}
                      {/* Messenger */}
                      {/* <div className="checkbox hidden">
                        <div className="check-label">
                          <input
                            type="checkbox"
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="messengerIntegrationCheckbox"
                            className="price-checkbox"
                          
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
                      </div> */}
                      {/* Sevenrooms */}
                      {/* <div className="checkbox hidden">
                        <div className="check-label">
                          <input
                            type="checkbox"
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="sevenroomsIntegrationCheckbox"
                            className="price-checkbox"

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
                      </div> */}
                      {/* Mindbody */}
                      {/* <div className="checkbox hidden">
                        <div className="check-label">
                          <input
                            type="checkbox"
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="mindbodyIntegrationCheckbox"
                            className="price-checkbox"
                            
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
                      </div> */}
                      {/* Hubspot */}
                      {/* <div className="checkbox hidden">
                        <div className="check-label">
                          <input
                            type="checkbox"
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="hubspotIntegrationCheckbox"
                            className="price-checkbox"
                            
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
                      </div> */}
                      {/* Zoho crm */}
                      {/* <div className="checkbox hidden">
                        <div className="check-label">
                          <input
                            type="checkbox"
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? telegramPriceIdYearly
                                  : telegramPriceIdMonthly
                              ] || false
                            }
                            id="zohocrmIntegrationCheckbox"
                            className="price-checkbox"
                            
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
                      </div> */}
                    </div>
                  )}
                </div>

                <div className="other-addons social-integration">
                  <div
                    className={`drop-down-icon ${
                      isOtherDropdownOpen ? "expand" : ""
                    }`}
                    onClick={() => toggleDropdown("other")}
                  >
                    {" "}
                    <span>
                      <Image src={ArrowDown} alt="arrow-down" />
                    </span>
                    Other Add-ons
                  </div>

                  {/* ------------------------------5k messages----------------------------- */}
                  <div
                    className={`checkbox  ${
                      checkedIntegrations[msgSmall] ? "active-label" : ""
                    }`}
                  >
                    <div className="check-label">
                      <input
                        type="checkbox"
                        // defaultChecked={defaultChecked}
                        checked={checkedIntegrations[msgSmall] || false}
                        id="5kmessagesIntegrationCheckbox"
                        className="price-checkbox"
                        onChange={(e) => {
                          handleChange(e, msgSmall);
                        }}
                        disabled={type != "oneoff" || isActive}
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

                      <div
                        className={`checkbox  ${
                          checkedIntegrations[msgLarge] ? "active-label" : ""
                        }`}
                      >
                        <div className="check-label">
                          <input
                            type="checkbox"
                            // defaultChecked={defaultChecked}
                            checked={checkedIntegrations[msgLarge] || false}
                            id="10kIntegrationCheckbox"
                            className="price-checkbox"
                            onChange={(e) => {
                              handleChange(e, msgLarge);
                            }}
                            disabled={type != "oneoff" || isActive}
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
                      <div
                        className={`checkbox  ${
                          checkedIntegrations[trainingData]
                            ? "active-label"
                            : ""
                        }`}
                      >
                        <div className="check-label">
                          <input
                            type="checkbox"
                            // defaultChecked={defaultChecked}
                            checked={checkedIntegrations[trainingData] || false}
                            id="trainingIntegrationCheckbox"
                            className="price-checkbox"
                            onChange={(e) => {
                              handleChange(e, trainingData);
                            }}
                            disabled={type != "oneoff" || isActive}
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
                      <div
                        className={`checkbox  ${
                          checkedIntegrations[
                            interval === "year"
                              ? conversationHistoryYearly
                              : conversationHistoryMonthly
                          ]
                            ? "active-label"
                            : ""
                        }`}
                      >
                        <div className="check-label">
                          <input
                            type="checkbox"
                            // defaultChecked={defaultChecked}
                            checked={
                              checkedIntegrations[
                                interval === "year"
                                  ? conversationHistoryYearly
                                  : conversationHistoryMonthly
                              ] || false
                            }
                            id="conversationhistoryIntegrationCheckbox"
                            className="price-checkbox"
                            onChange={(e) => {
                              handleChange(
                                e,
                                interval === "year"
                                  ? conversationHistoryYearly
                                  : conversationHistoryMonthly
                              );
                            }}
                            disabled={type == "oneoff" || isActive}
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
                      <div
                        className={`checkbox  ${
                          checkedIntegrations[
                            interval === "year" ? leadsYearly : leadsMonthly
                          ]
                            ? "active-label"
                            : ""
                        }`}
                      >
                        <div className="check-label">
                          <input
                            type="checkbox"
                            // defaultChecked={defaultChecked}
                            checked={
                              checkedIntegrations[
                                interval === "year" ? leadsYearly : leadsMonthly
                              ] || false
                            }
                            id="leadIntegrationCheckbox"
                            className="price-checkbox"
                            onChange={(e) => {
                              handleChange(
                                e,
                                interval === "year" ? leadsYearly : leadsMonthly
                              );
                            }}
                            disabled={type == "oneoff" || isActive}
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
                      {/* <div className="checkbox hidden">
                        <div className="check-label">
                          <input
                            type="checkbox"
                            id="sentimetIntegrationCheckbox"
                            className="price-checkbox"
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
                      </div> */}
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
                  Subscribe
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

export default PaymentMethod;
