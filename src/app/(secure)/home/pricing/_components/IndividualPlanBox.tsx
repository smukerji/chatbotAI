import Image from "next/image";
import React from "react";
import tickCircle from "../../../../../../public/svgs/tick-circle.svg";

const monthlyStarterPlanId: any =
  process.env.NEXT_PUBLIC_INDIVIDUAL_PLAN_MONTHLY;
const yearlyStarterPlanId: any = process.env.NEXT_PUBLIC_INDIVIDUAL_PLAN_YEARLY;

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

function IndividualPlanBox({
  handleClick,
  prices,
  isYearlyPlan,
  activePlan,
}: any) {
  const { monthlyPrice, yearlyPrice } = findStarterPlanPrice(prices);

  const isPlanActive =
    (activePlan?.id === monthlyStarterPlanId ||
      activePlan?.id === yearlyStarterPlanId) &&
    activePlan?.active;

  return (
    <>
      <div className="plan-box">
        <div className="plan-plan plan-row">
          <div className="plan-name-price">
            <span className="plan-name">Individual Plan</span>
            <span className="plan-placeholder">
              For small and medium businesses
            </span>
          </div>
          <div className="plan-price-container">
            <div className="plan-price-frame">
              <span className="price-sign">$</span>
              <span className="price-number">
                {isYearlyPlan ? yearlyPrice : monthlyPrice}
              </span>
            </div>
          </div>
        </div>
        <div className="plan-container-list">
          <div className="plan-details plan-details-new">
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">1 Agent</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">{`${
                isYearlyPlan ? "24,000 messages/month" : "2000 messages/month"
              }`}</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                10 website links allowed for training
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                Website integration
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">1M characters</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                {`${
                  isYearlyPlan
                    ? "Most recent 500 leads"
                    : "Most recent 100 leads"
                }`}
              </span>
            </div>

            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                30 days conversation history
                {`${
                  isYearlyPlan
                    ? "Included 1 year conversation history"
                    : "30 days conversation history"
                }`}
              </span>
            </div>

            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                3.5 & 4 & 4o LLM Models
              </span>
            </div>
          </div>

          <button
            className="pay-btn select-plan-btn"
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

export default IndividualPlanBox;
