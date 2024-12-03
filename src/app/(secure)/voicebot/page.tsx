"use client";
import "./voicebot.scss";
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
import ChooseVoiceAssistantType from "../create-first-assistant/_components/ChooseVoiceAssistantType/ChooseVoiceAssistantType";
import ChooseVoiceAssistantExpert from "../create-first-assistant/_components/ChooseVoiceAssistantExpert/ChooseVoiceAssistantExpert";

export default function VoiceBot() {
  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  const router = useRouter();

  let cardDetails = [
    {
      image: "",
      title: "",
      subTitle: "",
    },
  ];

  const [currentPage, setCurrentPage] = useState<number>(1);

  const [cookies, setCookie] = useCookies(["userId"]);

  const [selectedAssistant, setSelectedAssistant] = useState<any>(null);
  const [selectedAssistantIndex, setSelectedAssistantIndex] =
    useState<number>(-1);
  const [assistantList, setAssistantList] = useState<any>([]);

  const [industryExpertList, setIndustryExpertList] = useState<any>([]);
  const [selecteExpertIndex, setSelectedExpertIndex] = useState<number>(-1);
  const [selectedIndustryExpert, setSelectedIndustryExpert] =
    useState<any>(null);

  const [assistantName, setAssistantName] = useState<string>("");
  const [stepsCounter, setStepsCounter] = useState<number>(0);

  const [acknowledgedData, setAcknowledgedData] = useState<any>({});
  const [assistantImagePath, setassistantImagePath] = useState<string>("");

  const [inputValidationMessage, setinputValidationMessage] =
    useState<string>("");

  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);

  const handleInputBlur = () => {
    setIsInputVisible(false);
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

  useEffect(() => {
    getVoiceAssistantTemplateData();
  }, []);

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

  const assistantNameChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const enteredValue = e.target.value.trim();

    setAssistantName(enteredValue);
    if (enteredValue.trim().length == 0) {
      setinputValidationMessage("Please, Provide Name!");
      voiceBotContextData.updateState("name", enteredValue);
    } else {
      setinputValidationMessage("");
      voiceBotContextData.updateState("name", enteredValue);
    }
  };

  console.log("your voicebot details ", voicebotDetails?.name);

  const continuesChangeHandler = async () => {
    if (assistantName.trim().length === 0) {
      setinputValidationMessage("Please, Provide Name!");
      return;
    }

    if (selectedAssistantIndex === -1) {
      message.warning("Please select an assistant first!");
      return;
    }

    voiceBotContextData.setCurrentAssistantPage(1);
    setStepsCounter(1);

    if (voiceBotContextData.currentAssistantPage === 1) {
      if (selecteExpertIndex === -1) {
        message.warning("Please select an Industry Expert first!");
        return;
      } else {
        const assistantTemplateIDs = [
          selectedAssistant?._id,
          selectedIndustryExpert?._id,
        ];

        if (acknowledgedData?.isAcknowledged) {
          //update the data
          debugger;
          try {
            const assistantUpdateResponse = await fetch(
              `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
              {
                method: "PUT",
                body: JSON.stringify({
                  assistantName: assistantName,
                  assistantTemplateIDs: assistantTemplateIDs,
                  imageUrl: assistantImagePath,
                  recordId: acknowledgedData?.insertedId,
                }),
              }
            );

            const assistantUpdateResponseParse =
              await assistantUpdateResponse.json();
            debugger;

            router.push(`/voicebot/dashboard?voicBotName=${assistantName}`);
          } catch (error: any) {
            console.log(error);
            message.error(error.message);
          }

          debugger;
        }
        else{//create the data
          debugger
          try{

            const assistantCreateResponse = await fetch(
              `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
              {
                method: "POST",
                body: JSON.stringify({
                  assistantName: assistantName,
                  assistantTemplateIDs: assistantTemplateIDs,
                  imageUrl: assistantImagePath,
                  userId: cookies.userId,
                }),
              }
            );

            const assistantCreateResponseParse =
              await assistantCreateResponse.json();
            debugger;
            voiceBotContextData.setAssistantMongoId(
              assistantCreateResponseParse?.result?.insertedId
            );
            let assistantData = assistantCreateResponseParse?.record;
            voiceBotContextData.setAssistantInfo(assistantData);

            router.push(`/voicebot/dashboard?voicBotName=${assistantName}`);
          } catch (error: any) {
            console.log(error);
            message.error(error.message);
          }
        }
      }
    }

    // router.push("/voicebot/dashboard");
    // router.push({
    //   pathname: "/voicebot/dashboard",
    //   query:{
    //     assistantName,
    //     selectedAssistantIndex,
    //   }
    // })
  };

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

  const imageHandler = async (e: any) => {
    const selectedFile = e.target.files[0];

    debugger;

    // Check if a file is selected and it's an image
    if (selectedFile && isImageFile(selectedFile)) {
      /// upload the image file to vercel
      try {
        // setIsLoading(!isLoading);
        /// delete any existing URL if any
        if (acknowledgedData?.isAcknowledged) {
          fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}api/delete-img`, {
            method: "POST",
            body: JSON.stringify({ url: assistantImagePath }),
          });
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/upload-img?filename=${selectedFile.name}`,
          {
            method: "POST",
            body: selectedFile,
          }
        );

        if (!res.ok) {
          throw await res.json();
        }
        const data = await res.json();
        // setIconImage(data?.uploadUrl);
        debugger;
        const assistantTemplateIDs = [
          selectedAssistant?._id,
          selectedIndustryExpert?._id,
        ];
        const imagePath = data?.uploadUrl;
        setassistantImagePath(imagePath);
        const voiceAssistantName = assistantName;
        if (acknowledgedData?.isAcknowledged) {
          const assistantUpdateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
            {
              method: "PUT",
              body: JSON.stringify({
                assistantName: voiceAssistantName,
                assistantTemplateIDs: assistantTemplateIDs,
                imageUrl: imagePath,
                recordId: acknowledgedData?.insertedId,
              }),
            }
          );

          const assistantUpdateResponseParse =
            await assistantUpdateResponse.json();
          setAcknowledgedData({
            isAcknowledged: assistantUpdateResponseParse?.result?.acknowledged,
            insertedId: assistantUpdateResponseParse?.result?.upsertedId
              ? assistantUpdateResponseParse?.result?.upsertedId
              : acknowledgedData?.insertedId,
          });
        } else {
          const assistantCreateResponse = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/voice`,
            {
              method: "POST",
              body: JSON.stringify({
                assistantName: voiceAssistantName,
                assistantTemplateIDs: assistantTemplateIDs,
                imageUrl: imagePath,
                userId: cookies.userId,
              }),
            }
          );

          const assistantCreateResponseParse =
            await assistantCreateResponse.json();
          debugger;
          voiceBotContextData.setAssistantMongoId(
            assistantCreateResponseParse?.result?.insertedId
          );
          let assistantData = assistantCreateResponseParse?.record;
          voiceBotContextData.setAssistantInfo(assistantData);
          setAcknowledgedData({
            isAcknowledged: assistantCreateResponseParse?.result?.acknowledged,
            insertedId: assistantCreateResponseParse?.result?.insertedId,
          });
        }

        //

        //add the entry to the database
      } catch (error: any) {
        message.error(error.message);
        return;
      } finally {
        // setIsLoading((prev) => !prev);
      }

      // setFileName(selectedFile.name);
    } else {
      // Display an error message or handle the invalid file selection as needed
      message.error("Invalid file format.");
      return;
    }
  };

  const previousChangeHandler = () => {
    voiceBotContextData.setCurrentAssistantPage(0);
    setStepsCounter(0);
    // router.push("/voicebot/dashboard");
  };

  return (
    <div className="parents-voicebot">
      {/*------------------------------------------stepper----------------------------------------------*/}
      <div className="stepper">
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
              onChange={imageHandler}
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
              onBlur={handleInputBlur}
              id="assistantNameInput"
              value={assistantName}
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
        <h2>Create your voicebot</h2>
        <h3>Let&lsquo;s create your own bot</h3>
        <Steps
          className="stepper-steps"
          direction="vertical"
          size="small"
          current={stepsCounter}
          items={[
            {
              title:
                selectedAssistant !== null ? (
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
                          alt={selectedAssistant.assistantType}
                          src={selectedAssistant.imageUrl}
                          width={100}
                          height={100}
                        ></Image>
                      </label>
                    </div>
                    <div className="selected-assistant-header">
                      <h3 className="heading_title">
                        {selectedAssistant.assistantType}
                      </h3>
                      <h4 className="heading_description">
                        {selectedAssistant.dispcrtion}
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
              description: "" /*<div> gggg</div> */,
            },
            {
              title:
                selectedIndustryExpert !== null ? (
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
                          alt={selectedIndustryExpert.assistantType}
                          src={selectedIndustryExpert.imageUrl}
                          width={100}
                          height={100}
                        ></Image>
                      </label>
                    </div>
                    <div className="selected-assistant-header">
                      <h3 className="heading_title">
                        {selectedIndustryExpert.assistantType}
                      </h3>
                      <h4 className="heading_description">
                        {selectedIndustryExpert.dispcrtion}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="steps-assistant-heading">
                      Choose your Industry Expert!
                    </h3>
                  </div>
                ),
              description: "",
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
                voiceBotContextData.currentAssistantPage === 0
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
          <Button
            className="continue-button"
            type="primary"
            onClick={continuesChangeHandler}
          >
            Continue
          </Button>
        </div>
      </div>
      {/*------------------------------------------stepper-end----------------------------------------------*/}

      {/*------------------------------------------main-voicebot----------------------------------------------*/}
      <div className="main-voicebot">
        <h2 className="main-voiceboot__title">
          {voiceBotContextData.currentAssistantPage === 0
            ? "Let's create a new assistant"
            : "Choose your industry expert"}
        </h2>
        <h4 className="main-voiceboot__subtitle">
          {voiceBotContextData.currentAssistantPage === 0
            ? "Get started by selecting the AI assistant that best fits your needs and preferences."
            : "Choose your specialized AI expert for tasks like translation, diagnostics, finance, or customer service needs."}
        </h4>

        <div className="assistant-wrapper">
          <div className="custom_assistant-card">
            <div className="blank-template">
              <div className="image-card">
                <Image
                  src={customTemplate}
                  alt=""
                  height={100}
                  width={100}
                ></Image>
              </div>
              <h3 className="card_sub-header">Blank Template</h3>
            </div>
          </div>

          {voiceBotContextData.currentAssistantPage === 0 ? (
            <ChooseVoiceAssistantType
            assistantList={assistantList}
            selectedAssistantIndex={selectedAssistantIndex}
            selectedAssistantChangeHandler={selectedAssistantChangeHandler}
          />
        ) : (
          <ChooseVoiceAssistantExpert
            industryExpertList={industryExpertList}
            selecteExpertIndex={selecteExpertIndex}
            selectedExpertChangeHandler={selectedExpertChangeHandler}
          />
       
          )}
         
        </div>
      </div>
      {/*------------------------------------------main-voicebot-end----------------------------------------------*/}
    </div>
  );
}







   //   assistantList.length > 0 ? (
          //     assistantList.map((assistant: any, index: number) => {
          //       return (
          //         <div
          //           className={
          //             selectedAssistantIndex === index
          //               ? "assistant-card selected-assistant"
          //               : "assistant-card "
          //           }
          //           key={index}
          //           onClick={() => {
          //             selectedAssistantChangeHandler(assistant, index);
          //           }}
          //         >
          //           <div className="card-image">
          //             <Image
          //               src={assistant.imageUrl}
          //               alt=""
          //               height={100}
          //               width={100}
          //             ></Image>
          //           </div>
          //           <div className="header-information">
          //             <div className="header_container">
          //               <h2 className="card_header">
          //                 {assistant.assistantType}
          //               </h2>
          //               <div className="image-info">
          //                 <Image
          //                   src={infoImage}
          //                   alt=""
          //                   height={100}
          //                   width={100}
          //                 ></Image>
          //               </div>
          //             </div>

          //             <h3 className="card_sub-header">
          //               {assistant.dispcrtion}
          //             </h3>
          //           </div>
          //         </div>
          //       );
          //     })
          //   ) : (
          //     <div>loadding....</div>
          //   )
          // ) : (
          //   industryExpertList.map((assistant: any, index: number) => {
          //     return (
          //       <div
          //         className={
          //           selecteExpertIndex === index
          //             ? "assistant-card selected-assistant"
          //             : "assistant-card "
          //         }
          //         key={index}
          //         onClick={() => {
          //           selectedExpertChangeHandler(assistant, index);
          //         }}
          //       >
          //         <div className="card-image">
          //           <Image
          //             src={assistant.imageUrl}
          //             alt=""
          //             height={100}
          //             width={100}
          //           ></Image>
          //         </div>
          //         <div className="header-information">
          //           <div className="header_container">
          //             <h2 className="card_header">{assistant.assistantType}</h2>
          //             <div className="image-info">
          //               <Image
          //                 src={infoImage}
          //                 alt=""
          //                 height={100}
          //                 width={100}
          //               ></Image>
          //             </div>
          //           </div>

          //           <h3 className="card_sub-header">{assistant.dispcrtion}</h3>
          //         </div>
          //       </div>
          //     );
          //   })