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

  const iframe = ` <iframe src="${process.env.NEXT_PUBLIC_WEBSITE_URL}embed-bot?chatbotID=${chatbotId}&source=web"
  width="100%"
  style="height: 100%; min-height: 700px"
  frameborder="0"
></iframe>`;

  const handleOk = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
          To add the chatbot any where on your website, add this iframe to your
          html code
        </p>
        <p className="script-container">{iframe}</p>
        <button onClick={() => handleOk(iframe)}>
          <Image src={copyIcon} alt="copy-icon" />
          Copy Iframe
        </button>
      </div>

      <div className="script">
        <p className="share-note">
          To add a chat bubble to the bottom right of your website add this
          script tag to your html
        </p>
        <p className="script-container">{script}</p>
        <button onClick={() => handleOk(script)}>
          <Image src={copyIcon} alt="copy-icon" />
          Copy Script
        </button>
      </div>
    </div>
  );
}

export default EmbedSite;
