import Image from "next/image";
import React from "react";
import CloseIcon from "../../../../../../public/svgs/close-circle-red.svg";
import moment from "moment";

function CancelPlanModal({ planDetail, date }: any) {
  const formattedDate = moment(date, "MMM DD, YYYY").format("DD/MM/YYYY");
  return (
    <>
      <p className="description">
        If you cancel, your plan will be expired on {formattedDate} at 0.00am.
        You will lose:
      </p>

      <div className="features">
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.numberOfChatbot}{" "}
          {planDetail?.numberOfChatbot > 1 ? "Chatbots" : "Chatbot"}
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.messageLimit} messages/month
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.websiteCrawlingLimit} website links allowed for training
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          Website integration
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.trainingDataLimit} characters
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.leads} Leads
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.conversationHistory} days conversation history
        </p>
        <p className="feature-item">
          <span>
            <Image src={CloseIcon} alt="close-icon" />
          </span>
          {planDetail?.models} LLM Models
        </p>
      </div>
    </>
  );
}

export default CancelPlanModal;
