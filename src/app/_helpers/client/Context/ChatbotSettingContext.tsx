"use client";
import { createContext, useState } from "react";
import {
  chatbotBubbleAlignment,
  defaultBotVisibility,
  defaultLeadTitle,
  defaultLeadUserDetails,
  defaultRateLimit,
  defaultRateLimitMessage,
  defaultRateLimitTime,
  models,
  theme,
  visibility,
} from "../../constant";

export const ChatbotSettingContext = createContext({});

export const ChatbotSettingDataProvider = ({ children }: any) => {
  const currrentTime = new Date().getTime();
  const initialChatbotSettings = {
    model: models[0],
    visibility: visibility.PUBLIC,
    temperature: 0,
    numberOfCharacterTrained: 0,
    instruction: "",
    initialMessage: [],
    suggestedMessages: [],
    messagePlaceholder: "",
    theme: theme.LIGHT,
    userMessageColor: "",
    chatbotIconColor: "",
    profilePictureUrl: "",
    profilePictureName: "",
    bubbleIconUrl: "",
    bubbleIconName: "",
    lastTrained: currrentTime,
    chatbotDisplayName: "",
    chatbotBubbleAlignment: chatbotBubbleAlignment.LEFT,
    leadFields: {
      name: { isChecked: false, value: "name" },
      email: { isChecked: false, value: "email" },
      number: { isChecked: false, value: "number" },
    },
    leadTitle: defaultLeadTitle,
    userDetails: defaultLeadUserDetails,
    botVisibility: defaultBotVisibility,
    allowIframe: false, 
    rateLimit: defaultRateLimit,
    rateLimitTime: defaultRateLimitTime,
    rateLimitMessage: defaultRateLimitMessage,
  };
  const [chatbotSettings, setChatbotSettings] = useState(
    initialChatbotSettings
  );

  /// handle individual the changes
  const handleChange = (props: any) => (value: any) => {
    setChatbotSettings((preChatbotSetting) => ({
      ...preChatbotSetting,
      [props]: value,
    }));
  };

  /// handle the loading  of data
  const loadData = (obj: any) => {
    setChatbotSettings({ ...chatbotSettings, ...obj });
  };

  const resetChatbotSettings = () => {
    setChatbotSettings(initialChatbotSettings);
  };

  return (
    <ChatbotSettingContext.Provider
      value={{ chatbotSettings, handleChange, loadData, resetChatbotSettings }}
    >
      {children}
    </ChatbotSettingContext.Provider>
  );
};
