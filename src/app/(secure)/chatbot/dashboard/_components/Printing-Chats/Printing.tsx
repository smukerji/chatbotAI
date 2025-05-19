import React, { Ref, useContext, useRef } from "react";
import { ChatbotSettingContext } from "../../../../../_helpers/client/Context/ChatbotSettingContext";
import MarkdownPreview from "@uiw/react-markdown-preview";
const PrintingChats = React.forwardRef(
  (props: any, ref: Ref<HTMLDivElement>) => {
    const { messages, messagesTime } = props;

    /// get the bot settings context
    const botSettingContext: any = useContext(ChatbotSettingContext);
    const botSettings = botSettingContext?.chatbotSettings;

    return (
      <div className="printing" ref={ref}>
        {messages.map((message: any, index: any) => {
          if (message.role == "assistant")
            return (
              <React.Fragment key={index}>
                <div
                  className="assistant-message-container"
                  style={{
                    marginTop:
                      `${
                        messagesTime?.[index]?.messageType
                          ? messagesTime?.[index]?.messageType
                          : message.messageType
                      }` === "initial"
                        ? "10px"
                        : "0",
                  }}
                >
                  {/* <div
                    className="assistant-message"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor:
                        botSettings?.theme === "dark" ? "#353945" : "",
                      color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                    }}
                    // dangerouslySetInnerHTML={{
                    //   __html: message.content,
                    // }}
                  > */}
                  <MarkdownPreview
                    source={message.content}
                    // className="assistant-message"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      backgroundColor:
                        botSettings?.theme === "dark" ? "#353945" : "",
                      color: botSettings?.theme === "dark" ? "#FCFCFD" : "",
                    }}
                    // style={{ padding: 16 }}
                  />
                  {/* </div> */}
                  {messagesTime?.[index]?.messageType
                    ? messagesTime?.[index]?.messageType !== "initial"
                    : message.messageType !== "initial" && (
                        <div className="time">
                          {messagesTime?.[index]?.messageTime
                            ? messagesTime?.[index]?.messageTime
                            : message?.messageTime}
                        </div>
                      )}
                  {/* 
                  {(messages[index + 1] === undefined ||
                    messages[index + 1].role == "user") && (
                    
                  )} */}
                </div>
              </React.Fragment>
            );
          else
            return (
              <div className="user-message-container">
                <div
                  className="user-message"
                  key={index}
                  style={{ backgroundColor: botSettings?.userMessageColor }}
                >
                  {message.content}
                </div>
                <div className="time">
                  {messagesTime?.[index]?.messageTime
                    ? messagesTime?.[index]?.messageTime
                    : message?.messageTime}
                </div>
              </div>
            );
        })}
      </div>
    );
  }
);

PrintingChats.displayName = "PrintingChats";

export { PrintingChats };
