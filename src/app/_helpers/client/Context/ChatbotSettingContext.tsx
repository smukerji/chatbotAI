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
  const [chatbotSettings, setChatbotSettings] = useState({
    // model: models[0],
    // visibility: visibility.PUBLIC,
    // temperature: 0,
    // lastTrained: new Date().getTime(),
    // numberOfCharactersTrained: 0,
    // instruction: "",
    // initialMessage: "",
    // suggestedMessage: [],
    // messagePlaceholder: "",
    // theme: "",
    // userMessageColor: "",
    // profilePictureUrl: "",
    // chatbotIconColor: "",
    // chatbotIconUrl: "",
    // chatBubbleAlignment: "",

    model: models[0],
    visibility: visibility.PUBLIC,
    temperature: 0,
    numberOfCharacterTrained: 0,
    instruction: "",
    initialMessage: "",
    suggestedMessages: [],
    messagePlaceholder: "",
    theme: theme.LIGHT,
    userMessageColor: "",
    chatbotIconColor: "",
    profilePictureUrl: "",
    bubbleIconUrl: "",
    lastTrained: new Date().getTime(),
    chatbotBubbleAlignment: chatbotBubbleAlignment.LEFT,
  });

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

  return (
    <ChatbotSettingContext.Provider
      value={{ chatbotSettings, handleChange, loadData }}
    >
      {children}
    </ChatbotSettingContext.Provider>
  );
};
