import { Input, Modal, message } from "antd";
import React from "react";
import "./chatbot-name-modal.css";

function ChatbotNameModal({ open, setOpen, chatbotText, setChatbotText, handleOk }: any) {
  const handleCancel = () => {
    setOpen(false);
  };

  
  return (
    <>
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
    </>
  );
}

export default ChatbotNameModal;
