"use client";
import { Button } from "antd";
import React, { useEffect, useState } from "react";
import "./chatbot.css";
import { MessageOutlined, MoreOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useCookies } from "react-cookie";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import DeleteModal from "./dashboard/_components/Modal/DeleteModal";
import ShareModal from "./dashboard/_components/Modal/ShareModal";

const antIcon = (
  <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
);

function ChatBot() {
  const { status } = useSession();

  /// chatbots details state
  const [chatbotData, setChatbotData] = useState([]);
  const [cookies, setCookie] = useCookies(["userId"]);

  /// sate for opening menu for the chabot list
  const [openMenu, setOpenMenu]: any = useState({});

  /// loading state
  const [loading, setLoading] = useState(false);

  /// managing delete chatbot
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const showDeleteModal = () => {
    setOpenDeleteModal(true);
  };
  const [chatbotId, setChatbotId] = useState("");

  /// managing share chatbot
  const [openShareModal, setOpenShareModal] = useState(false);
  const showShareModal = () => {
    setOpenShareModal(true);
  };

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
  }, []);

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
      <center>
        <div className="chatbot-container">
          <div className="chatbot-container-title">
            <span className="title-text">My Chatbots</span>
            <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}home`}>
              <Button style={{ width: "150px" }} type="primary">
                New Chatbot
              </Button>
            </Link>
          </div>
          <div className="chatbots">
            {chatbotData?.map((data: any, index: number) => {
              return (
                <div
                  className="chatbot"
                  key={data.id}
                  // onClick={() => openChatbot(data.id)}
                >
                  <div className="icon" onClick={() => openChatbot(data.id)}>
                    <MessageOutlined />
                  </div>
                  <div className="name" onClick={() => openChatbot(data.id)}>
                    {data.name}
                  </div>
                  <MoreOutlined
                    onClick={() => {
                      setOpenMenu({ [index]: !openMenu[index] });
                      setChatbotId(data.id);
                    }}
                  />
                  {/* opening the menue for chatbot actions */}
                  {openMenu[index] ? (
                    <div className={`menu ${openMenu[index] && "active"}`}>
                      <ul>
                        <li>Duplicate</li>
                        <li onClick={showShareModal}>Share</li>
                        <li onClick={showDeleteModal}>Delete</li>
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
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
          {!loading && chatbotData?.length == 0 && (
            <p style={{ color: "red" }}>
              No chatbots available please create one
            </p>
          )}
          {loading && <Spin indicator={antIcon} />}
        </div>
      </center>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(ChatBot), { ssr: false });
