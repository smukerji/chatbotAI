"use client";
import { Button, Modal, Radio, RadioChangeEvent } from "antd";
import { redirect, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import "./dashboard.css";

import DeleteModal from "./_components/Modal/DeleteModal";
import { useCookies } from "react-cookie";
import Home from "../../home/page";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { v4 as uuid } from "uuid";
import Settings from "./_components/Settings/OldSettings";
import { getDate, getTime } from "../../../_helpers/client/getTime";
import Chat from "./_components/Chat/Chat";

function Dashboard() {
  const { status } = useSession();

  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  const [cookies, setCookies] = useCookies(["userId"]);

  /// hadling event of radio buttons
  const [source, setSource] = useState("chatbot");
  const onChange = (e: RadioChangeEvent) => {
    if (e.target.value != "delete") setSource(e.target.value);
  };

  /// messages
  const [messages, setMessages] = useState(
    chatbot.initial_message == null
      ? [{ role: "assistant", content: `Hi! What can I help you with?` }]
      : [{ role: "assistant", content: chatbot.initial_message }]
  );
  const [messagesTime, setMessagesTime] = useState(
    chatbot.initial_message == null
      ? [
          {
            role: "assistant",
            content: `Hi! What can I help you with?`,
            messageTime: getTime(),
          },
        ]
      : [{ role: "assistant" }]
  );

  /// data sources state
  const [qaData, setQaData]: any = useState();
  const [textData, setTextData]: any = useState();
  const [fileData, setFileData]: any = useState();
  const [crawlData, setCrawlData]: any = useState();
  // const [qaCharCount, setQACharCount] = useState(0);

  /// sesstion Id and date for current chat window
  const [sessionID, setSessionID]: any = useState();
  const [sessionStartDate, setSessionStartDate]: any = useState();
  useEffect(() => {
    setSessionID(uuid());
    setSessionStartDate(getDate());
  }, []);

  /// managing delete chatbot
  const [open, setOpen] = useState(false);
  const showModal = () => {
    setOpen(true);
  };

  // useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      /// get chatbot details
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/api`,
        {
          method: "POST",
          body: JSON.stringify({
            chatbotId: chatbot.id,
            userId: cookies.userId,
          }),
          next: { revalidate: 0 },
        }
      );
      const content = await response.json();
      /// set the default state for loading the data in home
      setQaData({
        qaList: content.qaList,
        qaCount: content.qaCount,
        qaCharCount: content.qaCharCount,
      });
      setTextData({
        text: content.text,
        textLength: content.textLength,
      });
      setFileData({
        defaultFileList: content.defaultFileList,
        fileTextLength: content.fileTextLength,
      });
      setCrawlData({
        crawledData: content.crawlData,
        crawledDataLength: content.crawlDataLength,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error retriving chatbot details:", error);
    }
  };

  const [loading, setLoading] = useState(false);
  if (status === "authenticated" || cookies?.userId) {
    return (
      <div className="dashboard-container">
        <center>
          <h1 className="title">{chatbot.name}</h1>
          <Radio.Group onChange={onChange} value={source} disabled={loading}>
            <Radio name="source" value={"chatbot"}>
              Chatbot
            </Radio>
            <Radio name="source" value={"settings"}>
              Settings
            </Radio>
            <Radio name="source" value={"sources"} onClick={fetchData}>
              Sources
            </Radio>
            <Radio name="source" value={"delete"} onClick={showModal}>
              Delete
            </Radio>
          </Radio.Group>

          {/* managing the component rendering */}
          {source == "chatbot" && (
            <>
              <Chat
                chatbot={chatbot}
                messages={messages}
                setMessages={setMessages}
                messagesTime={messagesTime}
                setMessagesTime={setMessagesTime}
                sessionID={sessionID}
                sessionStartDate={sessionStartDate}
              />{" "}
              <DeleteModal
                open={open}
                setOpen={setOpen}
                chatbotId={chatbot.id}
              />
            </>
          )}
          {source == "settings" && (
            <>
              <Settings chatbotId={chatbot.id} />
              <DeleteModal
                open={open}
                setOpen={setOpen}
                chatbotId={chatbot.id}
              />
            </>
          )}
          {source == "sources" && !loading && (
            <>
              <Home
                updateChatbot="true"
                qaData={qaData}
                textData={textData}
                fileData={fileData}
                crawlingData={crawlData}
                chatbotId={chatbot.id}
                chatbotName={chatbot.name}
              />
              <DeleteModal
                open={open}
                setOpen={setOpen}
                chatbotId={chatbot.id}
              />
            </>
          )}
        </center>
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  }
}

export default dynamic((): any => Promise.resolve(Dashboard), { ssr: false });
