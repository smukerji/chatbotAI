"use client";
import { createContext, useState } from "react";

export const CreateBotContext = createContext({});

export const CreateBotDataProvider = ({ children }: any) => {
  const [createBotInfo, setCreateBotInfo] = useState({
    activeSource: "document",
    editChatbot: "chatbot",
    chabotSettings:"general",

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

    chatbotName: "",
  });

  /// handle the changes
  const handleChange = (props: any) => (value: any) => {
    setCreateBotInfo((prevCreateBotInfo) => ({
      ...prevCreateBotInfo,
      [props]: value,
    }));
  };

  return (
    <CreateBotContext.Provider value={{ createBotInfo, handleChange }}>
      {children}
    </CreateBotContext.Provider>
  );
};
