"use client";
import { Button } from "antd";
import React, { useEffect, useState } from "react";
import "./chatbot.css";
import { MessageOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useCookies } from "react-cookie";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

const antIcon = (
  <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
);

function ChatBot() {
  /// chatbots details state
  const [chatbotData, setChatbotData] = useState([]);
  const [cookies, setCookie] = useCookies(["userId"]);

  /// loading state
  const [loading, setLoading] = useState(false);

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

  return (
    <center>
      <div className="chatbot-container">
        <div className="chatbot-container-title">
          <span className="title-text">My Chatbots</span>
          <Link href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}`}>
            <Button style={{ width: "150px" }} type="primary">
              New Chatbot
            </Button>
          </Link>
        </div>
        <div className="chatbots">
          {chatbotData.map((data: any) => {
            return (
              <div
                className="chatbot"
                key={data.id}
                onClick={() => openChatbot(data.id)}
              >
                <div className="icon">
                  <MessageOutlined />
                </div>
                <div className="name">{data.name}</div>
              </div>
            );
          })}
        </div>
        {!loading && chatbotData.length == 0 && (
          <p style={{ color: "red" }}>
            No chatbots available please create one
          </p>
        )}
        {loading && <Spin indicator={antIcon} />}
      </div>
    </center>
  );
}

export default ChatBot;
