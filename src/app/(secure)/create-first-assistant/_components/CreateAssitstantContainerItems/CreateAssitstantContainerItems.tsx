import {
  AssistantFlowStep,
  CreateAssistantFlowContext,
  SelectedAssistantType,
} from "@/app/_helpers/client/Context/CreateAssistantFlowContext";
import React, { useContext, useEffect, useState } from "react";
import SelectAssistantType from "../SelectAssistantType/SelectAssistantType";
import PricingWrapperNew from "@/app/(secure)/home/pricing/_components/PricingWrapperNew";
import ChooseAssistant from "../ChooseAssistant/ChooseAssistant";
import ChooseVoiceAssistantType from "../ChooseVoiceAssistantType/ChooseVoiceAssistantType";
import ChooseIndustryExpert from "../ChooseIndustryExpert/ChooseIndustryExpert";
import ChooseVoiceAssistantExpert from "../ChooseVoiceAssistantExpert/ChooseVoiceAssistantExpert";
import Home from "@/app/(secure)/home/page";
import ShopifySecretModal from "../Modals/ShopifySecretModal";

function CreateAssitstantContainerItems({
  assistantList,
  selectedAssistantIndex,
  selectedAssistantChangeHandler,
  industryExpertList,
  selecteExpertIndex,
  selectedExpertChangeHandler,
  qaData,
  textData,
  fileData,
  crawlData,
  isModalVisible,
  setIsModalVisible,
}: any) {
  /// get the context data
  const createAssistantFlowContext: any = useContext(
    CreateAssistantFlowContext
  );
  const createAssistantFlowContextDetails =
    createAssistantFlowContext.createAssistantFlowInfo;
  return (
    <div className="create-assistant-containerp-items">
      {createAssistantFlowContextDetails?.currentAssistantFlowStep ===
        AssistantFlowStep.CHOOSE_BOT_TYPE && <SelectAssistantType />}
      {createAssistantFlowContextDetails?.currentAssistantFlowStep ===
        AssistantFlowStep.CHOOSE_PLAN &&
        (createAssistantFlowContextDetails?.creationFlow ===
        SelectedAssistantType.CHAT ? (
          <PricingWrapperNew firstPurchase={true} />
        ) : null)}
      {createAssistantFlowContextDetails?.currentAssistantFlowStep ===
        AssistantFlowStep.CHOOSE_ASSISTANT_TYPE &&
        (createAssistantFlowContextDetails?.creationFlow ===
        SelectedAssistantType.CHAT ? (
          <ChooseAssistant />
        ) : (
          <div className="assistant-wrapper">
            <ChooseVoiceAssistantType
              assistantList={assistantList}
              selectedAssistantIndex={selectedAssistantIndex}
              selectedAssistantChangeHandler={selectedAssistantChangeHandler}
            />
          </div>
        ))}
      {createAssistantFlowContextDetails?.currentAssistantFlowStep ===
        AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT &&
        (createAssistantFlowContextDetails?.creationFlow ===
        SelectedAssistantType.CHAT ? (
          <ChooseIndustryExpert />
        ) : (
          <div className="assistant-wrapper">
            <ChooseVoiceAssistantExpert
              industryExpertList={industryExpertList}
              selecteExpertIndex={selecteExpertIndex}
              selectedExpertChangeHandler={selectedExpertChangeHandler}
            />
          </div>
        ))}
      {createAssistantFlowContextDetails?.currentAssistantFlowStep ===
        AssistantFlowStep.ADD_DATA_SOURCES && (
        <>
          <div className="title">
            <h1>Create your AI Assistant</h1>
            <span>Add your data sources to train your chatbot</span>
          </div>
          <Home
            qaData={qaData}
            textData={textData}
            fileData={fileData}
            crawlingData={crawlData}
            chatbotName={createAssistantFlowContextDetails?.assistantName}
            botType={"bot-v2"}
            assistantType={`${createAssistantFlowContextDetails?.assistantType?.abbreviation}-${createAssistantFlowContextDetails?.industryExpertType?.abbreviation}`}
            integrations={createAssistantFlowContextDetails?.integrations}
          />
        </>
      )}
      {createAssistantFlowContextDetails?.currentAssistantFlowStep ===
        AssistantFlowStep.ADD_DATA_SOURCES &&
        createAssistantFlowContextDetails?.industryExpertType?.abbreviation ===
          "shopify" && (
          <ShopifySecretModal
            imageUrl={
              createAssistantFlowContextDetails?.industryExpertType.imageUrl
            }
            isOpen={isModalVisible}
            setIsOpen={setIsModalVisible}
          />
        )}
    </div>
  );
}

export default CreateAssitstantContainerItems;
