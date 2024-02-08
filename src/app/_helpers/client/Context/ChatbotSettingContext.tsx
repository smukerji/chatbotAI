"use client";
import { createContext, useState } from "react";
import {
  chatbotBubbleAlignment,
  models,
  theme,
  visibility,
} from "../../constant";

export const ChatbotSettingContext = createContext({});

export const ChatbotSettingDataProvider = ({ children }: any) => {
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
    lastTrained: new Date().getTime(),
    chatbotDisplayName: "",
    chatbotBubbleAlignment: chatbotBubbleAlignment.LEFT,
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
