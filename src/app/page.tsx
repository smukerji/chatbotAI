"use client";
import { Button, Layout, Radio, RadioChangeEvent, message } from "antd";
import "./app.css";
import { useState } from "react";
import { useCookies } from "react-cookie";
import Website from "./components/Website/Website";
import SourceUpload from "./components/Source-Upload/SourceUpload";
import { v4 as uuid } from "uuid";
import ChatbotName from "../helper/ChatbotName";
import Text from "./components/Text/Text";
import QA from "./components/QA/QA";

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
  /// file cahracter count
  const [fileTextLength, setFileTextLength] = useState(0);

  /// text cahracter count and text
  const [textLength, setTextLength] = useState(0);
  const [text, setText] = useState("");

  /// QA cahracter count
  const [qaCount, setQACount] = useState(0);
  const [qaCharCount, setQACharCount] = useState(0);
  /// QA state array
  const [qaList, setQAList]: any = useState([]);

  /// uploaded sources
  const [defaultFileList, setDefaultFileList] = useState([]);

  /// crawledLinks count
  const [crawledList, setCrawledList] = useState([]);
  const [websiteCharCount, setWebsiteCharCount] = useState(0);

  const [messageApi, contextHolder] = message.useMessage();

  /// create the chatbase chatbot
  async function createChatBaseBot() {
    if (
      (crawledList.length != 0 && defaultFileList.length !== 0) ||
      (crawledList.length != 0 && textLength !== 0) ||
      (crawledList.length != 0 && qaCount !== 0)
    ) {
      messageApi.open({
        type: "info",
        content:
          "Sorry!!! currently you cannot upload other documents when crawling for websites...",
      });
      return;
    }

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
    if (qaCount === 0 && textLength === 0 && defaultFileList.length === 0) {
      message.error("Please add some content to create the bot");
      return;
    }
    if (charCount < 100) {
      message.error("Not enough content to create the bot");
      return;
    }
    for await (const item of qaList) {
      if (item.question.length < 10 || item.answer.length < 20) {
        message.error(
          "Question/Answer length too short in Q&A section. Min length : q = 10, a = 20"
        );
        return;
      }
    }
    /// send the file data
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/store`,
        {
          headers: {
            cache: "no-store",
          },
          method: "POST",
          body: JSON.stringify({
            defaultFileList,
            userId: cookies.userId,
            qaList,
            text,
          }),
          next: { revalidate: 0 },
        }
      );

      if (!response.ok) {
        messageApi.open({
          type: "error",
          content: "Something went wrong while creating custom bot",
        });
      }
      message.success(await response.text()).then(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`;
      });
    } catch (e: any) {
      message.error(e.message);
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
            <Radio name="source" value={"text"}>
              Text
            </Radio>
            <Radio name="source" value={"qa"}>
              Q&A
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
              setLoadingPage={setLoading}
              fileTextLength={fileTextLength}
              setFileTextLength={setFileTextLength}
            />
          )}
          {source == "website" && (
            <Website
              updateCharCount={updateCharCount}
              getCharCount={charCount}
              setLoadingPage={setLoading}
              setCrawledList={setCrawledList}
              crawledList={crawledList}
              websiteCharCount={websiteCharCount}
              setWebsiteCharCount={setWebsiteCharCount}
            />
          )}
          {source == "text" && (
            <Text
              text={text}
              setText={setText}
              textLength={textLength}
              setTextLength={setTextLength}
              updateCharCount={updateCharCount}
              getCharCount={charCount}
            />
          )}
          {source == "qa" && (
            <QA
              qaList={qaList}
              setQAList={setQAList}
              qaCount={qaCount}
              setQACount={setQACount}
              qaCharCount={qaCharCount}
              setQACharCount={setQACharCount}
              updateCharCount={updateCharCount}
              getCharCount={charCount}
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
            {/* {(crawledList.length > 0 && (
              <p>
                {crawledList.length} Links ({charCount} detected chars)
              </p>
            )) || */}
            <div className="items-character-count-container">
              {(defaultFileList.length == 1 && (
                <p>
                  {defaultFileList.length} File ({fileTextLength} detected
                  chars)
                </p>
              )) ||
                (defaultFileList.length > 1 && (
                  <p>
                    {defaultFileList.length} Files ({fileTextLength} detected
                    chars)
                  </p>
                ))}
              {textLength > 0 && defaultFileList.length > 0 && (
                <p className="margin-pipe">|</p>
              )}
              {textLength > 0 && <p>{textLength} text input chars</p>}
              {qaCount > 0 &&
                (defaultFileList.length > 0 || textLength > 0) && (
                  <p className="margin-pipe">|</p>
                )}
              {qaCount > 0 && (
                <p>
                  {qaCount} Q&A ({qaCharCount} chars)
                </p>
              )}
              {crawledList.length > 0 &&
                (defaultFileList.length > 0 ||
                  textLength > 0 ||
                  qaCount > 0) && <p className="margin-pipe">|</p>}
              {crawledList.length > 0 && (
                <p>
                  {crawledList.length} Links ({websiteCharCount} detected chars)
                </p>
              )}
            </div>
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
              onClick={
                (crawledList.length != 0 && createChatBaseBot) ||
                createCustomBot
              }
            >
              Create Chatbot
            </Button>
          </div>
        </center>
      </div>
    </>
  );
}
