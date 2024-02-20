import { LoadingOutlined } from "@ant-design/icons";
import { Button, Modal, Spin } from "antd";
import React from "react";
import "./loadermodal.scss";
import ChatbotReady from "../../../../../../../public/svgs/chatbot_ready.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";

function LoaderModal({ isResponseOk, setIsResponseOk }: any) {
  const router = useRouter();
  const gotoHome = () => {
    setIsResponseOk(false);
    window.location.href = "/";
  };

  const gotoChatbot = () => {
    setIsResponseOk(false);
    router.push("/chatbot");
  };

  return (
    <>
      {isResponseOk == true ? (
        <Modal
          title=""
          open={true}
          centered
          className="chatbot-trained-success"
          footer={[
            <div className="success-footer">
              <Button key="back" onClick={gotoHome} className="home-btn">
                Home
              </Button>

              <Button
                key="submit"
                type="primary"
                onClick={gotoChatbot}
                className="chatbot-btn"
              >
                Go to Chatbot
              </Button>
            </div>,
          ]}
        >
          <Image src={ChatbotReady} alt="chatbot-ready" />
          <p className="chatbot-ready-text">Your Chatbot is ready!</p>
        </Modal>
      ) : (
        <Modal
          title=""
          open={true}
          centered
          footer=""
          className="chatbot-trained-loader"
        >
          <Spin indicator={<LoadingOutlined spin />} />
          <p className="please-wait-text">
            Please wait while your Chatbot getting trained
          </p>
        </Modal>
      )}
    </>
  );
}

export default LoaderModal;
