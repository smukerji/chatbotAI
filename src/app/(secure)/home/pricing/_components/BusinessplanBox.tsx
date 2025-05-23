import Image from "next/image";
import React from "react";
import tickCircleWhite from "../../../../../../public/svgs/tick-circle-white.svg";
import tickCircleBlue from "../../../../../../public/svgs/tick-circle.svg";

const monthlyStarterPlanId: any = process.env.NEXT_PUBLIC_BUSINESS_PLAN_MONTHLY;
const yearlyStarterPlanId: any = process.env.NEXT_PUBLIC_BUSINESS_PLAN_YEARLY;

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

function BusinessplanBox({
  handleClick,
  prices,
  isYearlyPlan,
  activePlan,
  isNextPlan,
}: any) {
  const { monthlyPrice, yearlyPrice } = findStarterPlanPrice(prices);

  const isPlanActive =
    (activePlan?.id === monthlyStarterPlanId ||
      activePlan?.id === yearlyStarterPlanId) &&
    activePlan?.active;

  const tickCircle = isPlanActive ? tickCircleWhite : tickCircleBlue;

  return (
    <>
      <div className={`plan-box ${isPlanActive && "plan-box-even"}`}>
        <div className="plan-plan plan-row">
          <div className="plan-name-price">
            <span className="plan-name plan-name-even">Business Plan</span>
            <span className="plan-placeholder plan-placeholder-even">
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
              <span className="plan-text plan-text-small">5 Agent</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">{`${
                isYearlyPlan
                  ? "3,00,000 messages/month"
                  : "25,000 messages/month"
              }`}</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                Unlimited website links allowed for training
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                Website/Whatsapp/Telegram integration
              </span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">5M characters</span>
            </div>
            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">Unlimited leads</span>
            </div>

            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                Included 1 year conversation history
              </span>
            </div>

            <div className="plan-item">
              <Image src={tickCircle} alt="no-svg" />
              <span className="plan-text plan-text-small">
                3.5 & 4 & 4o LLM Models
              </span>
            </div>
          </div>
          {isPlanActive && isNextPlan == false ? (
            <button
              className="pay-btn plan1 select-plan-btn"
              disabled={isPlanActive}
              title={isPlanActive ? "Cancelled" : undefined}
            >
              <span className="btn-text">Cancelled</span>
            </button>
          ) : (
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
              <span className="btn-text">
                {isPlanActive ? "Current Plan" : "Get Started"}
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default BusinessplanBox;
