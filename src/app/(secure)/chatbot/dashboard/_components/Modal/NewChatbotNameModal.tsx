import { Input, Modal, message } from "antd";
import React, { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./rename-modal.scss";
import { CreateBotContext } from "../../../../../_helpers/client/Context/CreateBotContext";
import axios from "axios";

function NewChatbotNameModal({ open, setOpen, chatbotId }: any) {
  const [cookies, setCookie] = useCookies(["userId"]);

  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;
  const chatbotText = botDetails?.chatbotName;

  /// states to handle modal
  const [confirmLoading, setConfirmLoading] = useState(false);
  const modalText =
    "Deleting a chatbot will also remove all the training data, conversations and leads associated to it.";

  const [okText, setOkText] = useState("Create");
  const [messageApi, contextHolder] = message.useMessage();

  const handleOk = async () => {
    if (chatbotText == "") {
      messageApi.open({
        type: "warning",
        content: "Please enter a name for the Chatbot.",
      });
      return;
    }

    setConfirmLoading(true);

    try {
      window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}home?chatbotName=${chatbotText}`;
    } catch (error) {
      console.log("Error while naming the chatbot", error);
    } finally {
      setOpen(false);
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // useEff

  return (
    <>
      {contextHolder}
      <Modal
        centered
        title="New Chatbot"
        open={open}
        confirmLoading={confirmLoading}
        closeIcon={null}
        onCancel={handleCancel}
        footer={
          <div className="rename-btn-wrapper">
            <button onClick={() => handleCancel()}>Cancel</button>
            <button
              onClick={() => {
                handleOk();
              }}
            >
              {okText}
            </button>
          </div>
        }
      >
        <Input
          placeholder="Enter your chatbot name..."
          showCount
          maxLength={20}
          value={chatbotText}
          onChange={(e) => {
            botContext?.handleChange("chatbotName")(e.target.value);
          }}
        />
      </Modal>
    </>
  );
}

export default NewChatbotNameModal;
