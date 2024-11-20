import { Modal } from "antd";
import React, { useEffect, useState } from "react";
import TickCircle from "../../../../../../public/svgs/tick-circle-fill.svg";
import { useRouter } from "next/navigation";
import Image from "next/image";

function formatDate(timestamp: number) {
  const timestampMS = timestamp * 1000; // Convert Unix timestamp to milliseconds

  // Create a Date object
  const date = new Date(timestampMS);

  const options: any = { year: "numeric", month: "short", day: "2-digit" };
  const formattedDate: any = date.toLocaleDateString("en-US", options);

  return formattedDate;
}

function PaymentSucessmodal({
  isModalOpen,
  subscriptionDetail,
  firstPurchase,
}: any) {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isModalOpen) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(interval); // Clear interval when countdown reaches 1
            if (firstPurchase == "true") {
              router.push("/voicebot"); // Redirect to homepage or another route
            } else {
              window.location.href = "/chatbot";
            }
          }
          return prev - 1; // Decrease countdown by 1
        });
      }, 1000); // Run every 1 second
    }

    return () => {
      if (interval) {
        clearInterval(interval); // Cleanup the interval when the component unmounts or modal closes
      }
    };
  }, [isModalOpen, router]);

  return (
    <>
      <Modal
        title=""
        open={isModalOpen}
        // onOk={handleOk}
        // onCancel={handleCancel}
        footer=""
        closeIcon={null}
        className="model thank-you-modal"
        centered
      >
        <span className="blue-tick">
          <Image src={TickCircle} alt="blue-tick" />
        </span>
        <div className="thank-you-msg">
          <p className="title">Thank for your payment</p>

          <p className="description">Your order was completed successfully</p>
        </div>

        <div className="invoice-detail">
          <p className="title">Invoice</p>
          <p className="value">
            {subscriptionDetail?.invoice ?? "Invoice#0098 - Sep 2024"}
          </p>
        </div>

        <div className="order-date">
          <p className="title">Order date</p>
          <p className="value">{formatDate(subscriptionDetail?.createDate)}</p>
        </div>

        <div className="redirection">
          <p>Redirecting to homepage in {countdown} seconds</p>
        </div>
      </Modal>
    </>
  );
}

export default PaymentSucessmodal;
