"use client";
import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import Icon from "../../_components/Icon/Icon";
import DocumentIcon from "../../../assets/svg/DocumentIcon";
import arrowIcon from "../../../../public/svgs/Feather Icon.svg";
import "./app.scss";
import TextIcon from "../../../assets/svg/TextIcon";
import QAIcon from "../../../assets/svg/QAIcon";
import WebsiteIcon from "../../../assets/svg/WebsiteIcon";
import SpreadSheetIcon from "../../../assets/svg/SpreadSheetIcon";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import SourceUpload from "../../_components/Source-Upload/SourceUpload";
import Text from "../../_components/Text/Text";
import QA from "../../_components/QA/QA";
import Website from "../../_components/Website/Website";
import { useSession } from "next-auth/react";
import { Spin, message } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useCookies } from "react-cookie";
import { redirect } from "next/navigation";
const crypto = require("crypto");

function Home({
  updateChatbot = false,
  qaData,
  textData,
  fileData,
  crawlingData,
  chatbotId,
  chatbotName,
}: any) {
  const { status } = useSession();

  /// loading icon
  const antIcon = (
    <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
  );

  const [cookies, setCookie] = useCookies(["userId"]);
  const [messageApi, contextHolder] = message.useMessage();

  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// check if chatbot is being updated
  const isUpdateChatbot = botDetails?.isUpdateChatbot;
  /// get the total char count
  const totalCharCount = botDetails?.totalCharCount;
  /// get the total files char count
  const filesCharCount = botDetails?.filesCharCount;
  /// get the total text char count
  const textCharCount = botDetails?.textCharCount;
  /// get the total qa char count and qa count
  const qaCharCount = botDetails?.qaCharCount;
  const qaCount = botDetails?.qaCount;
  /// get the total website char count
  const websiteCharCount = botDetails?.websiteCharCount;

  /// get default file to preview if any
  const defaultFileList = botDetails?.defaultFileList;
  /// check for any ongoing process
  const isLoading = botDetails?.isLoading;

  /// check which source is active
  const activeSource = botDetails?.activeSource;

  /// get new file list
  const newFileList = botDetails?.newFileList;
  /// get delete file list
  const deleteFileList = botDetails?.deleteFileList;
  const crawledList = botDetails?.crawledList;

  /// creating the hash of initial text to compare it later with current text hash
  const initialTextData = textData?.text ? textData.text : "";

  const initialTextHash = crypto
    .createHash("sha1")
    .update(initialTextData)
    .digest("hex");

  /// creating the hash of initial Q&A to compare it later with current Q&A hash
  const initialQAData = qaData?.qaList ? qaData.qaList : [];
  const initialQAHash = crypto
    .createHash("sha1")
    .update(JSON.stringify(initialQAData))
    .digest("hex");

  /// creating the hash of latest QA
  const currentQAHash = crypto
    .createHash("sha1")
    .update(JSON.stringify(botDetails?.qaList))
    .digest("hex");

  /// creating the hash of initial website data to compare it later with current website hash
  const initialCrawlData = crawlingData?.crawledData[0]
    ? crawlingData?.crawledData[0]
    : [];
  const initialCrawlDataHash = initialCrawlData.length;

  /// total characters count
  const tempQaCharCount = qaData ? qaData.qaCharCount : 0;
  const tempTextCharCount = textData ? textData.textLength : 0;
  const tempFileTextCount = fileData ? fileData.fileTextLength : 0;
  const tempCrawlDataCount = crawlingData ? crawlingData?.crawledDataLength : 0;

  /// creating the hash of latest text
  const text = botDetails?.text;
  const currentTextHash = crypto.createHash("sha1").update(text).digest("hex");

  useEffect(() => {
    /// set chatbot name
    // Accessing search parameters using window.location.search to get chatbotname
    const searchParams = new URLSearchParams(window.location.search);
    const paramValue = searchParams.get("chatbotName");
    botContext.handleChange("chatbotName")(paramValue);

    /// total characters count
    botContext.handleChange("totalCharCount")(
      tempQaCharCount +
        tempTextCharCount +
        tempFileTextCount +
        tempCrawlDataCount
    );

    /// text cahracter count and text
    botContext.handleChange("textCharCount")(tempTextCharCount);
    botContext.handleChange("text")(initialTextData);

    /// file sources
    botContext.handleChange("defaultFileList")(
      fileData ? fileData.defaultFileList : []
    );
    /// file cahracter count
    botContext.handleChange("filesCharCount")(tempFileTextCount);

    /// set the isUpdatechatbot to true if chatbot is getting retrained
    botContext.handleChange("isUpdateChatbot")(updateChatbot);

    /// QA cahracter count
    botContext.handleChange("qaCount")(qaData ? qaData.qaCount : 0);
    botContext.handleChange("qaCharCount")(tempQaCharCount);
    /// QA state array
    botContext.handleChange("qaList")(initialQAData);

    /// crawledLinks count
    botContext.handleChange("crawledList")(initialCrawlData);
    botContext.handleChange("websiteCharCount")(tempCrawlDataCount);
  }, [
    updateChatbot,
    qaData,
    textData,
    fileData,
    crawlingData,
    chatbotId,
    chatbotName,
  ]);

  /// creating custom chatbot
  async function createCustomBot() {
    botContext?.handleChange("isLoading")(true);

    if (
      qaCount === 0 &&
      textCharCount === 0 &&
      defaultFileList.length === 0 &&
      crawledList.length === 0
    ) {
      message.error("Please add some content to create the bot").then(() => {
        botContext?.handleChange("isLoading")(false);
      });
      return;
    }
    if (totalCharCount < 100) {
      message.error("Not enough content to create the bot").then(() => {
        botContext?.handleChange("isLoading")(false);
      });
      return;
    }
    for await (const item of botDetails?.qaList) {
      if (item.question.length < 10 || item.answer.length < 20) {
        message
          .error(
            "Question/Answer length too short in Q&A section. Min length : q = 10, a = 20"
          )
          .then(() => {
            botContext?.handleChange("isLoading")(false);
          });
        return;
      }
    }
    /// send the data
    try {
      messageApi.open({
        type: "info",
        content: "Please wait while your chatbot is getting trained",
      });
      const formData = new FormData();

      // Append the QA data including images to the formData object
      for (const [index, qa] of botDetails?.qaList.entries()) {
        // formData.append(`qaList[${index}].question`, qa.question);
        // formData.append(`qaList[${index}].answer`, qa.answer);
        if (qa.image && typeof qa.image != "string") {
          formData.append(`qaList[${index}].image`, qa.image);
        }
      }

      // Append other data to the formData object
      formData.append("updateChatbot", updateChatbot);
      formData.append(
        "isTextUpdated",
        initialTextHash === currentTextHash ? "false" : "true"
      );
      formData.append("chatbotId", chatbotId);
      formData.append("defaultFileList", JSON.stringify(defaultFileList));
      formData.append("deleteFileList", JSON.stringify(deleteFileList));
      formData.append("deleteQAList", JSON.stringify(botDetails?.deleteQaList));
      formData.append("crawledList", JSON.stringify(crawledList));
      formData.append(
        "deleteCrawlList",
        JSON.stringify(botDetails?.deleteCrawlList)
      );
      //// default chatbot set
      formData.append(
        "userId",
        chatbotId === "123d148a-be02-4749-a612-65be9d96266c"
          ? "651d111b8158397ebd0e65fb"
          : chatbotId === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
          ? "65795294269d08529b8cd743"
          : chatbotId === "f0893732-3302-46b2-922a-95e79ef3524c"
          ? "651d111b8158397ebd0e65fb"
          : cookies.userId
      );
      formData.append("qaList", JSON.stringify(botDetails?.qaList));
      formData.append("text", text);
      formData.append(
        "chatbotText",
        chatbotName ? chatbotName : botDetails?.chatbotName
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/store`,
        {
          headers: {
            cache: "no-store",
          },
          method: "POST",
          body: formData,
          next: { revalidate: 0 },
        }
      );

      if (!response.ok) {
        messageApi
          .open({
            type: "error",
            content: "Something went wrong while creating custom bot",
          })
          .then(() => {
            botContext?.handleChange("isLoading")(false);
          });
        return;
      }

      if (response.status == 200) {
        message.success(await response.text()).then(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`;
        });
      } else if (response.status == 201) {
        message.success(await response.text()).then(() => {
          window.location.href = `${
            process.env.NEXT_PUBLIC_WEBSITE_URL
          }chatbot/dashboard?${encodeURIComponent(
            "chatbot"
          )}=${encodeURIComponent(
            JSON.stringify({
              id: chatbotId,
              name: chatbotName ? chatbotName : botDetails?.chatbotName,
            })
          )}`;
        });
      } else {
        message.error(await response.text()).then(() => {
          window.location.href = `${
            process.env.NEXT_PUBLIC_WEBSITE_URL
          }chatbot/dashboard?${encodeURIComponent(
            "chatbot"
          )}=${encodeURIComponent(
            JSON.stringify({
              id: chatbotId,
              name: chatbotName ? chatbotName : botDetails?.chatbotName,
            })
          )}`;
        });
      }
    } catch (e: any) {
      message.error(e.message);
    } finally {
      botContext?.handleChange("isLoading")(false);
    }
  }

  if (status === "loading") {
    return (
      <center>
        <Spin indicator={antIcon} />
      </center>
    );
  } else if (status === "authenticated" || cookies?.userId) {
    return (
      <div className="create-chatbot-container">
        {contextHolder}
        {/*------------------------------------------top-section----------------------------------------------*/}
        <div className="top">
          {/*------------------------------------------header----------------------------------------------*/}
          <div className="sources-header">
            <div className="title">
              <Image
                src={arrowIcon}
                alt="arrow-icon"
                style={{ transform: "rotate(180deg)", cursor: "pointer" }}
                onClick={() => {
                  window.history.back();
                }}
              />
              <h1>{botDetails?.chatbotName}</h1>
            </div>

            <p>Add your data sources to train your chatbot</p>

            {/*------------------------------------------options-container----------------------------------------------*/}
            <ul className="options-container">
              <li
                className={`${activeSource === "document" ? "active" : ""}`}
                value={"document"}
                onClick={() =>
                  botContext?.handleChange("activeSource")("document")
                }
              >
                <Icon Icon={DocumentIcon} />
                <h3>Document</h3>
              </li>
              <li
                className={`${activeSource === "text" ? "active" : ""}`}
                value={"text"}
                onClick={() => botContext?.handleChange("activeSource")("text")}
              >
                <Icon Icon={TextIcon} />
                <h3>Text</h3>
              </li>
              <li
                className={`${activeSource === "qa" ? "active" : ""}`}
                value={"qa"}
                onClick={() => botContext?.handleChange("activeSource")("qa")}
              >
                <Icon Icon={QAIcon} />
                <h3>Q&A</h3>
              </li>
              <li
                className={`${activeSource === "website" ? "active" : ""}`}
                value={"website"}
                onClick={() =>
                  botContext?.handleChange("activeSource")("website")
                }
              >
                <Icon Icon={WebsiteIcon} />
                <h3>Website</h3>
              </li>
            </ul>
          </div>
        </div>

        {/*------------------------------------------bottom-section----------------------------------------------*/}
        <div className="bottom">
          <div className="left">
            {activeSource === "document" && (
              <SourceUpload
                totalCharCount={totalCharCount}
                filesCharCount={filesCharCount}
              />
            )}
            {activeSource === "text" && (
              <Text
                totalCharCount={totalCharCount}
                textCharCount={textCharCount}
              />
            )}
            {activeSource === "qa" && (
              <QA
                isUpdateChatbot={isUpdateChatbot}
                totalCharCount={totalCharCount}
                qaCharCount={qaCharCount}
              />
            )}
            {activeSource === "website" && (
              <Website
                websiteCharCount={websiteCharCount}
                totalCharCount={totalCharCount}
                isUpdateChatbot={isUpdateChatbot}
              />
            )}
          </div>
          <div className="right" style={{ marginTop: "20px" }}>
            <div className="character-count-container">
              {/*------------------------------------------items-character-count----------------------------------------------*/}
              <div className="items-character-count-container">
                {defaultFileList?.length > 0 && (
                  <p>
                    {defaultFileList.length} Files ({filesCharCount} detected
                    chars)
                  </p>
                )}
                {/* {(defaultFileList?.length == 1 && (
                <p>
                  {defaultFileList.length} File ({fileTextLength} detected
                  chars)
                </p>
              )) ||
                (defaultFileList?.length > 1 && (
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
              */}
                {/* {crawledList.length > 0 &&
                  (defaultFileList.length > 0 ||
                    textLength > 0 ||
                    qaCount > 0) && <p className="margin-pipe">|</p>} */}
                {qaCount > 0 && (
                  <p>
                    {qaCount} Q&A ({qaCharCount} chars)
                  </p>
                )}
                {textCharCount > 0 && <p>{textCharCount} text input chars</p>}

                {crawledList?.length > 0 && (
                  <p>
                    {crawledList.length} Links ({websiteCharCount} detected
                    chars)
                  </p>
                )}
              </div>

              <hr />

              <div className="total-count-container">
                <p>Total detected characters</p>

                <span>
                  {totalCharCount}
                  <span>/11.000.000 limit</span>
                </span>
              </div>
            </div>

            {/*------------------------------------------chatbot-naming----------------------------------------------*/}
            {/* <div className="name-chatbot-container">
              <h2>Name your Chatbot</h2>
              <input type="text" placeholder="Enter your chatbot name" />
            </div> */}

            <button
              disabled={
                isLoading == true
                  ? true
                  : isUpdateChatbot == "true" &&
                    currentTextHash === initialTextHash
                  ? deleteFileList.length + newFileList.length
                    ? false
                    : initialQAHash === currentQAHash
                    ? botDetails?.deleteCrawlList.length > 0
                      ? false
                      : initialCrawlDataHash != crawledList.length
                      ? false
                      : true
                    : false
                  : false
              }
              onClick={createCustomBot}
            >
              {(!updateChatbot && "Create") || "Retrain Bot"}
            </button>
          </div>
        </div>
      </div>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  } else {
    return <></>;
  }
}

export default Home;
