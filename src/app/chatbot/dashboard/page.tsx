"use client";
import { Button, Modal, Radio, RadioChangeEvent } from "antd";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import "./dashboard.css";
import Chat from "./components/Chat/Chat";
import DeleteModal from "./components/Modal/DeleteModal";

function Dashboard() {
  /// fetch the params
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  /// hadling event of radio buttons
  const [source, setSource] = useState("chatbot");
  const onChange = (e: RadioChangeEvent) => {
    if (e.target.value != "delete") setSource(e.target.value);
  };

  /// managing delete chatbot
  const [open, setOpen] = useState(false);
  const showModal = () => {
    setOpen(true);
  };

  const [loading, setLoading] = useState(false);
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
          <Radio name="source" value={"sources"}>
            Sources
          </Radio>
          <Radio name="source" value={"delete"} onClick={showModal}>
            Delete
          </Radio>
        </Radio.Group>

        {/* managing the component rendering */}
        {source == "chatbot" && (
          <>
            <Chat chatbot={chatbot} />{" "}
            <DeleteModal open={open} setOpen={setOpen} chatbotId={chatbot.id} />
          </>
        )}
        {source == "settings" && (
          <>
            <h1>Settings</h1>
            <DeleteModal open={open} setOpen={setOpen} chatbotId={chatbot.id} />
          </>
        )}
        {source == "sources" && (
          <>
            <h1>Settings</h1>
            <DeleteModal open={open} setOpen={setOpen} chatbotId={chatbot.id} />
          </>
        )}
      </center>
    </div>
  );
}

export default Dashboard;
