import { message } from "antd";
import React from "react";
import copyIcon from "../../../../../../../public/svgs/copy-icon.svg";
import Image from "next/image";
import "./embed-site.scss";
import CustomModal from "../CustomModal/CustomModal";
import { useRouter } from "next/navigation";

function EmbedSite({
  chatbotId,
  isPlanNotification,
  setIsPlanNotification,
}: any) {
  const router = useRouter();
  const script = `<script
    src="${process.env.NEXT_PUBLIC_WEBSITE_URL}embed-bot.js"
    chatbotID=${chatbotId}
    ></script>`;

  const handleOk = async () => {
    try {
      await navigator.clipboard.writeText(script);
      message.success("Content copied to clipboard");
    } catch (err: any) {
      message.error("Failed to copy ", err.message);
    }
  };
  return (
    <div className="emebed-site-container">
      <CustomModal
        open={isPlanNotification}
        setOpen={setIsPlanNotification}
        header={"Upgrade Now to create new Chatbots!"}
        content={"Upgrade now to access your chatbots!"}
        footer={
          <button
            onClick={() => {
              router.push("/home/pricing");
            }}
          >
            Upgrade Now
          </button>
        }
      />
      <div className="script">
        <p className="share-note">
          To add a chat bubble to the bottom right of your website add this
          script tag to your html
        </p>
        <p className="script-container">{script}</p>
        <button onClick={() => handleOk()}>
          <Image src={copyIcon} alt="copy-icon" />
          Copy Script
        </button>
      </div>
    </div>
  );
}

export default EmbedSite;
