import React, { useState } from "react";
import { Button, message } from "antd";
import Image from "next/image";
import Vapi from "@vapi-ai/web";
import CallIcon from "../../../../../public/voiceBot/SVG/call-outgoing.svg";
import "./style.scss";
import { getDate } from "@/app/_helpers/client/getTime";
const vapi = new Vapi(process.env.NEXT_PUBLIC_VAP_API as string);

enum CALLSTATUS {
  VOID,
  CONNECTING,
  LISTENING,
  SPEAKING,
  CALLSTOP,
}

const VapiAssistantCall = ({
  setMessages,
  setMessagesTime,
}: {
  setMessages: (value: any) => void;
  setMessagesTime: (value: any) => void;
}) => {
  const [isListening, setIsListening] = useState(CALLSTATUS.VOID);
  const [isMuted, setIsMuted] = useState(false);
  const [showMakeCallButton, setShowMakeCallButton] = useState(true);
  const [lastMessage, setLastMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const makeVapiAssistantCall = async () => {
    setLoading(true);
    setMessages([]);
    setMessagesTime([]);
    vapi.start(process.env.NEXT_PUBLIC_VAP_ASSISTANT_ID as string); // assistance ID
    setIsListening(CALLSTATUS.CONNECTING);
    message.success("Call has started.");
  };

  vapi.on("message", (message: any) => {
    if (
      message["type"] === "transcript" &&
      message.transcriptType === "final" &&
      message.transcript !== lastMessage
    ) {
      setMessages((prev: any) => {
        const exists = prev.some(
          (msg: any) =>
            msg.role === message["role"] && msg.content === message.transcript
        );
        if (!exists) {
          return [
            ...prev,
            { role: message["role"], content: message.transcript },
          ];
        }
        return prev;
      });
      setMessagesTime((prev: any) => [
        ...prev,
        {
          role: message["role"],
          content: message.transcript,
          messageTime: getDate(),
        },
      ]);
      setLastMessage(message.transcript);
      console.log("Final transcript added: ", message.transcript);
    }
  });

  vapi.on("call-start", () => {
    setIsListening(CALLSTATUS.CONNECTING);
    setLoading(false);
    setShowMakeCallButton(false);
    console.log("Call has started.");
  });

  vapi.on("call-end", async () => {
    vapi.stop();

    setIsMuted(false);
    setShowMakeCallButton(true);
    setMessages([]);
    setMessagesTime([]);
    setLastMessage("");
    console.log("Call has ended.");
    setIsListening(CALLSTATUS.CALLSTOP);
  });

  vapi.on("speech-start", () => {
    setIsListening(CALLSTATUS.SPEAKING);
    setShowMakeCallButton(false);
    console.log("Assistant speech has started.");
  });

  vapi.on("error", (e) => {
    console.error(e);
    setShowMakeCallButton(true);
    setIsMuted(false);
    vapi.stop();
    setIsListening(CALLSTATUS.CALLSTOP);
    setMessages([]);
    setMessagesTime([]);
    setLastMessage("");
    message.error("Error in call");
  });

  const stopCallHandler = async () => {
    setMessages([]);
    setMessagesTime([]);
    vapi.stop();
    setShowMakeCallButton(true);
    setIsMuted(false);
    setIsListening(CALLSTATUS.CALLSTOP);
    setLastMessage("");
    message.success("Call has ended.");
  };

  const muteCallHandler = () => {
    if (isMuted) {
      vapi.setMuted(false);
      setIsMuted(false);
      message.success("Unmuted");
    } else {
      vapi.setMuted(true);
      setIsMuted(true);
      message.success("Muted");
    }
  };

  return (
    <div>
      {showMakeCallButton ? (
        <Button
          className="callButton"
          onClick={makeVapiAssistantCall}
          loading={loading}
        >
          <Image src={CallIcon} alt="Call" />
          Call
        </Button>
      ) : (
        <div className="callButtonContainer">
          <button className="muteButton" onClick={muteCallHandler}>
            {isMuted ? "Unmute" : "Mute"}
          </button>
          <button className="endCallButton" onClick={stopCallHandler}>
            End Call
          </button>
        </div>
      )}
    </div>
  );
};

export default VapiAssistantCall;
