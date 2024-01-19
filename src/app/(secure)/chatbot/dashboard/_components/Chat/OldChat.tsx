import React, { Suspense, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import "./chat.css";
import { DislikeOutlined, SendOutlined, LikeOutlined } from "@ant-design/icons";
import Image from "next/image";
import { message } from "antd";
import ChatbotNameModal from "../../../../../_components/Modal/ChatbotNameModal";
import { getDate, getTime } from "../../../../../_helpers/client/getTime";

function Chat({
  chatbot,
  messages,
  setMessages,
  messagesTime,
  setMessagesTime,
  sessionID,
  sessionStartDate,
}: any) {
  const [cookies, setCookies] = useCookies(["userId"]);

  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  /// chat base response
  const [response, setResponse] = useState("");

  /// loading state
  const [loading, setLoading] = useState(false);

  const chatWindowRef: any = useRef(null);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

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
          chatbotId: chatbot.id,
          messages: [...messages.slice(0, feedbackIndex + 1)],
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
    message.success(body?.message);
  };

  /// Messages feedback opener
  async function openChatbotModal(index: number, status: string) {
    /// set the like/dislike btn check and the index to store the message history
    setFeedbackIndex(index);
    setfeedbackStatus(status);
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  useEffect(() => {
    if (chatWindowRef.current) {
      // Scroll to the bottom of the chat window
      setTimeout(() => {
        chatWindowRef.current?.scrollTo(0, chatWindowRef.current.scrollHeight);
      }, 50);
    }
  }, [response]);

  useEffect(() => {
    const storeHistory = async () => {
      /// store/update the chathistory
      const store = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chathistory`,
        {
          method: "POST",
          body: JSON.stringify({
            chatbotId: chatbot.id,
            messages: messagesTime,
            userId: cookies.userId,
            sessionID,
            sessionStartDate,
            sessionEndDate: getDate(),
          }),
        }
      );
    };

    /// check if assistant replied with the user message then only store the data
    const conversationLength = messages.length;
    if (conversationLength > 1 && conversationLength & 1) storeHistory();
  }, [messages]);

  /// get the chatbase response
  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      if (userQuery.trim() == "") {
        alert("Please enter the message");
      } else {
        /// clear the response
        setUserQuery("");
        /// set the user query
        setMessages((prev: any) => [
          ...prev,
          { role: "user", content: userQuery },
        ]);
        setMessagesTime((prev: any) => [
          ...prev,
          { role: "user", content: userQuery, messageTime: getTime() },
        ]);
        try {
          setLoading(true);
          /// get similarity search
          const response: any = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
            {
              method: "POST",
              body: JSON.stringify({
                userQuery,
                chatbotId: chatbot?.id,
                // userId: cookies.userId,
                //// default chatbot set
                userId:
                  chatbot?.id === "123d148a-be02-4749-a612-65be9d96266c"
                    ? "651d111b8158397ebd0e65fb"
                    : chatbot?.id === "34cceb84-07b9-4b3e-ad6f-567a1c8f3557"
                    ? "65795294269d08529b8cd743"
                    : chatbot?.id === "f0893732-3302-46b2-922a-95e79ef3524c"
                    ? "651d111b8158397ebd0e65fb"
                    : cookies.userId,
              }),
            }
          );

          /// parse the response and extract the similarity results
          const respText = await response.text();

          const similaritySearchResults = JSON.parse(respText).join("\n");
          console.log(similaritySearchResults);

          /// get response from backend in streaming
          const responseFromBackend: any = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chat`,
            {
              method: "POST",
              body: JSON.stringify({
                similaritySearchResults,
                messages,
                userQuery,
              }),
            }
          );
          let resptext = "";
          const reader = responseFromBackend.body
            .pipeThrough(new TextDecoderStream())
            .getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              /// setting the response when completed
              setMessages((prev: any) => [
                ...prev,
                { role: "assistant", content: resptext },
              ]);
              /// setting the response time when completed
              setMessagesTime((prev: any) => [
                ...prev,
                {
                  role: "assistant",
                  content: resptext,
                  messageTime: getTime(),
                },
              ]);
              // if (!store.ok) {
              //   alert(await store.text());
              // }
              setResponse("");
              setLoading(false);
              break;
            }

            resptext += value;
            setResponse(resptext);
          }

          // // Fetch the response from the OpenAI API
          // const responseOpenAI: any = await fetch(
          //   "https://api.openai.com/v1/chat/completions",
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //       Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_KEY}`,
          //     },
          //     body: JSON.stringify({
          //       model: "gpt-3.5-turbo-16k",
          //       temperature: 0,
          //       top_p: 1,
          //       messages: [
          //         {
          //           role: "system",
          //           content: `Use the following pieces of context to answer the users question.
          //           If you don't know the answer, just say that you don't know, don't try to make up an answer.
          //           ----------------
          //           context:
          //           ${similaritySearchResults}

          //           Answer user query and include images write respect to each line if available`,
          //         },
          //         ...messages,
          //         {
          //           role: "user",
          //           content: `
          //             Strictly write all the response in html format with only raw text and img tags.
          //             Answer user query and include images in response if available in the given context

          //             query: ${userQuery}`,
          //         },
          //       ],
          //       stream: true,
          //     }),
          //   }
          // );

          // console.log(similaritySearchResults);

          // let resptext = "";
          // const reader = responseOpenAI.body.getReader();
          // const decoder = new TextDecoder("utf-8");

          // while (true) {
          //   const { done, value } = await reader.read();
          //   if (done) {
          //     /// setting the response when completed
          //     setMessages((prev: any) => [
          //       ...prev,
          //       { role: "assistant", content: resptext },
          //     ]);
          //     /// store the chathistory
          //     setResponse("");
          //     //   setLoading(false);
          //     //   const store = await fetch(
          //     //     `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/chathistory`,
          //     //     {
          //     //       method: "POST",
          //     //       body: JSON.stringify({
          //     //         chatHistory: messages,
          //     //         chatbotId: chatbot.id,
          //     //       }),
          //     //     }
          //     //   );

          //     //   if (!store.ok) {
          //     //     alert(await store.text());
          //     //   }
          //     break;
          //   }
          //   // Massage and parse the chunk of data
          //   const chunk = decoder.decode(value);
          //   const lines = chunk.split("\n");
          //   const parsedLines = lines
          //     .map((line) => line.replace(/^data: /, "").trim()) // Remove the "data: " prefix
          //     .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
          //     .map((line, index) => JSON.parse(line)); // Parse the JSON string

          //   for (const parsedLine of parsedLines) {
          //     const { choices } = parsedLine;
          //     const { delta } = choices[0];
          //     const { content } = delta;
          //     // Update the UI with the new content
          //     if (content) {
          //       resptext += content;
          //       setResponse(resptext);
          //     }
          //   }
          // }
          // console.log("Response.", model.data);
        } catch (e: any) {
          console.log(
            "Error while getting completion from custom chatbot",
            e,
            e.message
          );
        } finally {
          setLoading(false);
        }
      }
    }
    // }
  }

  // console.log(messageImages);

  return (
    <div className="chat-container">
      <div className="conversation-container" ref={chatWindowRef}>
        {messages.map((message: any, index: any) => {
          if (message.role == "assistant")
            return (
              <React.Fragment key={index}>
                <div className="assistant-message-container">
                  <div
                    className="assistant-message"
                    style={{ display: "flex", flexDirection: "column" }}
                    dangerouslySetInnerHTML={{
                      __html: message.content,
                    }}
                  ></div>
                  <div className="time">{messagesTime[index]?.messageTime}</div>
                  <div className="like-dislike-container">
                    <LikeOutlined
                      onClick={() => openChatbotModal(index, "like")}
                    />
                    <DislikeOutlined
                      onClick={() => openChatbotModal(index, "dislike")}
                    />
                  </div>
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
                <div className="user-message" key={index}>
                  {message.content}
                </div>
                <div className="time">{messagesTime[index]?.messageTime}</div>
              </div>
            );
        })}
        {loading && response.length == 0 && (
          <div className="assistant-message-container">
            <div className="assistant-message">
              <div className="typing-indicator">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          </div>
        )}
        {response && (
          <div className="assistant-message-container">
            <div
              className="assistant-message"
              style={{ display: "flex", flexDirection: "column" }}
              dangerouslySetInnerHTML={{ __html: response }}
            />
          </div>
        )}
      </div>
      <div className="chat-question">
        <input
          type="text"
          onKeyDown={getReply}
          onChange={(event) => {
            setUserQuery(event.target.value);
          }}
          value={userQuery}
        />
        <SendOutlined className="icon" onClick={() => getReply("click")} />
      </div>
      <center>Powered by Lucifer.AI</center>
    </div>
  );
}

export default Chat;
