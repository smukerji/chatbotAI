"use client";
import "./create-first-assistant.scss";
import { Button, Input, message, Steps } from "antd";
import editIcon from "../../../../public/svgs/edit-2.svg";
import Image from "next/image";

import img from "../../../../public/voiceBot/Image (4).png";
import infoImage from "../../../../public/voiceBot/SVG/info-circle.svg";
import customTemplate from "../../../../public/voiceBot/SVG/profile-circle.svg";
import galaryImg from "../../../../public/voiceBot/SVG/gallery-add.svg";
import leftArrow from "../../../../public/voiceBot/SVG/arrow-left.svg";
import { useRouter } from "next/navigation";
import { useCookies } from "react-cookie";

import { useState, useContext, useEffect } from "react";

// import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"/
import { CreateVoiceBotContext } from "../../_helpers/client/Context/VoiceBotContextApi";
import SelectAssistantType from "../create-first-assistant/_components/SelectAssistantType/SelectAssistantType";
import PricingWrapperNew from "../home/pricing/_components/PricingWrapperNew";
import {
  CreateAssistantFlowContext,
  SelectedAssistantType,
} from "@/app/_helpers/client/Context/CreateAssistantFlowContext";
import ChooseAssistant from "../create-first-assistant/_components/ChooseAssistant/ChooseAssistant";
import ChooseIndustryExpert from "../create-first-assistant/_components/ChooseIndustryExpert/ChooseIndustryExpert";
import Home from "../home/page";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";
import ShopifySecretModal from "../create-first-assistant/_components/Modals/ShopifySecretModal";
import axios from "axios";
import ChooseVoiceAssistantType from "./_components/ChooseVoiceAssistantType/ChooseVoiceAssistantType";
import ChooseVoiceAssistantExpert from "./_components/ChooseVoiceAssistantExpert/ChooseVoiceAssistantExpert";

export default function FirstAssistant() {
  const [cookies, setCookie] = useCookies(["userId"]);

  /// get the context data
  const createAssistantFlowContext: any = useContext(
    CreateAssistantFlowContext
  );
  const createAssistantFlowContextDetails =
    createAssistantFlowContext.createAssistantFlowInfo;

  const botContext: any = useContext(CreateBotContext);

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voiceBotContext = voiceBotContextData.state;
  console.log("your voice bot data ",voiceBotContext);

  
  const botDetails = botContext?.createBotInfo;

  /// data sources to train
  const [qaData, setQaData]: any = useState();
  const [textData, setTextData]: any = useState();
  const [fileData, setFileData]: any = useState();
  const [crawlData, setCrawlData]: any = useState();
  const [assistantList, setAssistantList] = useState<any>([]);
  const [industryExpertList, setIndustryExpertList] = useState<any>([]);
  const [selectedAssistantIndex, setSelectedAssistantIndex] =
  useState<number>(-1);
  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  const [selecteExpertIndex, setSelectedExpertIndex] = useState<number>(-1);
  const [selectedIndustryExpert, setSelectedIndustryExpert] =
    useState<any>(null);

  /// plan state to check if user purchased plan while onboarding
  const [plan, setPlan]: any = useState();

  const [inputValidationMessage, setinputValidationMessage] =
    useState<string>("");

  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);

  const handleInputBlur = () => {
    setIsInputVisible(false);
  };

  /// modal state handler
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [assistantImagePath, setassistantImagePath] = useState<string>("");

  const assistantNameChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const enteredValue = e.target.value.trim();

    if (inputValidationMessage != "") setinputValidationMessage("");

    createAssistantFlowContext?.handleChange("assistantName")(enteredValue);

    // botContext?.handleChange("chatbotName")(enteredValue);
  };

  const continuesChangeHandler = async () => {
    /// check for validation on each of the steps

    if(createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT){

    }
    else if(createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE){
      
    }
    /// validation for assistant name & creation flow
    if (createAssistantFlowContextDetails?.currentAssistantFlowStep === 0) {
      if (
        createAssistantFlowContextDetails?.assistantName.trim().length === 0
      ) {
        setinputValidationMessage("Please, Provide Assistant Name!");
        return;
      }

      if (
        createAssistantFlowContextDetails?.creationFlow ===
        SelectedAssistantType.NULL
      ) {
        message.warning("Please select the type of assistant!");
        return;
      }
    }

    /// check for the pricing plan
    if (createAssistantFlowContextDetails?.currentAssistantFlowStep === 1 && createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT) {
      if (!plan?.price) {
        message.warning("Please select a plan first!");
        return;
      }
    }

    /// validation for assistant type
    if (createAssistantFlowContextDetails?.currentAssistantFlowStep === 2) {
      if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT) {
        if (!createAssistantFlowContextDetails?.assistantType?.abbreviation) {
          message.warning("Please select an assistant first!");
          return;
        }
      }
      else if(createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE) {
        if (!selectedAssistant) {
          message.warning("Please select an assistant first!");
          return; 
        }
      }

    }

    /// validation for industry expert
    if (createAssistantFlowContextDetails?.currentAssistantFlowStep === 3) {
      if (createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.CHAT) {
        if (!createAssistantFlowContextDetails?.industryExpertType?.abbreviation) {
          message.warning("Please select an Industry Expert first!");
          return;
        }
      }
      else if(createAssistantFlowContextDetails?.creationFlow === SelectedAssistantType.VOICE) {
        if (!selectedIndustryExpert) {
          message.warning("Please select an Industry Expert first!");
          return;
        }
      }
      
    }

    // if (selectedAssistantIndex === -1) {
    //   message.warning("Please select an assistant first!");
    //   return;
    // }

    // if (voiceBotContextData.currentAssistantPage === -1) {
    //   message.warning("Please select an Industry Expert first!");
    //   return;
    // }

    /// increment the page
    const nextAssistantFlowStep =
      createAssistantFlowContextDetails?.currentAssistantFlowStep + 1;
    createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
      nextAssistantFlowStep
    );
  
  };

  const checkPlan = async () => {
    try {
      //ANCHOR - Checking existing plan details
      const checkPlan = await axios.put(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/pricing/stripe-payment-gateway/check-plan`,
        {
          u_id: cookies?.userId,
        }
      );

      const planDetails = checkPlan.data;

      setPlan(planDetails);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    getVoiceAssistantTemplateData();
  }, []);

  useEffect(() => {
    if (plan == undefined) {
      checkPlan();
    }
  }, [createAssistantFlowContextDetails?.currentAssistantFlowStep]);

  // Function to check if a file is an image
  const isImageFile = (file: any) => {
    const acceptedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    return acceptedImageTypes.includes(file.type);
  };


  const assistantSelectHandler = (selectedAssistantValue: SelectedAssistantType) => {

  };

  async function getVoiceAssistantTemplateData() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/template`,
        {
          method: "GET",
        }
      );
      const data = await res.json();

      let assistantDataList = data?.assistantTemplates.filter(
        (assistance: any) => assistance?.industryType === "Assistant"
      );
      let industryExpertDataList = data?.assistantTemplates.filter(
        (assistance: any) => assistance?.industryType === "Expert"
      );
      debugger;
      setAssistantList(assistantDataList);
      setIndustryExpertList(industryExpertDataList);
    } catch (error: any) {
      console.log(error);
    }
  }

  const selectedAssistantChangeHandler = (
    choosenAssistant: any,
    index: number
  ) => {
    setSelectedAssistantIndex(index);
    setSelectedAssistant(choosenAssistant);
  };

  const selectedExpertChangeHandler = (choosenExpert: any, index: number) => {
    setSelectedExpertIndex(index);
    setSelectedIndustryExpert(choosenExpert);
  };


  const previousChangeHandler = () => {
    /// decrement the page
    const previousAssistantFlowStep =
      createAssistantFlowContextDetails?.currentAssistantFlowStep - 1;
    createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
      previousAssistantFlowStep
    );
  };

  return (
    <div className="create-assistant-container">
      {/*------------------------------------------stepper----------------------------------------------*/}
      <div className="stepper">
        <div className="title-container">
          <h2 className="title">Welcome to Torri AI</h2>
          <span className="sub-title">
            Let&apos;s create your own Bot just in 5 steps
          </span>
        </div>
        <div className="voicebot-avatar">
          <div
            className="voicebot-avatar-img"
            style={{ backgroundImage: `url(${assistantImagePath})` }}
          >
            <input
              type="file"
              id="profileImageId"
              style={{ display: "none" }}
              accept="image/*"
              // onChange={imageHandler}
            />
            <label htmlFor="profileImageId" className="file-label">
              <Image alt="" src={galaryImg} className="galary_image"></Image>
            </label>
          </div>
          <div className="voicebot-avatar-img__info">
            {/* <div className="assistant-input-wrapper"> */}
            <Input
              // className={inputValidationMessage ? "input-field invalid-input" : "input-field"}
              className={
                inputValidationMessage
                  ? "assi-input-field invalid-input"
                  : "assi-input-field"
              }
              placeholder="Your Assistant Name"
              onChange={assistantNameChangeHandler}
              // onBlur={handleInputBlur}
              id="assistantNameInput"
              value={createAssistantFlowContextDetails?.assistantName}
              disabled={!isInputVisible}
            />

            {/* </div> */}

            <Button
              style={{
                border: "none",
                margin: 0,
                padding: 0,
                background: "transparent",
              }}
              icon={<Image src={editIcon} alt="edit name" />}
              onClick={() => {
                setIsInputVisible(true);
                const inputElement = document.getElementById(
                  "assistantNameInput"
                ) as HTMLInputElement;
                if (inputElement) {
                  inputElement.focus();
                }
              }}
            />
          </div>
          {inputValidationMessage && (
            <p className="invalidation-message">{inputValidationMessage}</p>
          )}
        </div>
        {/* <h2>Create your voicebot</h2>
        <h3>Let&lsquo;s create your own bot</h3> */}
        <Steps
          className="stepper-steps"
          direction="vertical"
          size="small"
          current={createAssistantFlowContextDetails?.currentAssistantFlowStep}
          items={[
            {
              title: (
                <div>
                  <h3 className="steps-assistant-heading">Create your bot</h3>
                </div>
              ),
            },
            {
              title: (
                <div>
                  <h3 className="steps-assistant-heading">Select plan</h3>
                </div>
              ),
            },
            {
              title: createAssistantFlowContextDetails?.assistantType
                ?.imageUrl ? (
                <div className="selected-assistant">
                  <div className="mini-selected-assistant-image">
                    <input
                      type="file"
                      id="profileImageId"
                      style={{ display: "none" }}
                      accept="image/*"
                      // onChange={imageHandler}
                    />
                    <label htmlFor="profileImageId" className="file-label">
                      <Image
                        alt={
                          createAssistantFlowContextDetails?.assistantType
                            ?.title
                        }
                        src={
                          createAssistantFlowContextDetails?.assistantType
                            ?.imageUrl
                        }
                        width={100}
                        height={100}
                      ></Image>
                    </label>
                  </div>
                  <div className="selected-assistant-header">
                    <h3 className="heading_title">
                      {createAssistantFlowContextDetails?.assistantType?.title}
                    </h3>
                    <h4 className="heading_description">
                      {
                        createAssistantFlowContextDetails?.assistantType
                          ?.description
                      }
                    </h4>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="steps-assistant-heading">
                    Choose your assistant
                  </h3>
                </div>
              ),
            },
            {
              title: createAssistantFlowContextDetails?.industryExpertType
                ?.imageUrl ? (
                <div className="selected-assistant">
                  <div className="mini-selected-assistant-image">
                    <input
                      type="file"
                      id="profileImageId"
                      style={{ display: "none" }}
                      accept="image/*"
                      // onChange={imageHandler}
                    />
                    <label htmlFor="profileImageId" className="file-label">
                      <Image
                        alt={
                          createAssistantFlowContextDetails?.industryExpertType
                            ?.title
                        }
                        src={
                          createAssistantFlowContextDetails?.industryExpertType
                            ?.imageUrl
                        }
                        width={100}
                        height={100}
                      ></Image>
                    </label>
                  </div>
                  <div className="selected-assistant-header">
                    <h3 className="heading_title">
                      {
                        createAssistantFlowContextDetails?.industryExpertType
                          ?.title
                      }
                    </h3>
                    <h4 className="heading_description">
                      {
                        createAssistantFlowContextDetails?.industryExpertType
                          ?.description
                      }
                    </h4>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="steps-assistant-heading">
                    Choose your Industry
                  </h3>
                </div>
              ),
            },
            {
              title: (
                <div>
                  <h3 className="steps-assistant-heading">Customize more</h3>
                </div>
              ),
            },
          ]}
        />

        <div className={"navigation-button"}>
          {/* {voiceBotContextData.currentAssistantPage !== 0 && ( */}
          <Button
            className="previous-button"
            onClick={previousChangeHandler}
            style={{
              visibility:
                createAssistantFlowContextDetails?.currentAssistantFlowStep ===
                0
                  ? "hidden"
                  : "visible",
            }}
          >
            <Image
              className="arrow-left"
              alt="left arrow"
              src={leftArrow}
              width={100}
              height={100}
            />
            <span className="previous-button-text">Previous</span>
          </Button>
          {/* // )} */}
          <button className="continue-button" onClick={continuesChangeHandler}>
            Continue
          </button>
        </div>
      </div>
      {/*------------------------------------------stepper-end----------------------------------------------*/}

      {/*------------------------------------------main-voicebot----------------------------------------------*/}
      <div className="create-assistant-containerp-items">
        {createAssistantFlowContextDetails?.currentAssistantFlowStep === 0 && (
          <SelectAssistantType />
        )}
        {createAssistantFlowContextDetails?.currentAssistantFlowStep === 1 &&
          (createAssistantFlowContextDetails?.creationFlow ===
          SelectedAssistantType.CHAT ? (
            <PricingWrapperNew firstPurchase={true} />
          ) : null)}
              {createAssistantFlowContextDetails?.currentAssistantFlowStep === 2 && 
          (
            createAssistantFlowContextDetails?.creationFlow ===
            SelectedAssistantType.CHAT ?
            ( <ChooseAssistant />) : (
                <div className="assistant-wrapper">
                  <ChooseVoiceAssistantType
                    assistantList={assistantList}
                    selectedAssistantIndex={selectedAssistantIndex}
                    selectedAssistantChangeHandler={selectedAssistantChangeHandler}
                  />
                </div>
            )
          )}
        {createAssistantFlowContextDetails?.currentAssistantFlowStep === 3 && 
          (
            createAssistantFlowContextDetails?.creationFlow ===
            SelectedAssistantType.CHAT ?
            (<ChooseIndustryExpert />) : (
              <div className="assistant-wrapper">
                <ChooseVoiceAssistantExpert
                  industryExpertList={industryExpertList}
                  selecteExpertIndex={selecteExpertIndex}
                  selectedExpertChangeHandler={selectedExpertChangeHandler}
                />
              </div>
            )
          )}
        {createAssistantFlowContextDetails?.currentAssistantFlowStep === 4 && (
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
        {createAssistantFlowContextDetails?.currentAssistantFlowStep === 4 &&
          createAssistantFlowContextDetails?.industryExpertType
            ?.abbreviation === "shopify" && (
            <ShopifySecretModal
              imageUrl={
                createAssistantFlowContextDetails?.industryExpertType.imageUrl
              }
              isOpen={isModalVisible}
              setIsOpen={setIsModalVisible}
            />
          )}
      </div>
      {/*------------------------------------------main-voicebot-end----------------------------------------------*/}
    </div>
  );
}
