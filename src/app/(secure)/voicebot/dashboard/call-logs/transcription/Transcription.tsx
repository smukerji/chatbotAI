import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Select, Slider, Switch, Button, message } from 'antd';
import Image from "next/image";
import addImge from "../../../../../../../public/voiceBot/SVG/add.svg";
const { TextArea } = Input;

import { useState, useContext, useEffect } from "react";

import { CreateVoiceBotContext } from "../../../../../_helpers/client/Context/VoiceBotContextApi"

function Transcription(props:any) {
  // console.log("Transcription", props.transcriptionData.transcript );
  const [transcript, setTranscript] = useState<string>(props.transcriptionData?.transcript || '');
 
  useEffect(() => {
    setTranscript(props.transcriptionData?.transcript || '');
  }, [props.transcriptionData]);

  return (
    <div className="transcription">
      <ul className="ul-list">
        {transcript ? (
          transcript
            .split('\n')
            .map((entry: string, index: number) => (
              <li className="list-item" key={index}>{entry}</li>
            ))
        ) : (
          <li className="no-list-item">No transcript available</li>
        )}
      </ul>
    </div>
  )
}

export default Transcription;