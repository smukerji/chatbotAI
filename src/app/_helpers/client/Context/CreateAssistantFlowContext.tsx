"use client";
import { createContext, useState } from "react";
import { AssistantType } from "../../assistant-creation-contants";

export const CreateAssistantFlowContext = createContext({});

export const CreateAssistantFlowDataProvider = ({ children }: any) => {
  const initialCreateAssistantFlowInfo = {
    assistantName: "",
    currentAssistantFlowStep: 0,
  };
  const [createAssistantFlowInfo, setCreateAssistantFlowInfo] = useState(
    initialCreateAssistantFlowInfo
  );

  /// handle the changes
  const handleChange = (props: any) => (value: any) => {
    console.log("createAssistantFlowInfo", createAssistantFlowInfo);
    setCreateAssistantFlowInfo((prevCreateAssistantFlowInfo) => ({
      ...prevCreateAssistantFlowInfo,
      [props]: value,
    }));
  };

  /// for reseting the state
  const resetCreateAssistantFlowInfo = () => {
    setCreateAssistantFlowInfo(initialCreateAssistantFlowInfo);
  };

  return (
    <CreateAssistantFlowContext.Provider
      value={{
        createAssistantFlowInfo,
        handleChange,
        resetCreateAssistantFlowInfo,
      }}
    >
      {children}
    </CreateAssistantFlowContext.Provider>
  );
};
