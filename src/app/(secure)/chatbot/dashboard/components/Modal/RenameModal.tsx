import { Input, Modal, message } from "antd";
import React, { useState } from "react";
import { useCookies } from "react-cookie";
import "./rename-modal.scss";

function RenameModal({ open, setOpen, chatbotId }: any) {
  /// states to handle modal
  const [confirmLoading, setConfirmLoading] = useState(false);
  const modalText =
    "Deleting a chatbot will also remove all the training data, conversations and leads associated to it.";

  const [okText, setOkText] = useState("Save");
  const [messageApi, contextHolder] = message.useMessage();
  const [cookies, setCookies] = useCookies(["userId"]);

  const [chatbotText, setChatbotText] = useState("");

  const handleOk = async () => {
    setConfirmLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/setting/api`,
        {
          method: "PUT",
          body: JSON.stringify({
            chatbotId: chatbotId,
            userId: cookies?.userId,
            chatbotRename: chatbotText,
          }),
          next: { revalidate: 0 },
        }
      );
      /// displaying status
      const data = await res.json();

      messageApi
        .open({
          type: "success",
          content: data?.message,
        })
        .then(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`;
        });
    } catch (error) {
      console.log("Error while renaming chatbot", error);
    } finally {
      setOpen(false);
      setConfirmLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <>
      {contextHolder}
      <Modal
        centered
        title="Rename Chatbot"
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
          placeholder="Chatbot Name"
          showCount
          maxLength={20}
          value={chatbotText}
          onChange={(e) => {
            setChatbotText(e.target.value);
          }}
        />
      </Modal>
    </>
  );
}

export default RenameModal;
