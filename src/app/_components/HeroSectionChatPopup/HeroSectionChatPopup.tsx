"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import RefreshIcon from "../../../../public/svgs/refreshbtn.svg";
import CallIcon from "../../../../public/voiceBot/SVG/call-outgoing.svg";
import CloseIcon from "../../../../public/svgs/close-circle.svg";
import SendIcon from "../../../../public/svgs/send-3.svg";
import "./hero-section-chat-popup.scss";
import { getDate } from "@/app/_helpers/client/getTime";
import { message } from "antd";
import { AssistantStream } from "openai/lib/AssistantStream.mjs";
import { AssistantStreamEvent } from "openai/resources/beta/assistants.mjs";
import { functionCallHandler } from "@/app/_helpers/client/functionCallHandler";
import VapiAssistantCall from "./VapiCall/VapiAssistantCall";
import JessicaImg from "../../../../public/sections-images/header-background/jessica.png";
import DavidImg from "../../../../public/sections-images/header-background/david.png";

function HeroSectionChatPopup({ onClose, agent }: any) {
  const [messages, setMessages]: any = useState([]);
  const [userMessage, setUserMessage] = useState("");
  /// chat base response
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [messagesTime, setMessagesTime]: any = useState([]);
  const [sessionStartDate, setSessionStartDate]: any = useState();
  const torriAssistantId: any = process.env.NEXT_PUBLIC_TORRI_ASSISTANT_ID;
  const [threadId, setThreadId] = useState();
  const chatWindowRef: any = useRef(null);
  const inputRef: any = useRef(null);
  const messageLimit = process.env.NEXT_PUBLIC_MESSAGE_LIMIT;

  const createThread = async () => {
    const res = await fetch(`/api/assistants/threads`, {
      method: "POST",
    });
    const data = await res.json();
    setThreadId(data.threadId);
  };

  /// handle the user message stream
  const handleReadableStream = (stream: AssistantStream) => {
    // messages
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);

    // // image
    // stream.on("imageFileDone", handleImageFileDone);

    // // code interpreter
    // stream.on("toolCallCreated", toolCallCreated);
    // stream.on("toolCallDelta", toolCallDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on("event", (event) => {
      if (event.event === "thread.run.requires_action")
        handleRequiresAction(event);
      if (event.event === "thread.run.completed") {
        /// setting the response time when completed
        setMessagesTime((prev: any) => {
          return [...prev];
        });
      }
    });
  };

  // handleRequiresAction - handle function call
  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls: any =
      event?.data?.required_action?.submit_tool_outputs.tool_calls;

    // loop over tool calls and call function handler
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall: any) => {
        const result = await functionCallHandler(
          toolCall,
          torriAssistantId,
          "",
          messages,
          false
        );
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    // setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  const submitActionResult = async (runId: any, toolCallOutputs: any) => {
    const response: any = await fetch(
      `/api/assistants/threads/${threadId}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: runId,
          toolCallOutputs: toolCallOutputs,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  // textCreated - create new assistant message
  const handleTextCreated = () => {
    setLoading(false);
    appendMessage("assistant", "");
  };

  // textDelta - append text to last assistant message
  const handleTextDelta = (delta: any) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
    if (delta.annotations != null) {
      annotateLastMessage(delta.annotations);
    }
  };
  /// append the message
  const appendMessage = (role: string, text: string) => {
    setMessages((prevMessages: [{ role: string; content: string }]) => [
      ...prevMessages,
      { role, content: text },
    ]);
    /// setting the response time when completed
    setMessagesTime((prev: any) => [
      ...prev,
      {
        role,
        content: text,
        messageTime: getDate(),
      },
    ]);
  };

  const appendToLastMessage = (text: string) => {
    setMessages((prevMessages: [{ role: string; content: string }]) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        content: lastMessage.content + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
    0;

    /// setting the response time when completed
    setMessagesTime((prev: any) => {
      const lastMessage = prev[prev.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        content: lastMessage.content + text,
      };
      return [...prev.slice(0, -1), updatedLastMessage];
    });
  };

  const annotateLastMessage = (annotations: any) => {
    setMessages((prevMessages: any) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
      };
      annotations.forEach((annotation: any) => {
        if (annotation.type === "file_path") {
          updatedLastMessage.content = updatedLastMessage.content.replaceAll(
            annotation.text,
            `/api/files/${annotation.file_path.file_id}`
          );
        }
      });
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  /// send the user message
  const sendMessage = async (text: string) => {
    const response: any = await fetch(
      `/api/assistants/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content: text,
          assistantId: torriAssistantId,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  /// refresh the chat window
  const refreshChat = () => {
    createThread();
    setMessages([]);
    setMessagesTime([]);

    setSessionStartDate(getDate());
  };

  /// get the chatbase response
  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      if (userMessage.trim() == "") {
        message.error("Please enter the message");
        return;
      }
      // Get the message count from localStorage
      let messageCount = parseInt(
        localStorage.getItem("messageCount") || "0",
        10
      );
      if (Number(messageCount) >= Number(messageLimit)) {
        message.error("Message limit reached. Upgrade to continue.");
        return;
      }

      setLoading(true);
      const tempUserMessageTime = getDate();
      /// clear the response
      setUserMessage("");
      /// set the user query
      setMessages((prev: any) => [
        ...prev,
        { role: "user", content: userMessage },
      ]);
      setMessagesTime((prev: any) => [
        ...prev,
        {
          role: "user",
          content: userMessage,
          messageTime: tempUserMessageTime,
        },
      ]);

      try {
        await sendMessage(userMessage);

        // Increment and store the new count in localStorage
        localStorage.setItem("messageCount", (messageCount + 1).toString());
      } catch (e: any) {
        console.log(
          "Error while getting completion from custom chatbot",
          e,
          e.message
        );
        setLoading(false);
      }
    }
    // }
  }

  const handleClose = () => {
    refreshChat();
    onClose();
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      // Scroll to the bottom of the chat window
      setTimeout(() => {
        chatWindowRef.current?.scrollTo(0, chatWindowRef.current.scrollHeight);
      }, 50);
    }
  }, [response, messages, loading]);

  useEffect(() => {
    const createNewThread = async () => {
      try {
        await createThread();
        inputRef.current.focus();
      } catch (error) {
        console.log("Error while creating new thread", error);
      }
    };
    createNewThread();
    // const handleFirstMessage = async () => {
    //   if (firstMessage) {
    //     setLoading(true);
    //     const tempUserMessageTime = getDate();

    //     setMessages((prev: any) => [
    //       ...prev,
    //       { role: "user", content: firstMessage },
    //     ]);
    //     setMessagesTime((prev: any) => [
    //       ...prev,
    //       {
    //         role: "user",
    //         content: firstMessage,
    //         messageTime: tempUserMessageTime,
    //       },
    //     ]);

    //     try {
    //       await sendMessage(firstMessage);
    //     } catch (e: any) {
    //       console.log(
    //         "Error while getting completion from custom chatbot",
    //         e,
    //         e.message
    //       );
    //     }
    //   }
    // };

    // handleFirstMessage();
  }, []);

  return (
    <div className={"chatPopup"}>
      {/* <div className={"chatHeader"}>
        <div>
          <button onClick={() => handleClose()} className={"closeButton"}>
            <Image src={CloseIcon} alt="Close" />
          </button>
        </div>

        <div className="headerRight">
          <button className={"refreshButton"} onClick={refreshChat}>
            <Image src={RefreshIcon} alt="Refresh" />
          </button>
          <VapiAssistantCall setMessages={setMessages} setMessagesTime={setMessagesTime} timeoutSeconds={10} 
          />
        </div>
      </div> */}

      <div className={"conversation-container "} ref={chatWindowRef}>
        {messages.map((message: any, index: any) => {
          if (message.role == "assistant")
            return (
              <React.Fragment key={index}>
                <div
                  className="assistant-message-container"
                  style={{
                    marginTop:
                      `${messagesTime[index]?.messageType}` === "initial"
                        ? "10px"
                        : "0",

                    position:
                      messagesTime[index]?.messageType === "initial"
                        ? "unset"
                        : "relative",
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
                  {/* {messagesTime[index]?.messageType !== "initial" && (
                    <div className="time">
                      {messagesTime[index]?.messageTime}
                    </div>
                  )} */}
                  <Image
                    src={agent === "jessica" ? JessicaImg : DavidImg}
                    alt="user"
                    className="user-icon"
                  />
                </div>
              </React.Fragment>
            );
          else
            return (
              <div className="user-message-container">
                <div
                  className="user-message"
                  key={index}
                  // style={{
                  //   backgroundColor: botSettings?.userMessageColor
                  //     ? botSettings?.userMessageColor
                  //     : userMessageColor,
                  // }}
                >
                  {message.content}
                </div>
                {/* <div className="time">{messagesTime[index]?.messageTime}</div> */}
              </div>
            );
        })}
        {response && (
          <div className="assistant-message-container">
            <div
              className="assistant-message"
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#353945",
                color: "#FCFCFD",
              }}
              dangerouslySetInnerHTML={{
                __html: response.concat("<b> |</b>"),
              }}
            />
          </div>
        )}
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
      </div>

      <div className={"chatFooter"}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter your message"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyDown={getReply}
        />
        <button onClick={() => getReply("click")}>
          <Image src={SendIcon} alt="Send" />
        </button>
      </div>
    </div>
  );
}

export default HeroSectionChatPopup;
