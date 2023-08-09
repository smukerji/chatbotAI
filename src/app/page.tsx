"use client";
import { Button, Layout, Radio, RadioChangeEvent, message } from "antd";
import "./app.css";
import { useState } from "react";
import Website from "./components/Website/Website";

export default function Home() {
  /// hadling event of radio buttons
  const [source, setSource] = useState("document");
  const onChange = (e: RadioChangeEvent) => {
    setSource(e.target.value);
  };

  /// loading state
  const [loading, setLoading] = useState(false);

  /// total characters count
  const [charCount, setCharCount] = useState(0);
  function updateCharCount(count: number) {
    setCharCount(count);
  }

  /// crawledLinks
  const [crawledList, setCrawledList] = useState([]);

  const [messageApi, contextHolder] = message.useMessage();

  /// create the chatbot
  async function createChatbot() {
    if (crawledList.length != 0) {
      let headers = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
        "Content-Type": "application/json",
        cache: "no-store",
      };
      /// filtering the crawledUrls
      let crawledUrls = crawledList.map((item: any) => item.url);
      /// setting chatbot name
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const dateString = `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;

      let chatbotName = `Chatbot ${dateString}`;

      /// creating bot through urls
      const options = {
        method: "POST",
        headers,
        body: JSON.stringify({
          chatbotName: chatbotName,
          urlsToScrape: crawledUrls,
        }),
      };

      console.log(options);

      try {
        messageApi.open({
          type: "info",
          content: "Please wait while your chatbot is getting trained",
        });
        const res = await fetch(
          "https://www.chatbase.co/api/v1/create-chatbot",
          options
        );
        const data = await res.json();
        console.log(data);

        messageApi
          .open({
            type: "success",
            content: "Chabot trained successfully",
          })
          .then(() => {
            window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`;
          });
      } catch (error) {
        console.log("Error while creating chatbot", error);

        messageApi.open({
          type: "error",
          content: "Error while creating chatbot",
        });
      }
    } else {
      messageApi.open({
        type: "error",
        content: "No links found to create chatbot",
      });
    }
  }

  return (
    <>
      {contextHolder}

      <div className="data-source-container">
        <center>
          <p className="title">Data Sources</p>
          <Radio.Group onChange={onChange} value={source} disabled={loading}>
            <Radio name="source" value={"document"}>
              Document
            </Radio>
            <Radio name="source" value={"website"}>
              Website
            </Radio>
          </Radio.Group>
          {source == "document" && <h1>Document</h1>}
          {source == "website" && (
            <Website
              updateCharCount={updateCharCount}
              getCharCount={charCount}
              setLoadingPage={setLoading}
              setCrawledList={setCrawledList}
              crawledList={crawledList}
            />
          )}
          <div className="included-source">
            <span
              style={{
                fontSize: "20px",
                fontFamily: "sans-serif",
                marginBottom: "10px",
              }}
            >
              Included Sources:
            </span>
            {/* <p>1 File (1,076 chars) | 126 Links (360,488 detected chars)</p> */}
            {crawledList.length > 0 && (
              <p>
                {crawledList.length} Links ({charCount} detected chars)
              </p>
            )}
            <span
              style={{
                fontSize: "15px",
                fontFamily: "sans-serif",
                marginTop: "20px",
                marginBottom: "10px",
              }}
            >
              Total detected characters:{" "}
              <span
                style={{
                  fontSize: "15px",
                  fontFamily: "sans-serif",
                  fontWeight: "bold",
                }}
              >
                {charCount}
              </span>{" "}
              <span
                style={{
                  color: "#a39999",
                }}
              >
                / 11,000,000 limit
              </span>
            </span>
            <Button
              style={{ width: "400px" }}
              type="primary"
              disabled={loading}
              onClick={createChatbot}
            >
              Create Chatbot
            </Button>
          </div>
        </center>
      </div>
    </>
  );
}
