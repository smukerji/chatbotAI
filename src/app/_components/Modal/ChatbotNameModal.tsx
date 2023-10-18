import { Input, Modal, message } from "antd";
import React from "react";
import "./chatbot-name-modal.css";

function ChatbotNameModal({
  open,
  setOpen,
  chatbotText,
  setChatbotText,
  handleOk,
  forWhat = "naming",
}: any) {
  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      {forWhat === "naming" ? (
        <Modal
          title="Name your Chatbot:"
          open={open}
          onOk={handleOk}
          onCancel={handleCancel}
          okText={"Create bot"}
        >
          <Input
            className="chatbot-text"
            showCount
            maxLength={20}
            value={chatbotText}
            onChange={(e) => {
              setChatbotText(e.target.value);
            }}
          ></Input>
        </Modal>
      ) : (
        <Modal
          title="Write the feedback:"
          open={open}
          onOk={handleOk}
          onCancel={handleCancel}
          okText={"Post feedback"}
        >
          <Input.TextArea
            className="chatbot-text"
            showCount
            maxLength={1000}
            value={chatbotText}
            onChange={(e) => {
              setChatbotText(e.target.value);
            }}
          ></Input.TextArea>
        </Modal>
      )}
    </>
  );
}

export default ChatbotNameModal;
