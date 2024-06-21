import { message } from "antd";
import Modal from "antd/es/modal";
import "./share-modal.scss";
import closeIcon from "../../../../../../../public/svgs/close-circle.svg";
import redirectIcon from "../../../../../../../public/svgs/redirect-icon.svg";
import copyIcon from "../../../../../../../public/svgs/copy-icon.svg";

import Image from "next/image";

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
      message.success("Copied successfully!");
    } catch (err: any) {
      message.error("Copy Failed!", err.message);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };
  return (
    <Modal
      centered
      title="Share Chatbot"
      open={open}
      onOk={handleOk}
      closeIcon={<Image src={closeIcon} alt="close-icon" />}
      // confirmLoading={confirmLoading}
      onCancel={handleCancel}
      footer={
        <div className="share-btn-wrapper">
          <button onClick={() => handleOk()}>
            <Image src={copyIcon} alt="copy-icon" />
            Copy
          </button>
          {/* <button>
            <Image src={redirectIcon} alt="redirect-icon" />
            Visit
          </button> */}
        </div>
      }
    >
      <p className="share-note">
        To add the chatbot any where on your website, add this script to your
        html code
      </p>
      <p className="script-container">{script}</p>
    </Modal>
  );
}

export default ShareModal;
