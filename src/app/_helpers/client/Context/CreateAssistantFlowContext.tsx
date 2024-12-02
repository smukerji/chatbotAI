"use client";
import { createContext, useState } from "react";
import { AssistantType } from "../../assistant-creation-contants";

export const CreateAssistantFlowContext = createContext({});

export enum SelectedAssistantType {
  NULL,
  VOICE,
  CHAT,
}

export enum AssistantFlowStep {
  CHOOSE_BOT_TYPE = "choose-bot-type",
  CHOOSE_PLAN = "choose-plan",
  CHOOSE_ASSISTANT_TYPE = "choose-assistant-type",
  CHOOSE_INDUSTRY_EXPERT = "choose-industry-expert",
  ADD_DATA_SOURCES = "add-data-sources",
}

export const CreateAssistantFlowDataProvider = ({ children }: any) => {
  const initialCreateAssistantFlowInfo = {
    creationFlow: SelectedAssistantType.NULL,
    assistantName: "",
    currentAssistantFlowStep: AssistantFlowStep.CHOOSE_BOT_TYPE,
    assistantType: {
      title: "",
      description: "",
      imageUrl: "",
      abbreviation: "",
    },
    industryExpertType: {
      title: "",
      description: "",
      imageUrl: "",
      abbreviation: "",
    },
    integrations: {},
    integrationSecretVerified: false,
  };
  const [createAssistantFlowInfo, setCreateAssistantFlowInfo] = useState(
    initialCreateAssistantFlowInfo
  );

  /// handle the changes
  const handleChange = (props: any) => (value: any) => {
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
