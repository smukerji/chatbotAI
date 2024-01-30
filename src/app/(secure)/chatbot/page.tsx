"use client";
import {
  LoadingOutlined,
  MessageOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { Spin } from "antd";
import React, { Suspense, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./chatbot.scss";
import Image from "next/image";
import chatbotBg from "../../../../public/sections-images/common/chatbot-bg-img.svg";
import chatbotOpenIcon from "../../../../public/sections-images/common/chatbot-open-icon.svg";
import chatbotMenuIcon from "../../../../public/sections-images/common/chatbot-menu-icon.svg";
import shareIcon from "../../../../public/sections-images/common/share.svg";
import duplicateIcon from "../../../../public/sections-images/common/document-copy.svg";
import renameIcon from "../../../../public/sections-images/common/edit.svg";
import deleteIcon from "../../../../public/sections-images/common/trash.svg";
import noChatbotBg from "../../../../public/sections-images/common/no-chatbot-icon.svg";
import menuIcon from "../../../../public/svgs/menu-icon.svg";
// import gridIcon from "../../../../public/svgs/grid-icon.svg";
import GridLayout from "./_components/GridLayout";
import TableLayout from "./_components/TableLayout";
import DeleteModal from "./dashboard/_components/Modal/DeleteModal";
import ShareModal from "./dashboard/_components/Modal/ShareModal";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import RenameModal from "./dashboard/_components/Modal/RenameModal";
import Icon from "../../_components/Icon/Icon";
import GridIcon from "../../../assets/svg/GridIcon";
import MenuIcon from "../../../assets/svg/MenuIcon";
import NewChatbotNameModal from "./dashboard/_components/Modal/NewChatbotNameModal";
// import GridIcon from "../../as";

const antIcon = (
  <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
);

function Chatbot() {
  const { status } = useSession();

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

  /// retrive the chatbots details
  useEffect(() => {
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
        setChatbotData(data.chatbots);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error("Error fetching chatbot data:", error);
      }
    };

    fetchData();
  }, [changeFlag]);

  /// view chatbot
  function openChatbot(id: any) {
    /// send the user to dashboard page
    window.location.href = `${
      process.env.NEXT_PUBLIC_WEBSITE_URL
    }chatbot/dashboard?${encodeURIComponent("chatbot")}=${encodeURIComponent(
      JSON.stringify(
        chatbotData.filter((data: any) => {
          return data.id == id;
        })[0]
      )
    )}`;
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
            <button onClick={() => setOpenNewChatbotNameModal(true)}>
              New Chatbot
            </button>
            {/* </Link> */}
          </div>
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
          />
        )}
        <DeleteModal
          open={openDeleteModal}
          setOpen={setOpenDeleteModal}
          chatbotId={chatbotId}
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
              You haven&apos;t created any Chatbots. Go ahead and create New
            </p>
          </div>
        )}
        {loading && <Spin indicator={antIcon} />}
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(Chatbot), { ssr: false });
