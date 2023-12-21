import { message } from "antd";
import Modal from "antd/es/modal";

function ShareModal({ open, setOpen, chatbotId }: any) {
  const script = `<script
    src="${process.env.NEXT_PUBLIC_WEBSITE_URL}embed-bot.js"
    chatbotID=${chatbotId}
    ></script>`;

  const handleOk = async () => {
    // await navigator.clipboard
    //   .writeText(script)
    //   .then(() => {
    //     message.success("Script copied to clipboard");
    //   })
    //   .catch((err) => {
    //     console.error("Failed to copy text: ", err);
    //   });
    try {
      await navigator.clipboard.writeText(script);
      message.success("Content copied to clipboard");
    } catch (err: any) {
      message.error("Failed to copy ", err.message);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };
  return (
    <Modal
      title="Share Chatbot"
      open={open}
      onOk={handleOk}
      // confirmLoading={confirmLoading}
      onCancel={handleCancel}
      okText={"Copy"}
    >
      <p>{script}</p>
    </Modal>
  );
}

export default ShareModal;
