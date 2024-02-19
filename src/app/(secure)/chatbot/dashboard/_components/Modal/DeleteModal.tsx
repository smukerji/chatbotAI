import { Modal, message } from "antd";
import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import "./delete-modal.scss";

function DeleteModal({
  open,
  setOpen,
  chatbotId,
  setChangeFlag,
  changeFlag,
  reload,
}: any) {
  /// states to handle modal
  const [confirmLoading, setConfirmLoading] = useState(false);
  const modalText =
    "Deleting a chatbot will also remove all the training data, conversations and leads associated to it.";

  const [okText, setOkText] = useState("Delete");
  const [messageApi, contextHolder] = message.useMessage();
  const [cookies, setCookies] = useCookies(["userId"]);

  const handleOk = async () => {
    setConfirmLoading(true);
    setOkText("Deleting...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/pinecone`,
        {
          method: "DELETE",
          body: JSON.stringify({
            chatbotId: chatbotId,
            userId: cookies?.userId,
          }),
          next: { revalidate: 0 },
        }
      );
      /// displaying status
      const data = await res.json();

      if (reload) {
        messageApi
          .open({
            type: "error",
            content: data.text,
          })
          .then(() => {
            window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`;
          });
      } else {
        messageApi.open({
          type: "error",
          content: data.text,
        });
        setChangeFlag(!changeFlag);
      }
    } catch (error) {
      console.log("Error while deleting chatbot", error);
    } finally {
      setOpen(false);
      setConfirmLoading(false);
      setOkText("Delete");
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
        title="Delete Chatbot"
        open={open}
        confirmLoading={confirmLoading}
        closeIcon={null}
        onCancel={handleCancel}
        footer={
          <div className="delete-btn-wrapper">
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
        <p>{modalText}</p>
      </Modal>
    </>
  );
}

export default DeleteModal;
