import React, { useContext, useEffect, useState } from "react";
import "./../model/model.scss";
import { Select, Slider, message } from "antd";
import DocumentIcon from "@/assets/svg/DocumentIcon";
import { useCookies } from "react-cookie";
import { ChatbotSettingContext } from "../../../../../../../_helpers/client/Context/ChatbotSettingContext";

function OpenRouterModels({ chatbotId }: any) {
  const [cookies, setCookie] = useCookies(["userId"]);

  const [openRouterModels, setOpenRouterModels] = useState<any>([]);

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  const updateSettings = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/setting/api`,
      {
        method: "PUT",
        body: JSON.stringify({
          chatbotId: chatbotId,
          userId: cookies?.userId,
          temperature: botSettings?.temperature,
          instruction: botSettings?.instruction,
          model: botSettings?.model,
        }),
        next: { revalidate: 0 },
      }
    );
    /// displaying status
    const data = await res.json();

    message.success(data?.message);
  };

  /// fetch open router models
  useEffect(() => {
    const fetchOpenRouterModels = async () => {
      try {
        const res = await fetch(
          `https://openrouter.ai/api/v1/models?supported_parameters=tools`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies?.userId}`,
            },
          }
        );
        const data = await res.json();

        // Convert model IDs into Select-compatible format
        const modelOptions =
          data?.data?.map((model: any) => ({
            value: model.id,
            label: model.id,
          })) || [];

        console.log("OpenRouter models", modelOptions.length);

        // Store in state
        setOpenRouterModels(modelOptions);
      } catch (error) {
        console.error("Failed to fetch OpenRouter models", error);
      }
    };

    fetchOpenRouterModels();
  }, []);

  return (
    <div className="model-settings-parent">
      {/* --------------------------------Model Section---------------------------------------------------------- */}

      <div className="model-parent">
        <p className="model-heading">Model</p>
        <div className="model-child-container">
          <div className="model-child-left">
            <p className="instruction-heading">Instructions</p>
            <div className="instruction-description">
              <textarea
                className="instruction-description-text"
                value={botSettings?.instruction}
                onChange={(e) =>
                  botSettingContext?.handleChange("instruction")(e.target.value)
                }
              />
            </div>
            <div className="instruction-sub-decscription">
              The instructions allows you to customize your chatbot&lsquo;s
              personality and style. Please make sure to experiment with the
              instructions by making it very specific to your data and use case.
            </div>
          </div>
          <div className="temperature-container">
            <div className="model-selection">
              <div className="model-sub-heading">Model</div>
              {/* ----------------------using antd---------------------- */}

              <Select
                className="antd-select"
                defaultValue={botSettings?.model}
                options={openRouterModels}
                onChange={(e) => {
                  botSettingContext?.handleChange("model")(e);
                }}
                suffixIcon={
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="vuesax/outline/arrow-down">
                      <g id="arrow-down">
                        <path
                          id="Vector"
                          d="M11.9995 16.8006C11.2995 16.8006 10.5995 16.5306 10.0695 16.0006L3.54953 9.48062C3.25953 9.19062 3.25953 8.71062 3.54953 8.42063C3.83953 8.13063 4.31953 8.13063 4.60953 8.42063L11.1295 14.9406C11.6095 15.4206 12.3895 15.4206 12.8695 14.9406L19.3895 8.42063C19.6795 8.13063 20.1595 8.13063 20.4495 8.42063C20.7395 8.71062 20.7395 9.19062 20.4495 9.48062L13.9295 16.0006C13.3995 16.5306 12.6995 16.8006 11.9995 16.8006Z"
                          fill="#141416"
                        />
                      </g>
                    </g>
                  </svg>
                }
              />

              <p className="model-sub-description">
                gpt-4 is much better at following the instructions and not
                hallucinating, but it&lsquo;s slower and more expensive than
                gpt-3.5-turbo (1 message using gpt-3.5-turbo costs 1 message
                credit. 1 message using gpt-4 costs 20 message credits)
              </p>
            </div>
            <div className="temperature-selection">
              <div className="temperature-top-section">
                <p className="temperature-title">Temperature</p>
                <span>{botSettings?.temperature}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-top-section">
                  <Slider
                    min={0}
                    max={1}
                    onChange={(value) => {
                      botSettingContext?.handleChange("temperature")(value);
                    }}
                    value={botSettings?.temperature}
                    step={0.1}
                  />
                </div>
                <div className="progress-bar-bottom-section">
                  <p className="reserved">Reserved</p>
                  <p className="creative">Creative</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          className="save-btn"
          style={{ cursor: "pointer" }}
          onClick={updateSettings}
        >
          <p className="btn-text">Save</p>
        </button>
      </div>
    </div>
  );
}

export default OpenRouterModels;
