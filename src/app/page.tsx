"use client";
import { Button, Layout, Radio, RadioChangeEvent, message } from "antd";
import "./app.css";
import { useState } from "react";
import { useCookies } from "react-cookie";
import Website from "./components/Website/Website";
import SourceUpload from "./components/Source-Upload/SourceUpload";
import { v4 as uuid } from "uuid";
import ChatbotName from "../helper/ChatbotName";

export default function Home() {
  const [cookies, setCookie] = useCookies(["userId"]);
  /// check if the unique id of the user exists else set the cookie with expiration of 1 year
  if (cookies?.userId == undefined)
    setCookie("userId", uuid(), { path: "/", maxAge: 31536000 });

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

  /// uploaded sources
  const [defaultFileList, setDefaultFileList] = useState([]);

  /// crawledLinks
  const [crawledList, setCrawledList] = useState([]);

  const [messageApi, contextHolder] = message.useMessage();

  /// create the chatbase chatbot
  async function createChatBaseBot() {
    if (crawledList.length != 0) {
      let headers = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
        "Content-Type": "application/json",
        cache: "no-store",
      };
      /// filtering the crawledUrls
      let crawledUrls = crawledList.map((item: any) => item.url);

      let chatbotName = `Chatbot ${ChatbotName()}`;

      /// creating bot through urls
      const options = {
        method: "POST",
        headers,
        body: JSON.stringify({
          chatbotName: chatbotName,
          urlsToScrape: crawledUrls,
        }),
        next: { revalidate: 0 },
      };

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
        console.log("create bot", data);
        if (data.chatbotId) {
          messageApi
            .open({
              type: "success",
              content: "Chabot trained successfully",
            })
            .then(() => {
              window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`;
            });
        } else {
          messageApi.open({
            type: "error",
            content: data.message,
          });
        }
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

  /// creating custom chatbot
  async function createCustomBot() {
    if (defaultFileList.length !== 0) {
      /// send the file data
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/store`,
        {
          method: "POST",
          body: JSON.stringify({ defaultFileList, userId: cookies.userId }),
        }
      );
      message.success(`Chabot trained successfully`)
    } else {
      message.error(`Please upload the files first`);
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
          {source == "document" && (
            <SourceUpload
              defaultFileList={defaultFileList}
              setDefaultFileList={setDefaultFileList}
              updateCharCount={updateCharCount}
              getCharCount={charCount}
            />
          )}
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
            {(crawledList.length > 0 && (
              <p>
                {crawledList.length} Links ({charCount} detected chars)
              </p>
            )) ||
              (defaultFileList.length == 1 && (
                <p>
                  {defaultFileList.length} File ({charCount} detected chars)
                </p>
              )) ||
              (defaultFileList.length > 1 && (
                <p>
                  {defaultFileList.length} Files ({charCount} detected chars)
                </p>
              ))}
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
              style={{ width: "100%" }}
              type="primary"
              disabled={loading}
              onClick={createCustomBot}
            >
              Create Chatbot
            </Button>
          </div>
        </center>
      </div>
    </>
  );
}
