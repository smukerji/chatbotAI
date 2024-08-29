"use client";
import React, { useEffect, useState } from "react";
import Loader from "./Loader";
import { useSession } from "next-auth/react";
import { useCookies } from "react-cookie";
import StarterPlanBox from "./StarterPlanBox";
import IndividualPlanBox from "./IndividualPlanBox";
import BusinessplanBox from "./BusinessplanBox";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Button } from "antd";
import CryptoJS from "crypto-js";
import axios from "axios";

function PricingWrapperNew() {
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie] = useCookies(["userId"]);
  const [isYearlyPlan, setIsYearlyPlan] = useState(false);
  const [prices, setPrices] = useState([]);
  const router = useRouter();
  const cryptoSecret = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

  const { status } = useSession();

  const u_id: any = cookies.userId;

  const handlePlanType = () => {
    setIsYearlyPlan(!isYearlyPlan);
  };

  function encryptPriceId(priceId: string) {
    if (!cryptoSecret) {
      throw new Error("Crypto secret is not defined");
    }
    return CryptoJS.AES.encrypt(priceId, cryptoSecret).toString();
  }

  async function handleClick(priceId: string) {
    const a = encryptPriceId(priceId);
    const encryptedPriceId = encodeURIComponent(a);

    router.push(`/home/pricing/dummy-checkout?priceId=${encryptedPriceId}`);
  }

  const checkPlan = async () => {
    try {
      setLoading(true);
      //ANCHOR - Checking existing plan details
      const checkPlan = await axios.put(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/check-plan`,
        {
          u_id: u_id,
        }
      );

      console.log("check plan", checkPlan.data);
    } catch (error) {
      console.log("error", error);
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
    checkPlan();
    fetchPrices();
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {loading && <Loader />}
      <div className="main new-main">
        <h2 className="choose-plan">Choose your plan</h2>
        <p className="price-description">
          Please choose your plan to continue using your AI chatagent
        </p>
        <div className="plan-change-container ">
          <Badge
            count={"20% OFF"}
            color="#FE632F"
            style={{
              height: "28px",
              fontSize: "14px",
              lineHeight: "24px",
              display: "flex",
              alignItems: "center",
              borderRadius: "32px",
              position: "absolute",
              top: "-10px",
              right: "37px",
            }}
          >
            <Button
              className={`plan-type ${!isYearlyPlan && "plan-active"}`}
              onClick={handlePlanType}
              shape="round"
            >
              Monthly
            </Button>
            <Button
              className={`plan-type ${isYearlyPlan && "plan-active"}`}
              onClick={handlePlanType}
              shape="round"
            >
              Yearly
            </Button>
          </Badge>
        </div>
        <br></br>

        <div className="plan-container">
          <StarterPlanBox
            handleClick={(priceId: string) => handleClick(priceId)}
            prices={prices}
            isYearlyPlan={isYearlyPlan}
          />
          <IndividualPlanBox
            handleClick={(priceId: string) => handleClick(priceId)}
            prices={prices}
            isYearlyPlan={isYearlyPlan}
          />
          <BusinessplanBox
            handleClick={(priceId: string) => handleClick(priceId)}
            prices={prices}
            isYearlyPlan={isYearlyPlan}
          />
        </div>
      </div>
    </>
  );
}

export default PricingWrapperNew;
