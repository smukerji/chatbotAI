import React, { useEffect, useState } from "react";
import "./settings.css";
import { Radio, RadioChangeEvent } from "antd";
import { useCookies } from "react-cookie";

function Settings({ chatbotId }: any) {
  const [cookies, setCookies] = useCookies(["userId"]);

  const onChange = (e: RadioChangeEvent) => {
    setSource(e.target.value);
  };

  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    /// retrive the chatbot data
    const retriveData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/setting/api`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatbotId: chatbotId,
            userId: cookies?.userId,
          }),
          // next: { revalidate: 0 },
        }
      );
      const content = await response.json();
      setChatHistory(content?.chatHistory);
    };

    retriveData();
  }, []);

  /// state to store the state of the current active list
  const [source, setSource] = useState("general");

  return (
    <div className="settings-container">
      <div className="left">
        {/* ----------------- list of settigs ------------------ */}
        <Radio.Group onChange={onChange} value={source}>
          <Radio name="source" value={"general"}>
            General
          </Radio>
          <Radio name="source" value={"chatbot-settings"}>
            Chatbot Settings
          </Radio>
          <Radio name="source" value={"embed"}>
            Embed on site
          </Radio>
          <Radio name="source" value={"integration"}>
            Integrations
          </Radio>
          <Radio name="source" value={"chat-history"}>
            Chat History
          </Radio>
        </Radio.Group>
      </div>

      <div className="right">
        {source === "embed" && (
          <>
            <div
              style={{
                textAlign: "start",
                wordBreak: "break-word",
                padding: "10px",
              }}
            >
              {`<script
                    src="${process.env.NEXT_PUBLIC_WEBSITE_URL}embed-bot.js"
                    chatbotID=${chatbotId}
                    ></script>`}
            </div>
          </>
        )}

        {source === "chat-history" && (
          <>
            {Object.entries(chatHistory).map((data: any, index) => {
              return (
                <React.Fragment key={index}>
                  <div className="session-data-container">
                    <div className="customer-message">
                      Customer: {data[1]?.messages[1]?.content}
                    </div>
                    <div className="bot-message">
                      Bot:&nbsp;
                      <span
                        dangerouslySetInnerHTML={{
                          __html: data[1]?.messages[2]?.content,
                        }}
                      ></span>
                    </div>

                    {/* {data[1]?.messages[1]?.content} */}
                  </div>
                </React.Fragment>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export default Settings;
