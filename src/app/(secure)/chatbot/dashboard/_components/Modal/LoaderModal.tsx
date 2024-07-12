import { LoadingOutlined } from "@ant-design/icons";
import { Button, Modal, Spin } from "antd";
import React, { useEffect, useRef, useState } from "react";
import "./loadermodal.scss";
import ChatbotReady from "../../../../../../../public/svgs/chatbot_ready.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gif from "../../../../../../../public/create-chatbot-svgs/create-bot-animation.gif";
import Lottie from "lottie-react";
import loadertik from "../../../../../../../public/loadertik.json";

function LoaderModal({ isResponseOk, setIsResponseOk }: any) {
  const [isPlaying, setIsPlaying] = useState(true);
  const animationRef = useRef<any>(null);
  const router = useRouter();
  const gotoHome = () => {
    setIsResponseOk(false);
    window.location.href = "/";
  };

  const gotoChatbot = () => {
    setIsResponseOk(false);
    router.push("/chatbot");
  };

  const handleAnimationComplete = () => {
    console.log("Animation completed");
    setIsPlaying(false);
  };
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.goToAndStop(30, true); // Pause at frame 30
    }
  }, []);

  useEffect(() => {
    if (isResponseOk && animationRef.current) {
      animationRef.current.playSegments(
        [30, animationRef.current.totalFrames],
        true
      );
    }
  }, [isResponseOk]);

  return (
    <>
      {isResponseOk == true && isPlaying == false ? (
        <Modal
          title=""
          open={true}
          centered
          className="chatbot-trained-success"
          footer={[
            <div className="success-footer" key={1}>
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
          <Lottie
            lottieRef={animationRef}
            animationData={loadertik}
            aria-aria-labelledby="use lottie animation"
            loop={false}
            onComplete={handleAnimationComplete}
          />
          <p className="training-chatbot">Training your Chatbot</p>
          <p className="please-wait-text">
            Please wait while your Chatbot is getting trained!
          </p>
        </Modal>
        // <></>
      )}
    </>
  );
}

export default LoaderModal;
