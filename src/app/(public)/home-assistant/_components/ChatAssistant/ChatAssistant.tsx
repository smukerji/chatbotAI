"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, message } from "antd";
import MicrophoneIcon from "../../../../../../public/svgs/microphone.svg";
import "./chat-assistant.scss";
import axios from "axios";
import { AssistantStream } from "openai/lib/AssistantStream.mjs";
import { AssistantStreamEvent } from "openai/resources/beta/assistants.mjs";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs.mjs";

const ChatAssistant = () => {
  const chatWindowRef: any = useRef(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any>([]);
  const [threadId, setThreadId] = useState();
  const [inputDisabled, setInputDisabled] = useState(false);
  /// storing the input value
  const [userQuery, setUserQuery] = useState("");

  /// chat base response
  const [response, setResponse] = useState("");

  const scrollToBottom = () => {
    chatWindowRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /*
    =======================
    === Utility Helpers ===
    =======================
  */

  const appendToLastMessage = (text: string) => {
    setMessages((prevMessages: any) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        text: lastMessage.text + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const appendMessage = (role: any, text: any) => {
    setMessages((prevMessages: any) => [...prevMessages, { role, text }]);
  };

  const annotateLastMessage = (annotations: any) => {
    setMessages((prevMessages: any) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
      };
      annotations.forEach((annotation: any) => {
        if (annotation.type === "file_path") {
          updatedLastMessage.text = updatedLastMessage.text.replaceAll(
            annotation.text,
            `/api/files/${annotation.file_path.file_id}`
          );
        }
      });
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const functionCallHandler = async (
    call: RequiredActionFunctionToolCall
  ) => {};

  const submitActionResult = async (runId: any, toolCallOutputs: any) => {
    const response: any = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/assistant/thread/action`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: runId,
          toolCallOutputs: toolCallOutputs,
          threadId: threadId,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  //   handleRequiresAction - handle function call
  const handleRequiresAction = async (event: any) => {
    const runId = event.data.id;
    const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
    // loop over tool calls and call function handler
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall: any) => {
        const result = await functionCallHandler(toolCall);
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    submitActionResult(runId, toolCallOutputs);
  };

  // handleRunCompleted - re-enable the input form
  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  /* Stream Event Handlers */

  // textCreated - create new assistant message
  const handleTextCreated = () => {
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

  const handleReadableStream = (stream: AssistantStream) => {
    // messages
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on("event", (event) => {
      if (event.event === "thread.run.requires_action")
        handleRequiresAction(event);
      if (event.event === "thread.run.completed") handleRunCompleted();
    });
  };

  const sendMessage = async (text: string) => {
    try {
      setLoading(true);
      const response: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/assistant/message`,
        {
          method: "POST",
          body: JSON.stringify({
            message: text,
            threadId: threadId,
          }),
        }
      );
      const stream = AssistantStream.fromReadableStream(response.body);
      handleReadableStream(stream);
    } catch (error) {
      console.log("error", error);
    } finally {
      setInputDisabled(false);
      setLoading(false);
    }
  };

  /// get the chatbase response
  async function getReply(event: any) {
    if (event.key === "Enter" || event === "click") {
      if (userQuery.trim() == "") {
        message.error("Please enter the message");
        return;
      }

      setInputDisabled(true);
      sendMessage(userQuery);
      setMessages((prevMessages: any) => [
        ...prevMessages,
        { role: "user", text: userQuery },
      ]);
      setUserQuery("");
      scrollToBottom();
    }
  }

  const createThread = async () => {
    try {
      setInputDisabled(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/assistant/thread`
      );

      console.log("responsee", response.data.thread);
      setThreadId(response.data.thread.id);
      setInputDisabled(false);
    } catch (error) {
      console.log("error", error);
      setInputDisabled(false);
    }
  };

  useEffect(() => {
    createThread();
  }, []);

  console.log("messages", messages);

  return (
    <>
      <div className="chat-wrapper">
        <div className={`messages-section`}>
          <div className={`conversation-container`} ref={chatWindowRef}>
            {messages.map((message: any, index: any) => {
              if (message.role == "assistant")
                return (
                  <React.Fragment key={index}>
                    <div className="assistant-message-container">
                      <div
                        className="assistant-message"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: message.text,
                        }}
                      ></div>
                    </div>
                  </React.Fragment>
                );
              else
                return (
                  <div className="user-message-container">
                    <div className="user-message" key={index}>
                      {message.text}
                    </div>
                  </div>
                );
            })}

            {loading && (
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: response.concat("<b> |</b>"),
                  }}
                />
              </div>
            )}
          </div>
          {/* <div className="suggested-messages">
            {suggestedMessages?.map((message: any, index: any) => {
              return (
                <div
                  className="message"
                  key={index}
                  onClick={() => setUserQuery(message)}
                >
                  {message}
                </div>
              );
            })}
            {botSettings?.suggestedMessages?.map((message: any, index: any) => {
              return (
                <div
                  className="message"
                  key={index}
                  onClick={() => setUserQuery(message)}
                >
                  {message}
                </div>
              );
            })}
          </div> */}

          <div className="chat-question">
            <input
              type="text"
              placeholder="Enter your message"
              onKeyDown={getReply}
              onChange={(event) => {
                setUserQuery(event.target.value);
              }}
              value={userQuery}
              disabled={inputDisabled}
            />
            <button
              className="icon"
              onClick={() => getReply("click")}
              disabled={loading ? true : false}
            >
              <Image src={MicrophoneIcon} alt="send-chat-icon" />
              Talk with Tina
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatAssistant;
