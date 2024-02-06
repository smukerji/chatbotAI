"use client";
import { createContext, useState } from "react";

export const CreateBotContext = createContext({});

export const CreateBotDataProvider = ({ children }: any) => {
  const initialCreateBotInfo = {
    activeSource: "document",
    editChatbot: "chatbot",
    chabotSettings: "general",

    isLoading: false,
    totalCharCount: 0,
    /// document upload data
    filesCharCount: 0,
    defaultFileList: [],
    newFileList: [],
    deleteFileList: [],

    /// text data
    text: "",
    textCharCount: 0,

    /// qa data
    qaList: [],
    qaCount: 0,
    deleteQaList: [],
    qaCharCount: 0,

    /// website data
    crawledList: [],
    deleteCrawlList: [],
    websiteCharCount: 0,
    crawlLink: "",

    isUpdateChatbot: false,

    // plan: {},

    chatbotName: "",
  };
  const [createBotInfo, setCreateBotInfo] = useState(initialCreateBotInfo);

  /// handle the changes
  const handleChange = (props: any) => (value: any) => {
    setCreateBotInfo((prevCreateBotInfo) => ({
      ...prevCreateBotInfo,
      [props]: value,
    }));
  };

  /// for reseting the state
  const resetCreateBotInfo = () => {
    setCreateBotInfo(initialCreateBotInfo);
  };

  return (
    <CreateBotContext.Provider
      value={{ createBotInfo, handleChange, resetCreateBotInfo }}
    >
      {children}
    </CreateBotContext.Provider>
  );
};
