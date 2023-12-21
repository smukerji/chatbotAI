"use client";
import { Button, Spin, Radio, RadioChangeEvent, message } from "antd";
import "./app.css";
import { useState } from "react";
import { useCookies } from "react-cookie";
import Website from "../../_components/Website/Website";
import SourceUpload from "../../_components/Source-Upload/SourceUpload";
import Text from "../../_components/Text/Text";
import QA from "../../_components/QA/QA";
import ChatbotNameModal from "../../_components/Modal/ChatbotNameModal";
import ChatbotName from "../../_helpers/server/ChatbotName";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LoadingOutlined } from "@ant-design/icons";
const crypto = require("crypto");

export default function Home({
  updateChatbot = false,
  qaData,
  textData,
  fileData,
  crawlingData,
  chatbotId,
  chatbotName,
}: any) {
  const { status } = useSession();
  // const status = "authenticated";

  /// loading icon
  const antIcon = (
    <LoadingOutlined style={{ fontSize: 24, color: "black" }} spin />
  );

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

  /// creating the hash of initial website data to compare it later with current website hash
  const initialCrawlData = crawlingData?.crawledData[0]
    ? crawlingData?.crawledData[0]
    : [];

  const initialCrawlDataHash = crypto
    .createHash("sha1")
    .update(JSON.stringify(initialCrawlData))
    .digest("hex");

  const [cookies, setCookie] = useCookies(["userId"]);
  /// check if the unique id of the user exists else set the cookie with expiration of 1 year
  // if (cookies?.userId == undefined)
  //   setCookie("userId", cookies.userId, { path: "/", maxAge: 31536000 });

  /// hadling event of radio buttons
  const [source, setSource] = useState("document");
  const onChange = (e: RadioChangeEvent) => {
    setSource(e.target.value);
  };

  /// loading state
  const [loading, setLoading] = useState(false);

  /// total characters count
  const tempQaCharCount = qaData ? qaData.qaCharCount : 0;
  const tempTextCharCount = textData ? textData.textLength : 0;
  const tempFileTextCount = fileData ? fileData.fileTextLength : 0;
  const tempCrawlDataCount = crawlingData ? crawlingData?.crawledDataLength : 0;
  const [charCount, setCharCount] = useState(
    tempQaCharCount + tempTextCharCount + tempFileTextCount + tempCrawlDataCount
  );
  function updateCharCount(count: number) {
    setCharCount(count);
  }

  /// text cahracter count and text
  const [textLength, setTextLength] = useState(tempTextCharCount);
  const [text, setText] = useState(initialTextData);
  /// creating the hash of latest text
  const currentTextHash = crypto.createHash("sha1").update(text).digest("hex");

  /// QA cahracter count
  const [qaCount, setQACount] = useState(qaData ? qaData.qaCount : 0);
  const [qaCharCount, setQACharCount] = useState(tempQaCharCount);
  /// QA state array
  const [qaList, setQAList]: any = useState(initialQAData);

  /// creating the hash of latest QA
  const currentQAHash = crypto
    .createHash("sha1")
    .update(JSON.stringify(qaList))
    .digest("hex");
  /// state for maintaining qa when updating the sources
  const [deleteQAList, setDeleteQAList]: any = useState([]);

  /// file sources
  const [defaultFileList, setDefaultFileList] = useState(
    fileData ? fileData.defaultFileList : []
  );
  /// state for maintaining file when updating the sources
  const [deleteFileList, setDeleteFileList]: any = useState([]);
  const [newFileList, setNewFileList] = useState([]);
  /// file cahracter count
  const [fileTextLength, setFileTextLength] = useState(tempFileTextCount);

  /// crawledLinks count
  const [crawledList, setCrawledList] = useState(initialCrawlData);
  const [websiteCharCount, setWebsiteCharCount] = useState(tempCrawlDataCount);
  /// state for maintaining qa when updating the sources
  const [deleteCrawlList, setDeleteCrawlList]: any = useState([]);

  const [messageApi, contextHolder] = message.useMessage();

  /// chatbot name pop up state
  const [open, setOpen] = useState(false);
  const [chatbotText, setChatbotText] = useState("");

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

    // if (crawledList.length != 0) {
    //   let headers = {
    //     Authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
    //     "Content-Type": "application/json",
    //     cache: "no-store",
    //   };
    //   /// filtering the crawledUrls
    //   let crawledUrls = crawledList.map((item: any) => item.url);

    //   let chatbotName = `Chatbot ${ChatbotName()}`;

    //   /// creating bot through urls
    //   const options = {
    //     method: "POST",
    //     headers,
    //     body: JSON.stringify({
    //       chatbotName: chatbotName,
    //       urlsToScrape: crawledUrls,
    //     }),
    //     next: { revalidate: 0 },
    //   };

    //   try {
    //     messageApi.open({
    //       type: "info",
    //       content: "Please wait while your chatbot is getting trained",
    //     });
    //     const res = await fetch(
    //       "https://www.chatbase.co/api/v1/create-chatbot",
    //       options
    //     );
    //     const data = await res.json();
    //     if (data.chatbotId) {
    //       messageApi
    //         .open({
    //           type: "success",
    //           content: "Chabot trained successfully",
    //         })
    //         .then(() => {
    //           window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`;
    //         });
    //     } else {
    //       messageApi.open({
    //         type: "error",
    //         content: data.message,
    //       });
    //     }
    //   } catch (error) {
    //     messageApi.open({
    //       type: "error",
    //       content: "Error while creating chatbot",
    //     });
    //   }
    // } else {
    //   messageApi.open({
    //     type: "error",
    //     content: "No links found to create chatbot",
    //   });
    // }

    if (crawledList.length != 0) {
      setLoading(true);
      /// send the data
      try {
        messageApi.open({
          type: "info",
          content: "Please wait while your chatbot is getting trained",
        });
        const formData = new FormData();

        // Append other data to the formData object
        formData.append("crawledList", JSON.stringify(crawledList));
        formData.append("updateChatbot", updateChatbot);
        formData.append("chatbotId", chatbotId);
        formData.append("userId", cookies.userId);
        formData.append("updateChatbot", updateChatbot);
        formData.append("chatbotText", "crawling-ichefpos");
        formData.append("deleteCrawlList", JSON.stringify(deleteCrawlList));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/store2`,
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
              content: "Something went wrong while creating bot",
            })
            .then(() => {
              setLoading(false);
            });
          return;
        }

        if (response.status == 200) {
          message.success(await response.text()).then(() => {
            // window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot`;
          });
        } else if (response.status == 201) {
          message.success(await response.text()).then(() => {
            // window.location.href = `${
            //   process.env.NEXT_PUBLIC_WEBSITE_URL
            // }chatbot/dashboard?${encodeURIComponent(
            //   "chatbot"
            // )}=${encodeURIComponent(
            //   JSON.stringify({
            //     id: chatbotId,
            //     name: chatbotName,
            //   })
            // )}`;
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
                name: chatbotName,
              })
            )}`;
          });
        }
      } catch (e: any) {
        message.error(e.message);
      } finally {
        setLoading(false);
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
    setLoading(true);
    if (
      qaCount === 0 &&
      textLength === 0 &&
      defaultFileList.length === 0 &&
      crawledList.length === 0
    ) {
      message.error("Please add some content to create the bot").then(() => {
        setLoading(false);
      });
      return;
    }
    if (charCount < 100) {
      message.error("Not enough content to create the bot").then(() => {
        setLoading(false);
      });
      return;
    }
    for await (const item of qaList) {
      if (item.question.length < 10 || item.answer.length < 20) {
        message
          .error(
            "Question/Answer length too short in Q&A section. Min length : q = 10, a = 20"
          )
          .then(() => {
            setLoading(false);
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
      for (const [index, qa] of qaList.entries()) {
        // formData.append(`qaList[${index}].question`, qa.question);
        // formData.append(`qaList[${index}].answer`, qa.answer);
        if (qa.image && typeof qa.image != "string") {
          formData.append(`qaList[${index}].image`, qa.image);
        }
      }

      // Append other data to the formData object
      formData.append("updateChatbot", updateChatbot);
      formData.append("chatbotId", chatbotId);
      formData.append("defaultFileList", JSON.stringify(defaultFileList));
      formData.append("deleteFileList", JSON.stringify(deleteFileList));
      formData.append("deleteQAList", JSON.stringify(deleteQAList));
      formData.append("crawledList", JSON.stringify(crawledList));
      formData.append("deleteCrawlList", JSON.stringify(deleteCrawlList));
      //// default chatbot set
      formData.append(
        "userId",
        chatbotId === "123d148a-be02-4749-a612-65be9d96266c"
          ? "651d111b8158397ebd0e65fb"
          : chatbotId === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
          ? "65795294269d08529b8cd743"
          : chatbotId === "ebb79df8-c72f-40d1-b84e-99c59b49ee35"
          ? "65795294269d08529b8cd743"
          : cookies.userId
      );
      formData.append("qaList", JSON.stringify(qaList));
      formData.append("text", text);
      formData.append("chatbotText", chatbotText);

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
            setLoading(false);
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
              name: chatbotName,
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
              name: chatbotName,
            })
          )}`;
        });
      }
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  /// chatbot name giver
  async function openChatbotModal() {
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  /// handling the chatbot ok action
  const handleOk = async () => {
    if (chatbotText.length < 5) {
      message.error("Please provide a valid chatbot name");
      return;
    }
    setOpen(false);
    createCustomBot();
  };

  if (status === "loading") {
    return (
      <center>
        <Spin indicator={antIcon} />
      </center>
    );
  } else if (status === "authenticated" || cookies?.userId) {
    return (
      <>
        {contextHolder}

        <div className="data-source-container">
          <center>
            {!updateChatbot && <p className="title">Data Sources</p>}
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
                updateChatbot={updateChatbot}
                newFileList={newFileList}
                setNewFileList={setNewFileList}
                deleteFileList={deleteFileList}
                setDeleteFileList={setDeleteFileList}
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
                updateChatbot={updateChatbot}
                deleteCrawlList={deleteCrawlList}
                setDeleteCrawlList={setDeleteCrawlList}
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
                deleteQAList={deleteQAList}
                setDeleteQAList={setDeleteQAList}
                updateChatbot={updateChatbot}
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
              <div className="items-character-count-container">
                {(defaultFileList?.length == 1 && (
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
                {crawledList.length > 0 &&
                  (defaultFileList.length > 0 ||
                    textLength > 0 ||
                    qaCount > 0) && <p className="margin-pipe">|</p>}
                {crawledList.length > 0 && (
                  <p>
                    {crawledList.length} Links ({websiteCharCount} detected
                    chars)
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
                disabled={
                  loading == true
                    ? true
                    : updateChatbot && currentTextHash === initialTextHash
                    ? deleteFileList.length + newFileList.length
                      ? false
                      : initialQAHash === currentQAHash
                      ? deleteCrawlList.length > 0
                        ? false
                        : true
                      : false
                    : false
                }
                onClick={
                  // createChatBaseBot
                  // (crawledList.length != 0 && createChatBaseBot) ||
                  (!updateChatbot && openChatbotModal) || createCustomBot
                }
              >
                {(!updateChatbot && "Create Chatbot") || "Retrain Chatbot"}
              </Button>
            </div>
          </center>
        </div>
        <ChatbotNameModal
          open={open}
          setOpen={setOpen}
          chatbotText={chatbotText}
          setChatbotText={setChatbotText}
          handleOk={handleOk}
        />
      </>
    );
  } else if (status === "unauthenticated") {
    redirect("/account/login");
  } else {
    return <></>;
  }
}
