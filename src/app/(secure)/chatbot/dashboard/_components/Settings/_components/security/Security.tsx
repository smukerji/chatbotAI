import React, { useContext } from "react";
import "./security.scss";
import { Switch, message } from "antd";
import { useCookies } from "react-cookie";
import { ChatbotSettingContext } from "@/app/_helpers/client/Context/ChatbotSettingContext";
import {
  defaultBotVisibility,
  defaultRateLimit,
  defaultRateLimitMessage,
  defaultRateLimitTime,
} from "@/app/_helpers/constant";

function Security({ chatbotId }: any) {
  const [cookies, setCookies] = useCookies(["userId"]);

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
    botSettingContext?.handleChange("allowIframe")(checked);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/setting/api`,
        {
          method: "PUT",
          body: JSON.stringify({
            chatbotId: chatbotId,
            userId: cookies?.userId,
            botVisibility: botSettings?.botVisibility
              ? botSettings?.botVisibility
              : defaultBotVisibility,
            allowIframe: botSettings?.allowIframe
              ? botSettings?.allowIframe
              : false,
            rateLimit: botSettings?.rateLimit
              ? botSettings?.rateLimit
              : defaultRateLimit,
            rateLimitTime: botSettings?.rateLimitTime
              ? botSettings?.rateLimitTime
              : defaultRateLimitTime,
            rateLimitMessage: botSettings?.rateLimitMessage
              ? botSettings?.rateLimitMessage
              : defaultRateLimitMessage,
          }),
          next: { revalidate: 0 },
        }
      );
      if (!res.ok) {
        throw await res.json();
      }
      /// displaying status
      const data = await res.json();

      message.success(data?.message);
    } catch (error: any) {
      message.error(error?.message);
    }
  };
  return (
    <div className="security-container">
      <div className="security-top-section">
        <div className="visibility-container">
          <p className="visiblity-container-heading">Visibilty</p>
          <select
            className="visibility-container-input-box"
            value={
              botSettings?.botVisibility
                ? botSettings?.botVisibility
                : defaultBotVisibility
            }
            onChange={(e) => {
              botSettingContext?.handleChange("botVisibility")(e.target.value);
            }}
          >
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
          <p className="visibility-container-para">
            <span>
              &apos;private&apos;: No one can access your chatbot except you
              (your account)
            </span>
            <br />
            <span>
              &apos;public&apos;: Other people can chat with your chatbot if you
              send them the link. You can also embed it on your website so your
              website visitors are able to use it.
            </span>
          </p>
        </div>
        <div className="horizontal-line">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="747"
            height="2"
            viewBox="0 0 747 2"
            fill="none"
          >
            <path d="M0 1H747" stroke="#E6E8EC" />
          </svg>
        </div>
        <div className="switch-container">
          <p className="switch-text">
            Only allow the iframe and widget on specific domains
          </p>
          <div className="switch">
            <Switch
              onChange={onChange}
              value={
                botSettings?.allowIframe ? botSettings?.allowIframe : false
              }
            />
          </div>
        </div>
        <div className="horizontal-line">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="747"
            height="2"
            viewBox="0 0 747 2"
            fill="none"
          >
            <path d="M0 1H747" stroke="#E6E8EC" />
          </svg>
        </div>
        <div className="rating-container">
          <p className="rating-title">Rate Limiting</p>
          <p className="rating-desc">
            Limit the number of messages sent from one device on the Torri and
            chat bubble (this limit will not be applied to you on torri.ai, only
            on your website for your users to prevent abuse).
          </p>
          <div className="rating-bottom">
            <p className="rating-limit">Limit to only</p>
            <input
              type="number"
              value={botSettings?.rateLimit}
              onChange={(e) =>
                botSettingContext?.handleChange("rateLimit")(e.target.value)
              }
              defaultValue={defaultRateLimit}
            />
            <p className="rating-msg">Message every</p>
            <input
              type="number"
              value={botSettings?.rateLimitTime}
              onChange={(e) =>
                botSettingContext?.handleChange("rateLimitTime")(e.target.value)
              }
              defaultValue={defaultRateLimitTime}
            />
            <p className="rating-seconds">Seconds.</p>
          </div>
        </div>
        <div className="horizontal-line">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="747"
            height="2"
            viewBox="0 0 747 2"
            fill="none"
          >
            <path d="M0 1H747" stroke="#E6E8EC" />
          </svg>
        </div>
        <div className="limit-container">
          <p className="limit-title">
            Show this message to show when limit is hit
          </p>
          <input
            type="text"
            value={botSettings?.rateLimitMessage}
            defaultValue={defaultRateLimitMessage}
            onChange={(e) =>
              botSettingContext?.handleChange("rateLimitMessage")(
                e.target.value
              )
            }
          />
        </div>
      </div>
      <button className="btn" onClick={handleSave}>
        <p>Save</p>
      </button>
    </div>
  );
}

export default Security;
