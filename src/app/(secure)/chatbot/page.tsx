"use client";
import {
  LoadingOutlined,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Modal, Spin, message, Button } from "antd";
import React, { Suspense, useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./chatbot.scss";
import Image from "next/image";
import noChatbotBg from "../../../../public/sections-images/common/no-chatbot-icon.svg";
// import gridIcon from "../../../../public/svgs/grid-icon.svg";
import GridLayout from "./_components/GridLayout";
import TableLayout from "./_components/TableLayout";
import DeleteModal from "./dashboard/_components/Modal/DeleteModal";
import ShareModal from "./dashboard/_components/Modal/ShareModal";
import { redirect, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import RenameModal from "./dashboard/_components/Modal/RenameModal";
import Icon from "../../_components/Icon/Icon";
import GridIcon from "../../../assets/svg/GridIcon";
import MenuIcon from "../../../assets/svg/MenuIcon";
import NewChatbotNameModal from "./dashboard/_components/Modal/NewChatbotNameModal";
import LimitReachedModal from "./dashboard/_components/Modal/LimitReachedModal";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import { UserDetailsContext } from "../../_helpers/client/Context/UserDetailsContext";
import { JWT_EXPIRED } from "../../_helpers/errorConstants";
import axios from "axios";
// import GridIcon from "../../as";

const antIcon = (
  <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
);

function Chatbot() {
  const { status } = useSession();
  const router = useRouter();

  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  /// state to store user plan
  // const [userDetails, setUserDetails]: any = useState({});

  //manage limit model
  const [openLimitModal, setOpenLimitModel] = useState(false);

  /// chatbots details state
  const [chatbotData, setChatbotData] = useState([]);
  const [cookies, setCookie] = useCookies(["userId"]);

  /// loading state
  const [loading, setLoading] = useState(false);

  /// state for showing the chabot list
  const [listType, setListType]: any = useState("grid");

  const [chatbotId, setChatbotId] = useState("");

  /// managing share chatbot
  const [openShareModal, setOpenShareModal] = useState(false);

  /// state for opening menu for the chabot list
  const [openMenu, setOpenMenu]: any = useState(null);
  const changeMenu = (value: any) => {
    setOpenMenu(value);
  };

  const [changeFlag, setChangeFlag] = useState(false);

  /// managing delete chatbot
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  /// managing renaming chatbot
  const [openRenameModal, setOpenRenameModal] = useState(false);

  /// managing new chatbot name modal
  const [openNewChatbotNameModal, setOpenNewChatbotNameModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isPlanNotification, setIsPlanNotification] = useState(false);

  // const showModal = async () => {
  //   const checkPlan = await axios.put(
  //     `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway`,
  //     { u_id: cookies.userId }
  //   );
  //   if (checkPlan.data.msg == 0) {
  //     // setIsModalOpen(true);
  //     window.location.href = 'http://localhost:3000/chatbot'
  //   }
  //   // setIsModalOpen(true);
  // };

  const getUser = async () => {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/user?userId=${cookies.userId}`
    );

    setUser(response.data.user);
  };

  const handleCancel = () => {
    // router.push("home/pricing");
    // setIsModalOpen(false);
  };

  /// retrive the chatbots details
  useEffect(() => {
    getUser();
    const fetchData = async () => {
      try {
        setLoading(true);
        /// get chatbot details
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api`,
          {
            method: "POST",
            body: JSON.stringify({ userId: cookies.userId }),
            next: { revalidate: 0 },
          }
        );
        const data = await response.json();

        /// check if session is expired
        if (data.message == JWT_EXPIRED) {
          window.location.href = "/account/login";
        }

        /// get the user and plan details
        const userDetailsresponse = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details?userId=${cookies?.userId}`,
          {
            method: "GET",
            next: { revalidate: 0 },
          }
        );
        const userDetails = await userDetailsresponse.json();
        userDetailContext?.handleChange("noOfChatbotsUserCreated")(
          userDetails?.noOfChatbotsUserCreated
        );

        // botContext?.handleChange("plan")(userDetails?.plan);

        // setUserDetails(userDetails);
        setChatbotData(data.chatbots);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching chatbot data:", error);
      }
    };

    fetchData();
  }, [changeFlag]);

  useEffect(() => {
    const planEndTimer = setInterval(() => {
      if (user) {
        const planEndDate = new Date(user?.endDate);

        if (new Date() > planEndDate) {
          setIsPlanNotification(true);
        }
      }
    }, 1000);

    return () => clearInterval(planEndTimer);
  }, [user]);

  const handleUpgradePlan = () => {
    setIsPlanNotification(false);
    router.push("/home/pricing");
  };

  /// view chatbot
  function openChatbot(id: any) {
    /// send the user to dashboard page
    router.push(
      `${
        process.env.NEXT_PUBLIC_WEBSITE_URL
      }chatbot/dashboard?${encodeURIComponent("chatbot")}=${encodeURIComponent(
        JSON.stringify(
          chatbotData.filter((data: any) => {
            return data.id == id;
          })[0]
        )
      )}&editChatbotSource=${isPlanNotification ? "history" : "chatbot"}`
    );
    // window.location.href = `${
    //   process.env.NEXT_PUBLIC_WEBSITE_URL
    // }chatbot/dashboard?${encodeURIComponent("chatbot")}=${encodeURIComponent(
    //   JSON.stringify(
    //     chatbotData.filter((data: any) => {
    //       return data.id == id;
    //     })[0]
    //   )
    // )}`;
  }

  if (status === "authenticated" || cookies?.userId) {
    return (
      <div
        className="chatbot-list-container"
        onClick={() => openMenu && setOpenMenu(null)}
      >
        {/*------------------------------------------title----------------------------------------------*/}
        <div className="title-container">
          <h1 className="title">My Chatbots</h1>
          <div className="action-container">
            <div className="chatbot-list-action">
              <Icon
                className={listType == "grid" ? "active" : ""}
                Icon={GridIcon}
                click={() => setListType("grid")}
              />
              <Icon
                className={listType == "table" ? "active" : ""}
                Icon={MenuIcon}
                click={() => setListType("table")}
              />
              {/* <Image
                className={listType == "grid" ? "active" : ""}
                src={gridIcon}
                alt="grid-icon"
                onClick={() => setListType("grid")}
              />
              <Image
                className={listType == "table" ? "active" : ""}
                src={menuIcon}
                alt="menu-icon"
                onClick={() => setListType("table")}
              /> */}
            </div>
            {/* <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}home`}> */}
            <button
              onClick={() => {
                // showModal()
                /// check if user has exceeded the number of creation of bots
                if (
                  userDetails?.noOfChatbotsUserCreated + 1 >
                  userDetails?.plan?.numberOfChatbot
                ) {
                  setOpenLimitModel(true);
                  return;
                }

                setOpenNewChatbotNameModal(true);
              }}
              disabled={
                loading || (user && new Date(user?.endDate) < new Date())
              }
            >
              New Chatbot
            </button>
            {/* </Link> */}
          </div>
          {openLimitModal ? (
            <LimitReachedModal setOpenLimitModel={setOpenLimitModel} />
          ) : (
            <></>
          )}
        </div>

        {/*------------------------------------------chatbot-list-grid----------------------------------------------*/}
        {listType === "grid" && (
          <>
            <GridLayout
              chatbotData={chatbotData}
              changeMenu={changeMenu}
              openMenu={openMenu}
              openChatbot={openChatbot}
              setOpenShareModal={setOpenShareModal}
              chatbotId={chatbotId}
              setChatbotId={setChatbotId}
              setOpenDeleteModal={setOpenDeleteModal}
              setOpenRenameModal={setOpenRenameModal}
              // disabled={user && new Date(user?.endDate) < new Date()}
            />
          </>
        )}

        {/*------------------------------------------chatbot-list-table----------------------------------------------*/}
        {listType === "table" && (
          <TableLayout
            chatbotData={chatbotData}
            changeMenu={changeMenu}
            openMenu={openMenu}
            openChatbot={openChatbot}
            setOpenShareModal={setOpenShareModal}
            chatbotId={chatbotId}
            setChatbotId={setChatbotId}
            setOpenDeleteModal={setOpenDeleteModal}
            setOpenRenameModal={setOpenRenameModal}
            // disabled={user && new Date(user?.endDate) < new Date()}
          />
        )}
        <DeleteModal
          open={openDeleteModal}
          setOpen={setOpenDeleteModal}
          chatbotId={chatbotId}
          setChangeFlag={setChangeFlag}
          changeFlag={changeFlag}
        />
        <ShareModal
          open={openShareModal}
          setOpen={setOpenShareModal}
          chatbotId={chatbotId}
        />
        <RenameModal
          open={openRenameModal}
          setOpen={setOpenRenameModal}
          chatbotId={chatbotId}
          setChangeFlag={setChangeFlag}
          changeFlag={changeFlag}
        />

        <NewChatbotNameModal
          open={openNewChatbotNameModal}
          setOpen={setOpenNewChatbotNameModal}
          chatbotId={chatbotId}
        />

        {/*------------------------------------------loading/no-chatbots----------------------------------------------*/}
        {!loading && chatbotData?.length == 0 && (
          <div className="no-chatbots-container">
            <Image src={noChatbotBg} alt="no-chatbot-bg" />
            <p>
              You haven&apos;t created any Chatbots. Go ahead and create a New
              Chatbot!
            </p>
          </div>
        )}
        {loading && <Spin indicator={antIcon} />}

        {!loading && chatbotData?.length == 0 && (
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
        )}
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(Chatbot), { ssr: false });
