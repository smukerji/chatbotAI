import React, { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import exportBtn from "../../../../../../../public/svgs/export-btn.svg";
import { useCookies } from "react-cookie";
import likeIcon from "../../../../../../../public/svgs/like.svg";
import dislikeIcon from "../../../../../../../public/svgs/dislike.svg";
import "./history.scss";
import ChatbotNameModal from "../../../../../_components/Modal/ChatbotNameModal";
import { ConfigProvider, DatePicker, Pagination, message } from "antd";
import { ChatbotSettingContext } from "../../../../../_helpers/client/Context/ChatbotSettingContext";
import { PrintingChats } from "../Printing-Chats/Printing";
import ReactToPrint from "react-to-print";
import {
  AUTHORIZATION_FAILED,
  JWT_EXPIRED,
} from "../../../../../_helpers/errorConstants";
import { getTimeAgo } from "@/app/_helpers/client/getTime";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";
import closeImage from "../../../../../../../public/svgs/close-icon.svg";
import noHistory from "../../../../../../../public/svgs/empty-history.svg";

const { RangePicker } = DatePicker;

function History({ chatbotId }: any) {
  let tempRef: any = useRef<HTMLDivElement>();

  const [chatHistoryList, setChatHistoryList]: any = useState([]);
  const [currentChatHistory, setCurrentChatHistory]: any = useState([]);
  /// tempary state to store the chat history for filtering leads
  const [tempChatHistory, setTempChatHistory]: any = useState([]);
  const [activeCurrentChatHistory, setActiveCurrentChatHistory]: any =
    useState();

  const [cookies, setCookies] = useCookies(["userId"]);

  const [leadsFilter, setLeadsFilter] = useState("");
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayDate, setDisplayDate] = useState(null);
  const selectedDate: any = useRef(null);

  const [chatClicked, setIsChatClicked] = useState<boolean>(false);

  const handleCancel = () => {
    selectedDate.current = null;
    setOpenDatePicker(false);
  };

  /// method to handle page offset
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  const [displayEmail, setDisplayEmail] = useState("");

  /// update the chat history data
  const fetchHistoryCount = async (
    count = false,
    page = 1,
    pageSize = 10,
    startDate: any = null,
    endDate: any = null
  ) => {
    if (botDetails?.referedFrom == "leads") {
      if (tempChatHistory.length == 0) {
        /// filter the data and copy the chat history to temp chat history
        setTempChatHistory(chatHistoryList);
        const filteredData = chatHistoryList.filter((data: any) => {
          const date = new Date(data[1].sessionEndDate).toLocaleDateString(
            "en-CA"
          );

          return date >= startDate && date <= endDate;
        });

        setChatHistoryList(filteredData);
      } else {
        /// filter the data from temp chat history
        const filteredData = tempChatHistory.filter((data: any) => {
          const date = new Date(data[1].sessionEndDate).toLocaleDateString(
            "en-CA"
          );

          return date >= startDate && date <= endDate;
        });

        setChatHistoryList(filteredData);
      }
      // alert("leads");
    } else {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10&filterSource=history`
      );
      const content = await response.json();
      // setChatHistoryList(content?.chatHistory);
      setChatHistoryList(Object.entries(content?.chatHistory?.chats).reverse());
    }

    /// used only to get the total number of pages when page loads
    // if (count) {
    //   setTotalPages(content?.leadsCount);
    // }
  };

  useEffect(() => {
    /// retrive the chatbot data
    const retriveData = async () => {
      let response;
      if (botDetails?.leadSessionsEmail == "") {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=null&endDate=null&page=1&pageSize=10&filterSource=history`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // body: JSON.stringify({

            // }),
            // next: { revalidate: 0 },
          }
        );
      } else {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=null&endDate=null&page=1&pageSize=10&filterSource=lead-history&email=${botDetails?.leadSessionsEmail}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // body: JSON.stringify({

            // }),
            // next: { revalidate: 0 },
          }
        );
      }
      const content = await response.json();

      if (content?.message === JWT_EXPIRED) {
        message.error(AUTHORIZATION_FAILED).then(() => {
          window.location.href = "/account/login";
        });
        return;
      }
      // setChatHistoryList(content?.chatHistory);
      setChatHistoryList(Object.entries(content?.chatHistory?.chats).reverse());
    };

    retriveData();
  }, [botDetails?.leadSessionsEmail]);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

  /// Messages feedback opener
  async function openChatbotModal(index: number, status: string) {
    /// set the like/dislike btn check and the index to store the message history
    setFeedbackIndex(index);
    setfeedbackStatus(status);
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  /// handling the chatbot ok action
  const handleOk = async () => {
    if (feedbackText.length < 10) {
      message.error("Please provide add more feeback");
      return;
    }
    setOpen(false);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/feedback/api`,
      {
        headers: {
          cache: "no-store",
        },
        method: "POST",
        body: JSON.stringify({
          chatbotId: chatbotId,
          messages: [...currentChatHistory.slice(0, feedbackIndex + 1)],
          feedback: { text: feedbackText, status: feedbackStatus },
        }),
        next: { revalidate: 0 },
      }
    );

    /// if response is ok then clear the feeback text
    if (!response.ok) throw new Error(await response.json());
    else {
      setfeedbackText("");
    }

    const body = await response.json();
    message.info(body?.message);
  };
  console.log("->>>>>>>>>>>>>>>>", chatClicked);
  return (
    <div className="history-chat-container">
      <div className="action-container">
        <div className="date-picker-container">
          {/* custom date buttons */}
          <div className="interval-btns">
            <button
              className={`interval-btn ${leadsFilter === "today" && "active"}`}
              onClick={() => {
                const today: any = new Date().toLocaleDateString("en-CA");
                fetchHistoryCount(true, 1, 10, today, today);
                setCurrentPage(1);
                setLeadsFilter("today");
                setOpenDatePicker(false);
                setDisplayDate(null);
                setCurrentChatHistory([]);
              }}
            >
              Today
            </button>
            <button
              className={`interval-btn ${
                leadsFilter === "last-7-day" && "active"
              }`}
              onClick={() => {
                const today: any = new Date().toLocaleDateString("en-CA");
                const last7Days: any = new Date();
                last7Days.setDate(last7Days.getDate() - 7);
                let refinedFormatLast7Days =
                  last7Days.toLocaleDateString("en-CA");
                fetchHistoryCount(true, 1, 10, refinedFormatLast7Days, today);
                setCurrentPage(1);
                setLeadsFilter("last-7-day");
                setOpenDatePicker(false);
                setDisplayDate(null);
                setCurrentChatHistory([]);
              }}
            >
              Last 7 Days
            </button>
            <button
              className={`interval-btn ${
                leadsFilter === "last-month" && "active"
              }`}
              onClick={() => {
                const today: any = new Date();
                today.setDate(0);
                let refinedFormatLastMonthEndDate =
                  today.toLocaleDateString("en-CA");

                const lastMonth: any = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                lastMonth.setDate(1);
                let refinedFormatLastMonth =
                  lastMonth.toLocaleDateString("en-CA");
                setCurrentPage(1);
                fetchHistoryCount(
                  true,
                  1,
                  10,
                  refinedFormatLastMonth,
                  refinedFormatLastMonthEndDate
                );
                setLeadsFilter("last-month");
                setOpenDatePicker(false);
                setDisplayDate(null);
                setCurrentChatHistory([]);
              }}
            >
              Last Month
            </button>
            <ConfigProvider
              theme={{
                components: {
                  DatePicker: {
                    cellActiveWithRangeBg: "#ECF0FE",
                    cellHoverBg: "#ECF0FE",
                    colorPrimary: "#4D72F5",
                  },
                },
              }}
            >
              <RangePicker
                className={`${leadsFilter === "custom-date" && "active"}`}
                onClick={() => {
                  setOpenDatePicker(true);
                  setLeadsFilter("custom-date");
                }}
                // superNextIcon={null}
                // superPrevIcon={null}
                onCalendarChange={(date: any) => {
                  setDisplayDate(date);
                  if (date) {
                    selectedDate.current = [
                      date[0]?.toDate().toLocaleDateString("en-CA"),
                      date[1]?.toDate().toLocaleDateString("en-CA"),
                    ];

                    // setSelectedDate((prev: any) => {
                    //   return [
                    //     date[0]?.toDate().toLocaleDateString("en-CA"),
                    //     date[1]?.toDate().toLocaleDateString("en-CA"),
                    //   ];
                    // });
                  } else {
                    selectedDate.current = null;
                  }
                }}
                // value={emptyDateRange ?? null}
                format={"DD-MM-YYYY"}
                open={openDatePicker}
                value={displayDate}
                renderExtraFooter={() => (
                  <>
                    <div className="action-btns">
                      <button
                        className="cancel-date-btn"
                        onClick={handleCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="set-date-btn"
                        onClick={() => {
                          if (!selectedDate.current) {
                            message.error("Please select a date range");
                            return;
                          }
                          if (
                            selectedDate.current[0] > selectedDate.current[1]
                          ) {
                            message.error(
                              "Start date cannot be greater than end date"
                            );
                            return;
                          }

                          setCurrentChatHistory([]);
                          setCurrentPage(1);
                          fetchHistoryCount(
                            true,
                            1,
                            10,
                            selectedDate.current[0],
                            selectedDate.current[1]
                          );
                          setOpenDatePicker(false);
                        }}
                      >
                        Set Date
                      </button>
                    </div>
                  </>
                )}
              />
            </ConfigProvider>
          </div>
        </div>
      </div>
      {chatHistoryList?.length !== 0 && (
        <div className="chatbot-history-parts">
          {/*------------------------------------------left-section----------------------------------------------*/}
          <div className="chatbot-history-details">
            {/*------------------------------------------chat-list-section----------------------------------------------*/}
            <div
              className="detail"
              style={{
                height: botDetails?.leadSessionsEmail == "" ? "100%" : "87%",
              }}
            >
              {botDetails?.referedFrom == "leads" && (
                <>
                  <p
                    className="first-message"
                    style={{
                      textTransform: "lowercase",
                      pointerEvents: "none",
                    }}
                  >
                    {botDetails?.leadSessionsEmail.toLowerCase()}
                  </p>
                </>
              )}

              {chatHistoryList?.length > 0 && (
                <>
                  {chatHistoryList
                    // ?.reverse()
                    ?.slice((currentPage - 1) * 25, currentPage * 25)
                    ?.map((data: any, index: any) => {
                      return (
                        <div
                          className={`first-message ${
                            activeCurrentChatHistory === `today${index}`
                              ? "active"
                              : ""
                          }`}
                          style={{
                            display:
                              botDetails?.referedFrom == "leads" ? "flex" : "",
                            justifyContent:
                              botDetails?.referedFrom == "leads"
                                ? "space-between"
                                : "",
                            flexDirection:
                              botDetails?.referedFrom == "leads"
                                ? "row-reverse"
                                : "column",
                          }}
                          key={index}
                          onClick={() => {
                            setIsChatClicked(true);
                            setCurrentChatHistory(data[1]?.messages);
                            setDisplayEmail(data[1]?.email);
                            setActiveCurrentChatHistory("today" + index);
                          }}
                        >
                          <div
                            className="time"
                            style={{
                              padding: 0,
                              fontSize: "14px",
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  botDetails?.referedFrom == "leads"
                                    ? "none"
                                    : "block",
                              }}
                            >
                              {data[1]?.email ? (
                                <span
                                  style={{
                                    textTransform:
                                      data[1].email == "Anonymous"
                                        ? "capitalize"
                                        : "lowercase",
                                  }}
                                >
                                  {data[1]?.email}
                                </span>
                              ) : (
                                "Anonymous"
                              )}
                            </div>

                            <div
                              // style={{
                              //   textOverflow: "ellipsis",
                              //   overflow: "hidden",
                              //   width: "100%",
                              //   textWrap: "nowrap",
                              // }}
                              style={{
                                flex:
                                  botDetails?.referedFrom == "leads"
                                    ? 1
                                    : "none",
                                textAlign: "end",
                                textWrap: "nowrap",
                              }}
                            >
                              {getTimeAgo(data[1].sessionEndDate)}
                            </div>
                          </div>

                          <div
                            style={{
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              width: "250px",
                              textWrap: "nowrap",
                              // flex: botDetails?.referedFrom == "leads" ? 1 : 0,
                            }}
                          >
                            {
                              data[1]?.messages[
                                data[1]?.initialMessageLength
                                  ? data[1]?.initialMessageLength
                                  : 1
                              ]?.content
                            }
                          </div>
                        </div>
                      );
                    })}
                </>
              )}

              {botDetails?.referedFrom == "leads" && (
                <>
                  <p
                    className="history-link"
                    onClick={() => {
                      /// reset to the conversation history
                      botContext?.handleChange("leadSessionsEmail")("");
                      botContext?.handleChange("referedFrom")("");
                    }}
                  >
                    See all converstion history
                  </p>
                </>
              )}
            </div>

            {chatHistoryList?.length > 0 && (
              <Pagination
                defaultCurrent={1}
                current={currentPage}
                total={chatHistoryList.length}
                onChange={(page) => {
                  handlePageChange(page);
                }}
                showSizeChanger={false}
                pageSize={25}
              />
            )}
            {/*------------------------------------------yesterday's-chat----------------------------------------------*/}
            {/* <div className="detail">
          {chatHistoryList?.yesterday?.chats && (
            <>
              <div className="time">Yesterday</div>
              {Object.entries(chatHistoryList?.yesterday?.chats)
                ?.reverse()
                ?.map((data: any, index: any) => {
                  return (
                    <div
                      className={`first-message ${
                        activeCurrentChatHistory === `yesterday${index}`
                          ? "active"
                          : ""
                      }`}
                      key={index}
                      onClick={() => {
                        setCurrentChatHistory(data[1]?.messages);
                        setActiveCurrentChatHistory("yesterday" + index);
                      }}
                    >
                      <div
                        className="time"
                        style={{ padding: 0, fontSize: "14px" }}
                      >
                        <div>
                          {data[1]?.email ? data[1]?.email : "Anonymous"}
                        </div>
                        <div>{getTimeAgo(data[1].sessionStartDate)}</div>
                      </div>

                      <div>
                        {
                          data[1]?.messages[
                            data[1]?.initialMessageLength
                              ? data[1]?.initialMessageLength
                              : 1
                          ]?.content
                        }
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div> */}
            {/*------------------------------------------last-7-days-chat----------------------------------------------*/}
            {/* <div className="detail">
          {chatHistoryList?.lastSevenDay?.chats && (
            <>
              <div className="time">Last 7 days</div>
              {Object.entries(chatHistoryList?.lastSevenDay?.chats)
                ?.reverse()
                ?.map((data: any, index: any) => {
                  return (
                    <div
                      className={`first-message ${
                        activeCurrentChatHistory === `lastSevenDay${index}`
                          ? "active"
                          : ""
                      }`}
                      key={index}
                      onClick={() => {
                        setCurrentChatHistory(data[1]?.messages);
                        setActiveCurrentChatHistory("lastSevenDay" + index);
                      }}
                    >
                      {
                        data[1]?.messages[
                          data[1]?.initialMessageLength
                            ? data[1]?.initialMessageLength
                            : 1
                        ]?.content
                      }
                    </div>
                  );
                })}
            </>
          )}
        </div> */}
          </div>
          {/* this is used for printing the chats initially it will be hidden but on print it will be visible*/}
          <PrintingChats
            ref={tempRef}
            messages={currentChatHistory}
            // messagesTime={messagesTime}
          />
          {/*------------------------------------------right-section----------------------------------------------*/}

          <div
            className="message-section-wrapper"
            style={{
              display:
                window.innerWidth > 767 || chatClicked ? "block" : "none",
            }}
          >
            <div className="messages-section">
              <div
                className="header"
                style={{
                  visibility:
                    currentChatHistory?.length != 0 ? "visible" : "hidden",
                }}
              >
                <p style={{ color: "#777e90" }}>{displayEmail}</p>
                <div className="action-btns">
                  <ReactToPrint
                    trigger={() => {
                      return (
                        <button style={{ border: "none", background: "none" }}>
                          <Image src={exportBtn} alt="export-btn" />
                        </button>
                      );
                    }}
                    content={() => tempRef.current}
                  />
                  {window.innerWidth < 768 && (
                    <Image
                      src={closeImage}
                      alt="close-icon"
                      onClick={() => setIsChatClicked(false)}
                    />
                  )}
                </div>
              </div>
              <hr
                style={{
                  visibility:
                    currentChatHistory?.length != 0 ? "visible" : "hidden",
                }}
              />

              <div className="history-conversation-container">
                {currentChatHistory.map((message: any, index: any) => {
                  if (message.role == "assistant")
                    return (
                      <React.Fragment key={index}>
                        <div
                          className="assistant-message-container"
                          style={{
                            marginTop:
                              `${message.messageType}` === "initial"
                                ? "10px"
                                : "0",
                          }}
                        >
                          <div
                            className="assistant-message"
                            style={{
                              display: "flex",
                              flexDirection: "column",
                            }}
                            dangerouslySetInnerHTML={{
                              __html: message.content,
                            }}
                          ></div>
                          {/* <div className="time">{message?.messageTime}</div> */}
                          {message.messageType !== "initial" && (
                            <div className="time">{message?.messageTime}</div>
                          )}

                          {(currentChatHistory[index + 1] === undefined ||
                            currentChatHistory[index + 1].role == "user") && (
                            <div className="like-dislike-container">
                              <Image
                                src={likeIcon}
                                alt="like-icon"
                                onClick={() => openChatbotModal(index, "like")}
                              />
                              <Image
                                src={dislikeIcon}
                                alt="dislike-icon"
                                onClick={() =>
                                  openChatbotModal(index, "dislike")
                                }
                              />
                            </div>
                          )}
                          {/* <div className="like-dislike-container">
                      <Image
                        src={likeIcon}
                        alt="like-icon"
                        onClick={() => openChatbotModal(index, "like")}
                      />
                      <Image
                        src={dislikeIcon}
                        alt="dislike-icon"
                        onClick={() => openChatbotModal(index, "dislike")}
                      />
                    </div> */}
                        </div>
                        <ChatbotNameModal
                          open={open}
                          setOpen={setOpen}
                          chatbotText={feedbackText}
                          setChatbotText={setfeedbackText}
                          handleOk={handleOk}
                          forWhat="feedback"
                        />
                      </React.Fragment>
                    );
                  else
                    return (
                      <div className="user-message-container">
                        <div
                          className="user-message"
                          key={index}
                          style={{
                            backgroundColor: botSettings?.userMessageColor,
                          }}
                        >
                          {message.content}
                        </div>
                        <div className="time">{message?.messageTime}</div>
                      </div>
                    );
                })}
              </div>

              <div
                className="footer"
                style={{
                  visibility:
                    currentChatHistory?.length != 0 ? "visible" : "hidden",
                }}
              >
                <p>Powered by Torri.AI</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {chatHistoryList?.length == 0 && (
        <div className="empty-history">
          <Image src={noHistory} alt="no-data"></Image>
          <p style={{ textAlign: "center" }}>No chat history found</p>
        </div>
      )}
    </div>
  );
}

export default History;
