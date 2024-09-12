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
import PricingAddons from "./PricingAddons";
import img1 from "../../../../../../public/pricingImages/image 47.svg";
import img2 from "../../../../../../public/pricingImages/image 52.svg";
import img3 from "../../../../../../public/pricingImages/messages-3.svg";
import img4 from "../../../../../../public/pricingImages/voice-cricle.svg";
import Image from "next/image";
import SecondaryHeader from "@/app/_components/Secondary-Header/SecondaryHeader";

const msgSmall: any = process.env.NEXT_PUBLIC_MESSAGESMALL_PLAN_ID;
const msgLarge: any = process.env.NEXT_PUBLIC_MESSAGELARGE_PLAN_ID;
const onBoarding: any = process.env.NEXT_PUBLIC_ONBOARDING_FEES;
const trainingData: any = process.env.NEXT_PUBLIC_TRAINING_DATA_MONTHLY;

function PricingWrapperNew() {
  const [loading, setLoading] = useState(false);
  const [cookies, setCookie] = useCookies(["userId"]);
  const [isYearlyPlan, setIsYearlyPlan] = useState(false);
  const [prices, setPrices] = useState([]);
  const router = useRouter();
  const [activePlan, setActivePlan] = useState();
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
    if (cookies?.userId) {
      const a = encryptPriceId(priceId);
      const encryptedPriceId = encodeURIComponent(a);

      router.push(
        `/home/pricing/plan-checkout?priceId=${encryptedPriceId}&type=recurring`
      );
    } else {
      router.push("/account/login");
    }
  }

  async function handleAddonClick(priceId: string) {
    if (cookies?.userId) {
      const a = encryptPriceId(priceId);
      const encryptedPriceId = encodeURIComponent(a);

      let type;

      if (
        priceId === msgSmall ||
        priceId === msgLarge ||
        priceId === onBoarding ||
        priceId === trainingData
      ) {
        type = "oneoff";
      } else {
        type = "recurring";
      }

      router.push(
        `/home/pricing/plan-checkout?priceId=${encryptedPriceId}&source=addon&type=${type}`
      );
    } else {
      router.push("/account/login");
    }
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

      setActivePlan(checkPlan?.data?.price);
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

  // console.log("prices", prices);

  return (
    <>
      {status === "unauthenticated" && !u_id && <SecondaryHeader />}
      {loading && <Loader />}
      <div className="main new-main">
        <Image className="img1" src={img1} alt="img1" />
        <Image className="img2" src={img2} alt="img2" />
        <Image className="img3" src={img3} alt="img3" />
        <Image className="img4" src={img4} alt="img4" />
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
            activePlan={activePlan}
          />
          <IndividualPlanBox
            handleClick={(priceId: string) => handleClick(priceId)}
            prices={prices}
            isYearlyPlan={isYearlyPlan}
            activePlan={activePlan}
          />
          <BusinessplanBox
            handleClick={(priceId: string) => handleClick(priceId)}
            prices={prices}
            isYearlyPlan={isYearlyPlan}
            activePlan={activePlan}
          />
        </div>

        <PricingAddons
          pricing={prices}
          isYearlyPlan={isYearlyPlan}
          handleAddonClick={(priceId: string) => handleAddonClick(priceId)}
        />
      </div>
    </>
  );
}

export default PricingWrapperNew;
