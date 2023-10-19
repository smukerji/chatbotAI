import React, { useState } from "react";
import "./settings.css";
import { Radio, RadioChangeEvent } from "antd";

function Settings({ chatbotId }: any) {
  const onChange = (e: RadioChangeEvent) => {
    setSource(e.target.value);
  };

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
      </div>
    </div>
  );
}

export default Settings;
