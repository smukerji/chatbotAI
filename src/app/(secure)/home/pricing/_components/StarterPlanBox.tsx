import Image from "next/image";
import React from "react";
import tickCircle from "../../../../../../public/svgs/tick-circle-white.svg";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";

const monthlyStarterPlanId: any = process.env.NEXT_PUBLIC_STARTER_PLAN_MONTHLY;
const yearlyStarterPlanId: any = process.env.NEXT_PUBLIC_STARTER_PLAN_YEARLY;

// Function to find the correct price based on the ID and interval
function findStarterPlanPrice(prices: any) {
  let monthlyPrice = null;
  let yearlyPrice = null;

  prices.forEach((price: any) => {
    if (price.priceId === monthlyStarterPlanId && price.interval === "month") {
      monthlyPrice = price.unit_amount / 100;
    }
    if (price.priceId === yearlyStarterPlanId && price.interval === "year") {
      yearlyPrice = price.unit_amount / 100;
    }
  });

  return { monthlyPrice, yearlyPrice };
}

function StarterPlanBox({
  handleClick,
  prices,
  isYearlyPlan,
  activePlan,
}: any) {
  // Get the filtered prices
  const { monthlyPrice, yearlyPrice } = findStarterPlanPrice(prices);

  const isPlanActive =
    (activePlan?.id === monthlyStarterPlanId ||
      activePlan?.id === yearlyStarterPlanId) &&
    activePlan?.active;

  console.log("active plannnn", activePlan, isPlanActive);

  return (
    <>
      <div className="plan-box plan-box-even">
        <div className="plan-plan plan-row">
          <div className="plan-name-price">
            <span className="plan-name plan-name-even">Starter Plan</span>
            <span className="plan-placeholder plan-placeholder-even">
              <span className="free-trial">For startups or personal use</span>
            </span>
          </div>
          <div className="plan-price-container">
            <div className="plan-price-frame">
              <span className="price-sign price-sign-even">$</span>
              <span className="price-number price-number-even">
                {isYearlyPlan ? yearlyPrice : monthlyPrice}
              </span>
            </div>
          </div>
        </div>
        <div className="plan-container-list">
          {/* <Tooltip
          placement='bottom'
          title={enableOne ? 'Already have plan' : 'undefined'}
        > */}

          {/* </Tooltip> */}
          <div className="plan-details plan-details-new">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                1 Agent
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">{`${
                isYearlyPlan ? "6000 messages/month" : "500 messages/month"
              }`}</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                5 website links allowed for training
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                Website integration
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                30,000 characters allowed for training
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                {`${
                  isYearlyPlan ? "Most recent 50 leads" : "Most recent 10 leads"
                }`}
              </span>
            </div>

            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                {`${
                  isYearlyPlan
                    ? "3 months conversation history"
                    : "2 days conversation history"
                }`}
              </span>
            </div>

            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small  plan-text-even">
                3.5 & 4o LLM Models
              </span>
            </div>
          </div>

          <button
            className="pay-btn plan1 select-plan-btn"
            // onClick={changePlan}
            onClick={() =>
              handleClick(
                isYearlyPlan ? yearlyStarterPlanId : monthlyStarterPlanId
              )
            }
            disabled={isPlanActive}
            title={isPlanActive ? "Active Plan" : undefined}
          >
            <span className="btn-text">Get Started</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default StarterPlanBox;
