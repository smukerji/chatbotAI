"use client";

import React, { useState, useEffect, useDebugValue, useContext } from "react";
import axios from "axios";
import "./billing.scss";
import Image from "next/image";
import { useCookies } from "react-cookie";
import { useSession } from "next-auth/react";
// import { redirect } from "next/navigation";
import { getDate } from "@/app/_helpers/client/getTime";
import {
  Table,
  Modal,
  message,
  TableProps,
  Button,
  Tabs,
  TabsProps,
} from "antd";
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
import Loader from "../pricing/_components/Loader";
import LimitReachedModal from "../../chatbot/dashboard/_components/Modal/LimitReachedModal";
import VoicebotUsage from "./_components/VoicebotUsage";
import VoicebotPaymentHistory from "./_components/VoicebotPaymentHistory";

function BillingAndUsage() {
  const [cookies, setCookie] = useCookies(["userId"]);
  const { status } = useSession();
  const [date, setDate] = useState<any>();
  const [planDetail, setPlanDetail] = useState<any>();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>();
  const [isPlanNotification, setIsPlanNotification] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("1");

  // const [columns, setColumns] = useState([])

  // tabs items
  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Chatbot",
    },
    {
      key: "2",
      label: "Voicebot",
    },
  ];

  const onChageTab = (key: string) => {
    setActiveTab(key);
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
      myFunction();
      message.success(response.data.msg);
    } else {
      message.error(response.data.msg);
    }
    // setDisable(true);
    setIsModalOpen(false);
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
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api`,
        {
          u_id: cookies.userId,
        }
      );

      setPlanDetail(response?.data?.planDetail);
      setPlan(response.data);

      const newDate = new Date(response?.data?.nextRenewal);
      const options: any = { year: "numeric", month: "short", day: "2-digit" };
      const formattedDate: any = newDate.toLocaleDateString("en-US", options);

      setDate(formattedDate);

      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const getUser = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/user?userId=${cookies.userId}`
    );

    setUser(response.data.user);
  };

  const handleUpgradePlan = () => {
    setIsPlanNotification(false);
    router.push("/home/pricing");
  };

  useEffect(() => {
    getUser();
    myFunction();
  }, []);

  useEffect(() => {
    if (user) {
      const planId = user?.planId;

      if (!planId) {
        setIsPlanNotification(true);
      }
    }
  }, [user]);

  if (status === "authenticated" || cookies?.userId) {
    return (
      <>
        {loading ? (
          <Loader />
        ) : (
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
              title="Upgrade Now to create new Chatbots!"
              open={isPlanNotification}
              onCancel={() => {}}
              footer={[
                <Button key="submit" type="primary" onClick={handleUpgradePlan}>
                  Upgrade Now
                </Button>,
              ]}
              closable={false}
              centered
              className="subscription-expire-popup"
              width={800}
            >
              <p>Upgrade now to access your chatbots!</p>
            </Modal>

            <div className="billing-main">
              <div className="billing-head">
                <p>Billing & Usage</p>
                <Tabs
                  defaultActiveKey="1"
                  items={items}
                  onChange={onChageTab}
                />
              </div>

              {/* <div className="message-count">
                <div className="message-head"></div>
              </div> */}
              {activeTab === "1" && (
                <>
                  <div className="plan-head">My Plan</div>
                  <div className="plan-details">
                    <div className="name-features">
                      <div className="plan-name-container">
                        <span className="plan-name">
                          {planDetail?.name ? planDetail.name : "No Plan Found"}
                        </span>
                        {plan.duration && plan.duration != "" && (
                          <div className="plan-duration">
                            <span className="plan-duration-text">
                              Billed{" "}
                              {plan?.duration === "month"
                                ? "Monthly"
                                : "Yearly"}
                            </span>
                          </div>
                        )}
                      </div>
                      {date !== "Invalid Date" && (
                        <div className="plan-feature">
                          <div className="next-renewal-date">
                            <div className="next-renewal-date-text">
                              {plan?.isNextPlan === false
                                ? "Expires on"
                                : "Auto Renewal due on"}
                            </div>
                            <div className="next-renewal-date-date">{date}</div>
                          </div>
                        </div>
                      )}
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

                        {/* <div className="more-details">
                      <p className="more-details-text">
                        More Details{" "}
                        <span>
                          <Image src={downArrow} alt="down-arrow" />
                        </span>
                      </p>
                    </div> */}
                      </div>
                    </div>

                    <div className="cancel-upgrade-btns">
                      {plan?.isNextPlan === false ? (
                        <p className="cancel-plan">Cancelled</p>
                      ) : (
                        <p
                          className="cancel-plan"
                          onClick={() => setIsModalOpen(true)}
                        >
                          Cancel My Plan
                        </p>
                      )}

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

                  <AddOnsDetail
                    date={date}
                    isNextPlan={plan?.isNextPlan}
                    planName={plan?.plan}
                  />
                  <div className="manage-plan">Payment history</div>
                  <PaymentTable />
                </>
              )}

              {activeTab === "2" && (
                <>
                  <VoicebotUsage />
                  <div className="manage-plan">Payment history</div>
                  <VoicebotPaymentHistory />
                </>
              )}
            </div>
          </>
        )}
      </>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(BillingAndUsage), {
  ssr: false,
});
