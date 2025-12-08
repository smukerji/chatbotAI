import React, { useEffect, useState } from "react";

import "./phone-number-design.scss";
import PhoneInput from "react-phone-input-2";
import {
  Input,
  Slider,
  Switch,
  Button,
  Select,
  Flex,
  Spin,
  message,
} from "antd";
import Image from "next/image";
import ImportNumber from "./import-number/ImportNumber";
import phoneNumberDelete from "../../../../../../public/voiceBot/phone-number/trash.svg";

import { useCookies } from "react-cookie";
import ImportNumberCustomModel from "../../../create-first-assistant/_components/ImportNumberCustomModel/ImportNumberCustomModel";
import { EllipsisOutlined } from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import FreeTorriNumberModal from "../../../create-first-assistant/_components/FreeTorriNumberModal/FreeTorriNumberModal";
interface TwilioDetails {
  createdAt: string;
  id: string;
  number: string;
  orgId: string;
  provider: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  updatedAt: string;
}

interface InboundNumberDetails {
  label: string;
  twilio: TwilioDetails;
  userId: string;
  _id: string;
}
function PhoneNumber() {
  // let phoneNumber:any = [];

  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [publishAssistantList, setPublishAssistantList] = useState([
    { value: "", label: "", assistantId: "" },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inboundNumberDetails, setInboundNumberDetails] =
    useState<InboundNumberDetails | null>(null);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(
    null
  );

  const [cookies, setCookie] = useCookies(["userId"]);

  const [openModel, setOpenModel] = useState<boolean>(false);
  const [activeDialog, setActiveDialog] = useState("");
  const menuItems = [
    {
      key: "1",
      label: "Free Torri Number",
    },
  ];

  const openHandleModel = () => {
    setOpenModel(true);
  };
  const onMenuClick = (e: any) => {
    if (e.key === "1") {
      setActiveDialog("free-torri");
    }
    // ...other cases
  };

  async function getPublishAssistantDataFromDB() {
    try {
      const assistantListFromDb: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone/vapi-connect-assistant?userId=${cookies?.userId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const assistantResult = await assistantListFromDb.json();
      const assistantDataMap = assistantResult?.assistants.map(
        (assistant: any) => {
          return {
            value: assistant.vapiAssistantId,
            label: assistant.assistantName,
            assistantId: assistant.vapiAssistantId,
          };
        }
      );
      setPublishAssistantList(assistantDataMap);

      console.log("assistant list:", assistantResult);
    } catch (error: any) {
      console.error("Error parsing request body:", error);
    }
  }

  async function getImportedTwilioDataFromDB() {
    try {
      setIsLoading(true);

      const phoneNumberData: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone?userId=${cookies?.userId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const twilioNumbers = await phoneNumberData.json();
      setPhoneNumbers(twilioNumbers?.importedNumbers);
      debugger;
      setInboundNumberDetails(twilioNumbers?.importedNumbers[0]);
      if (
        Array.isArray(twilioNumbers?.importedNumbers) &&
        twilioNumbers?.importedNumbers.length > 0 &&
        "assistantId"
      ) {
        console.log("twilioNumbers:", twilioNumbers);
        setSelectedAssistant(twilioNumbers?.importedNumbers[0]?.assistantId);
      }
    } catch (error: any) {
      console.error("Error parsing request body:", error);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    const fetchData = async () => {
      await getImportedTwilioDataFromDB();
      await getPublishAssistantDataFromDB();
    };
    fetchData();
  }, []);

  function changedTheInboundNumberHandler(contact: any) {
    debugger;
    setInboundNumberDetails(contact);
    if ("assistantId" in contact) {
      setSelectedAssistant(contact?.assistantId);
    } else {
      setSelectedAssistant(null);
    }
  }

  async function assistantSelectOnPhoneNumberHandler(option: any, values: any) {
    console.clear();
    console.log("selected option:", option);
    console.log("selected values:", values);
    debugger;
    if (inboundNumberDetails) {
      const updateValue = {
        twilioId: inboundNumberDetails.twilio.id,
        assistantId: values?.assistantId,
      };

      setSelectedAssistant(values?.assistantId);

      debugger;
      const updatedRequest: any = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone?userId=${cookies?.userId}`,
        {
          method: "PUT",
          body: JSON.stringify({ ...updateValue }),
          next: { revalidate: 0 },
        }
      );

      const updatedData = await updatedRequest.json();

      message.info(updatedData.message);

      console.log("updateValue", updateValue);
    }
  }

  async function deletePhoneNumberHandler() {
    console.clear();
    console.log("Phone number details ", inboundNumberDetails);

    if (!inboundNumberDetails || !inboundNumberDetails?._id) {
      console.error("No phone number selected or missing ID");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/phone?phoneNumberId=${inboundNumberDetails._id}`,
        {
          method: "DELETE",
          next: { revalidate: 0 },
        }
      );

      const data = await response.json();
      console.log("Delete response:", data.data);
      await getImportedTwilioDataFromDB();
      await getPublishAssistantDataFromDB();
    } catch (error: any) {
      console.error("Error deleting phone number:", error);
    }
  }

  return (
    <>
      {isLoading ? (
        <Flex align="center" gap="middle" className="loader">
          <Spin size="large" />
        </Flex>
      ) : (
        <div className="phone-container">
          <div className="left-container">
            <div className="list-items">
              {phoneNumbers.length > 0 ? (
                phoneNumbers.map((contact: any, index: number) => (
                  <>
                    {index !== 0 && <hr className="splitter" />}
                    <div
                      className="list-item"
                      onClick={changedTheInboundNumberHandler.bind(
                        null,
                        contact
                      )}
                    >
                      <div className="number-details">
                        <h2> {contact.twilio.number} </h2>
                        <p> {contact.label} </p>
                      </div>
                      {/* <div className='switch-input'>
                      <Switch className="switch-btn" defaultChecked />
                    </div> */}
                    </div>
                  </>
                ))
              ) : (
                <>
                  <div className="list-item">
                    <div className="number-details">
                      <h2> No Number Added, Yet!</h2>
                      <p> Add new number here.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="bottom-button">
              <Space.Compact className="bottom-button">
                <Button
                  className="previous import-btn"
                  onClick={openHandleModel}
                >
                  Import Phone Number
                </Button>
                <Dropdown
                  menu={{ items: menuItems, onClick: onMenuClick }}
                  placement="bottomRight"
                  className="dropdown-button"
                >
                  <Button
                    className="dropdown-btn"
                    icon={<EllipsisOutlined />}
                  />
                </Dropdown>
              </Space.Compact>
            </div>
          </div>
          <div className="right-container">
            <div className="top">
              <div className="container">
                <div className="container-head-sec">
                  <h3 className="title">Inbound Settings</h3>
                  {/* <Button className="previous" onClick={() => openHandleModel()}>Import Phone Number</Button> */}
                  <Button
                    onClick={deletePhoneNumberHandler}
                    className="edit-btn"
                  >
                    <Image src={phoneNumberDelete} alt="delete-number"></Image>
                  </Button>
                </div>
                <p className="description">
                  You can assign an assistant to the Phone number so that
                  whenever someone calls this phoneNumber the assistant will
                  automatically be assigned to the call..
                </p>
                <div className="content-wrapper">
                  <div className="input-wrapper">
                    <h4 className="lable">Inbound Phone Number</h4>
                    <Input
                      className="phone-number-input"
                      value={inboundNumberDetails?.twilio.number}
                      disabled
                    />
                  </div>

                  <div className="input-wrapper">
                    <h4 className="lable">Assistant</h4>
                    <Select
                      className="select-field"
                      placeholder="Select the assistant"
                      value={selectedAssistant}
                      onSelect={assistantSelectOnPhoneNumberHandler}
                      options={publishAssistantList}
                    />
                  </div>

                  <div className="select-wrapper">
                    <h4 className="lable">Fallback Destination</h4>
                    <p className="description">
                      Set a fallback destination for inbound calls when the
                      assistant or squad is not available.
                    </p>
                    <div className="phone-input-with-flag">
                      <PhoneInput country={"us"} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bottom">
              <div className="container">
                <h3 className="title">Outbound Form</h3>
                <p className="description">
                  You can assign an outbound phone number , set up a fallback
                  and set up a squad to be called if the assistant is not
                  available.
                </p>
                <div className="content-wrapper">
                  <div className="select-wrapper">
                    <h4 className="lable">Outbound Phone Number</h4>

                    <div className="phone-input-with-flag">
                      <PhoneInput
                        country={"us"}
                        placeholder="Enter a phone number"
                      />
                    </div>
                  </div>

                  <div className="input-wrapper">
                    <h4 className="lable">Assistant</h4>
                    <Select
                      className="select-field"
                      placeholder="Select the assistant"
                      options={publishAssistantList}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {openModel && (
            <ImportNumberCustomModel
              setOpen={setOpenModel}
              title={"Create a Tool"}
              content={<ImportNumber />}
              onClose={getImportedTwilioDataFromDB}
            />
          )}

          {activeDialog === "free-torri" && (
            <FreeTorriNumberModal
              open={true}
              onClose={() => setActiveDialog("")}
            />
          )}
        </div>
      )}
    </>
  );
}

export default PhoneNumber;
