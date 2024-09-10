"use client";

import React, { useState, useEffect, useDebugValue, useContext } from "react";
import axios from "axios";
import "./billing.scss";
import Image from "next/image";
import { useCookies } from "react-cookie";
import { useSession } from "next-auth/react";
// import { redirect } from "next/navigation";
import { getDate } from "@/app/_helpers/client/getTime";
import { Table, Modal, message, TableProps } from "antd";
import { redirect, useRouter } from "next/navigation";
import { UserDetailsContext } from "../../../_helpers/client/Context/UserDetailsContext";
import { formatNumber } from "../../../_helpers/client/formatNumber";
import dynamic from "next/dynamic";
import circle from "../../../../../public/svgs/Ellipse 58.svg";
import downArrow from "../../../../../public/svgs/arrow-down-bold-gray.svg";
import ArrowDownBlack from "../../../../../public/svgs/arrow-down-bold.svg";
import AddOnsDetail from "./_components/AddOnsDetail";
import { TableRowSelection } from "antd/es/table/interface";
import { transformDataSource } from "./utils/transformedDataSource";
import PaymentTable from "./_components/PaymentTable";
import CancelPlanModal from "./_components/CancelPlanModal";

function BillingAndUsage() {
  const [cookies, setCookie] = useCookies(["userId"]);
  const { status } = useSession();
  const [plan, setPlan] = useState("");
  const [msg, setMsg] = useState(0);
  const [chat, setChat] = useState(0);
  const [date, setDate] = useState<any>();
  const [duration, setDuration] = useState("");
  const [disable, setDisable] = useState(false);
  const [buttonDisable, setButtonDisable] = useState(false);
  const [planDetail, setPlanDetail] = useState();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;
  // const [columns, setColumns] = useState([])

  //ANCHOR - API CALL TO CANCEL WHATSAPP INTEGRATION FOR NEXT BILLING CYCLE
  const handleWhatsappOk = async () => {
    if (whatsapp == true) {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api`,
        {
          u_id: cookies.userId,
          x: 1,
        }
      );
      if (response.data.status == true) {
        message.success(response.data.msg);
      } else {
        message.error(response.data.msg);
      }
      setWhatsapp(false);
      setIsWhatsappModalOpen(false);
    }
  };

  //ANCHOR - API CALL TO CANCEL PLAN FOR NEXT BILLING CYCLE
  const handleOk = async () => {
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api/cancel-plan`,
      {
        u_id: cookies.userId,
        x: 2,
      }
    );
    if (response.data.status == true) {
      message.success(response.data.msg);
    } else {
      message.error(response.data.msg);
    }
    setDisable(true);
    setIsModalOpen(false);
    setWhatsapp(false);
    setIsWhatsappModalOpen(false);
  };
  const handleWhatsappCancel = () => {
    setIsWhatsappModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const explorePlan = async () => {
    router.push(`${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing`);
  };

  //ANCHOR - API CALL FOR COLLECTING DATA FROM DATABASE
  const myFunction = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api`,
        {
          u_id: cookies.userId,
        }
      );

      setChat(response?.data?.chatbot);
      setMsg(response?.data?.message);
      setPlan(response?.data?.plan);
      setWhatsapp(response?.data?.whatsappIntegration);
      setPlanDetail(response?.data?.planDetail);
      const newDate = new Date(response?.data?.nextRenewal);
      const options: any = { year: "numeric", month: "short", day: "2-digit" };
      const formattedDate: any = newDate.toLocaleDateString("en-US", options);
      setDate(formattedDate);
      // setDataSource(response?.data?.paymentDetails);
      if (response?.data?.status == "cancel") {
        setDisable(true);
        setButtonDisable(true);
      } else if (response?.data?.status == undefined) {
        setButtonDisable(false);
      } else {
        setButtonDisable(true);
      }

      if (!response?.data?.duration) {
        setDuration("7 days free trial");
      } else if (response?.data?.duration == "month") {
        setDuration("Billed monthly");
      } else {
        setDuration("Billed yearly");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    myFunction();
  }, []);

  if (status === "authenticated" || cookies?.userId) {
    return (
      <>
        <Modal
          title="Are you sure to cancel the plan?"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
          cancelText="Keep"
          okText="Cancel"
          closeIcon={null}
          className="model cancel-modal"
          centered
        >
          {/* <p>Are you sure to cancel your plan?</p> */}
          <CancelPlanModal planDetail={planDetail} date={date} />
        </Modal>
        <Modal
          title="Cancel My Plan"
          open={isWhatsappModalOpen}
          onOk={handleWhatsappOk}
          onCancel={handleWhatsappCancel}
          cancelText="Keep"
          okText="Cancel"
          // closeIcon={null}
          className="modelCancelWhatsapp"
          centered
        >
          <p>Are you sure to cancel Whatsapp integration from next cycle?</p>
        </Modal>
        <div className="billing-main">
          <div className="billing-head">Billing & Usage</div>
          <div className="message-count">
            <div className="message-head"></div>
          </div>
          <div className="plan-head">My Plan</div>
          <div className="plan-details">
            <div className="name-features">
              <div className="plan-name-container">
                <span className="plan-name">{userDetails?.plan?.name}</span>
                {duration != "" && (
                  <div className="plan-duration">
                    <span className="plan-duration-text">Billed Monthly</span>
                  </div>
                )}
              </div>
              <div className="plan-feature">
                <div className="next-renewal-date">
                  <div className="next-renewal-date-text">
                    Auto Renewal due on
                  </div>
                  <div className="next-renewal-date-date">{date}</div>
                </div>
              </div>
              <div className="plan-feature">
                {/* <div className="plan-message">
                  {" "}
                  {formatNumber(
                    userDetails?.plan?.messageLimit
                      ? userDetails?.plan?.messageLimit
                      : 0
                  )}{" "}
                  Messages
                </div> */}
                {/* <Image className="dot-image" src={circle} alt="no image" /> */}
                {/* <div className="plan-chatbot">
                  {userDetails?.plan?.numberOfChatbot} Chatbots
                </div>
                <Image className="dot-image" src={circle} alt="no image" /> */}

                <div className="more-details">
                  <p className="more-details-text">
                    More Details{" "}
                    <span>
                      <Image src={downArrow} alt="down-arrow" />
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="cancel-upgrade-btns">
              <p className="cancel-plan" onClick={() => setIsModalOpen(true)}>
                Cancel My Plan
              </p>
              <button className="btn-upgrade" onClick={explorePlan}>
                <span
                  className="btn-text"
                  onClick={() => router.push("/home/pricing")}
                >
                  Upgrade Plan
                </span>
              </button>
            </div>
          </div>

          <AddOnsDetail />
          <div className="manage-plan">Payment history</div>
        </div>

        <PaymentTable />
      </>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(BillingAndUsage), {
  ssr: false,
});
