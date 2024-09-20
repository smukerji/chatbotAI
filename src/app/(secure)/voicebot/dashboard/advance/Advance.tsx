import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
import Image from "next/image";
import security from "../../../../../../public/voiceBot/SVG/security.svg";
import videoimg from "../../../../../../public/voiceBot/SVG/video.svg";
import microimg from "../../../../../../public/voiceBot/SVG/microphone-2.svg";
import timerImg from "../../../../../../public/voiceBot/SVG/timer.svg";
import timerPauseImg from "../../../../../../public/voiceBot/SVG/timer-pause.svg";
import infoCircleImg from "../../../../../../public/voiceBot/SVG/info-circle.svg";
import qoutDownImg from "../../../../../../public/voiceBot/SVG/quote-down-circle.svg";
import tickSquareImg from "../../../../../../public/voiceBot/SVG/tick-square.svg";
import firstLineImg from "../../../../../../public/voiceBot/SVG/firstline.svg";

import { useState, useContext, useEffect } from "react";

import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"

const { Option } = Select;
function Advance() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;


  const [stepsCount, setStepsCount] = useState<number>(5);

  /**
   * @param Privacy
   */
  const [hipaaCompliance, sethipaaCompliance] = useState<boolean>(false);
  const [audioRecording, setaudioRecording] = useState<boolean>(true);
  const [videoRecording, setvideoRecording] = useState<boolean>(false);

  /**
   * 
   * @param PipelineConfiguration
   */
  
  const [silenceTimeout, setSilenceTimeout] = useState<number>(300); //available
  const [responseDelay, setResponseDelay] = useState<number>(1.5);
  const [llmRequestDelay, setLlmRequestDelay] = useState<number>(1.5);
  const [interruptionThreshold, setInterruptionThreshold] = useState<number>(6);
  const [maximumDuration, setMaximumDuration] = useState<number>(1600); //available

  /**
   * 
   * @param Messaging
   */

  const [serverUrl, setServerUrl] = useState<string>("");
  const [clientMessages, setClientMessages] = useState<string[]>([]);
  const [serverMessages, setServerMessages] = useState<string[]>([]);
  const [voicemailMessage, setVoicemailMessage] = useState<string>("");
  const [endCallMessage, setEndCallMessage] = useState<string>("");
  const [idleMessage, setIdleMessage] = useState<string[]>([]);

  const clientMessageList = [
    { value: "1", label: "conversation update" },
    { value: "2", label: "function-call" },
    { value: "3", label: "function-call-result" },
    { value: "4", label: "hang" },
    { value: "5", label: "metadata" },
    { value: "6", label: "model-output" },
    { value: "7", label: "speech-update" },
    { value: "8", label: "status update" },
    { value: "9", label: "transcript" },
    { value: "10", label: "tool-calls" },
    { value: "11", label: "tools-calls-result" },
    { value: "12", label: "user-interrupted" },
    { value: "13", label: "voice-input" }
  ];

  const serverUrlInputHandler = (e:React.ChangeEvent<HTMLInputElement>)=>{
    setServerUrl(e.target.value.trim());
    voiceBotContextData.updateState("serverUrl", e.target.value.trim());
  }

  const silenceTimeoutChangeHandler = (value: number) => {
    setSilenceTimeout(value);
    voiceBotContextData.updateState("silenceTimeoutSeconds", value);
  }

  const responseDelayChangeHandler = (value: number) => {
    setResponseDelay(value);
  }

  const llmRequestDelayChangeHandler = (value: number) => {
    setLlmRequestDelay(value);
  }

  const interruptionThresholdChangeHandler = (value: number) => {
    setInterruptionThreshold(value);
  }

  const maximumDurationChangeHandler = (value: number) => {
    setMaximumDuration(value);
    voiceBotContextData.updateState("maxDurationSeconds", value);
  }

  const hipaaCheckChangeHandler = (checked: boolean) => {
    sethipaaCompliance(checked);
    console.log("checked ", checked);

    voiceBotContextData.updateState("hipaaEnabled", checked);
  }

  const audioRecordingCheckChangeHandler = (checked: boolean) => {
    setaudioRecording(checked);
    console.log("checked ", checked);

    voiceBotContextData.updateState("analysisPlan.artifactPlan.recordingEnabled", checked);
  }

  const videoRecordingCheckChangeHandler = (checked: boolean) => {
    setvideoRecording(checked);
    console.log("checked ", checked);

    voiceBotContextData.updateState("analysisPlan.artifactPlan.videoRecordingEnabled", checked);
  }

  const clientMessageChangeChangeHandler = (value: any, options: any) => {
    setClientMessages(options);
    voiceBotContextData.updateState("clientMessages", options);
  }
  
  console.log("clientMessages", voicebotDetails["clientMessages"]);

  return (
    <div className="advance-container">
      <h3 className="title">
        Privacy
      </h3>
      <p className="description">
        We&lsquo;ve pre-built functions for common use cases. You can enable them and configure them below.
      </p>
      <div className="privacy-container">
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={security} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">HIPAA Compliance</h3>
              <Switch className="hipaa-complaince-switch" value={hipaaCompliance} onChange={hipaaCheckChangeHandler} />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>


        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={videoimg} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">Video Recording</h3>
              <Switch className="hipaa-complaince-switch" value={videoRecording} onChange={videoRecordingCheckChangeHandler} />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>

        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="first-container">
            <Image alt="security" src={microimg} width={100}></Image>
          </div>
          <div className="second-container">
            <div className="second-container-content">
              <h3 className="compliance-title">Audio Recording</h3>
              <Switch className="hipaa-complaince-switch" value={audioRecording} onChange={audioRecordingCheckChangeHandler} />
            </div>
            <p className="description">
              When this is enabled, no logs, recordings, or transcriptions will be stored.
            </p>
          </div>

        </div>
      </div>

      <h3 className="title space-imp">
        Pipeline Configuration
      </h3>
      <p className="description">
        This section allows you to configure the pipeline settings for the assistant.
      </p>

      <div className="pipe-container">
        <div className="privacy-container-item">
          <div className="left-column">
            <div className="first-container">
              <Image alt="security" src={timerImg} width={100}></Image>
            </div>
            <div className="second-container">
              <div className="second-container-content">
                <h3 className="compliance-title">Silence Timeout</h3>

              </div>
              <p className="description">
                How long to wait before a call is automatically ended due to inactivity.
              </p>
            </div>
          </div>
          <div className="right-column">
            <div className="thrid-container-content">
              <Slider className="slider" step={1} min={10} max={600} value={silenceTimeout} onChange={silenceTimeoutChangeHandler} />
              <div className="point-notation">
                <span className="point-notation-value">10(sec)</span>
                <span className="point-notation-value">600(sec)</span>
              </div>
            </div>
            <div className="fourth-container-content">
              <h2 className="selectedValue">
                {silenceTimeout}
              </h2>
            </div>
          </div>
        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="left-column">
            <div className="first-container">
              <Image alt="security" src={timerPauseImg} width={100}></Image>
            </div>
            <div className="second-container">
              <div className="second-container-content">
                <h3 className="compliance-title">Response Delay</h3>

              </div>
              <p className="description">
                The minimum number of seconds the assistant waits after user speech before it starts speaking.
              </p>
            </div>
          </div>
          <div className="right-column">
            <div className="thrid-container-content">
              <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
              <div className="point-notation">
                <span className="point-notation-value">10(sec)</span>
                <span className="point-notation-value">600(sec)</span>
              </div>
            </div>
            <div className="fourth-container-content">
              <h2 className="selectedValue">
                1.5
              </h2>
            </div>
          </div>
        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="left-column">
            <div className="first-container">
              <Image alt="security" src={infoCircleImg} width={100}></Image>
            </div>
            <div className="second-container">
              <div className="second-container-content">
                <h3 className="compliance-title">LLM Request Delay</h3>

              </div>
              <p className="description">
                The minimum number of seconds to wait after punctuation before sending a request to the LLM.
              </p>
            </div>
          </div>
          <div className="right-column">
            <div className="thrid-container-content">
              <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
              <div className="point-notation">
                <span className="point-notation-value">10(sec)</span>
                <span className="point-notation-value">600(sec)</span>
              </div>
            </div>
            <div className="fourth-container-content">
              <h2 className="selectedValue">
                1.5
              </h2>
            </div>
          </div>
        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="left-column">
            <div className="first-container">
              <Image alt="security" src={qoutDownImg} width={100}></Image>
            </div>
            <div className="second-container">
              <div className="second-container-content">
                <h3 className="compliance-title">Interruption Threshold</h3>

              </div>
              <p className="description">
                The number of words the user must say before the assistant considers being interrupted.
              </p>
            </div>
          </div>
          <div className="right-column">
            <div className="thrid-container-content">
              <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
              <div className="point-notation">
                <span className="point-notation-value">10(sec)</span>
                <span className="point-notation-value">600(sec)</span>
              </div>
            </div>
            <div className="fourth-container-content">
              <h2 className="selectedValue">
                6
              </h2>
            </div>
          </div>
        </div>
        <hr className="splitter" />
        <div className="privacy-container-item">
          <div className="left-column">
            <div className="first-container">
              <Image alt="security" src={tickSquareImg} width={100}></Image>
            </div>
            <div className="second-container">
              <div className="second-container-content">
                <h3 className="compliance-title">Maximum Duration</h3>

              </div>
              <p className="description">
                The maximum number of seconds a call will last.
              </p>
            </div>
          </div>
          <div className="right-column">
            <div className="thrid-container-content">
              <Slider className="slider" step={1} min={10} max={3600} value={maximumDuration} onChange={maximumDurationChangeHandler} />
              <div className="point-notation">
                <span className="point-notation-value">10(sec)</span>
                <span className="point-notation-value">3600(sec)</span>
              </div>
            </div>
            <div className="fourth-container-content">
              <h2 className="selectedValue">
                {maximumDuration}
              </h2>
            </div>
          </div>
        </div>


      </div>

      <h3 className="title space-imp">
        Messaging
      </h3>
      <p className="description">
        Message configuration for messages that are sent to and from the assistant.
      </p>

      <div className="messaging-contaner">
        <div className="messeging-container-content">
          <h4 className="title">
            Server URL
          </h4>
          <p className="description">
            This is the URL Vapi will use to communicate messages via HTTP POST Requests. This is used for retrieving context, function calling, and end-of-call reports. <a href="" className="read-more">Read more</a>
          </p>
          <Input className="input-field" value={serverUrl} placeholder="Endpoint Url to handle Server Messages" onChange={serverUrlInputHandler} />

          <hr className="splitter" />
        </div>
        <div className="messeging-container-content">
          <h4 className="title">
            Client Messages
          </h4>
          <p className="description">
            These are the messages that will be sent to the Client SDKs.
          </p>
          <Select className="select-field"
            mode="multiple"
            placeholder="Select the provider"
            allowClear
            options={clientMessageList}
            onChange={clientMessageChangeChangeHandler}
            value={clientMessages}

          />

          <hr className="splitter" />
        </div>
        <div className="messeging-container-content">
          <h4 className="title">
            Server Messages
          </h4>
          <p className="description">
            These are the messages that will be sent to the Server URL configured.
          </p>
          <Select className="select-field"

            placeholder="Select the provider"
            mode="multiple"
            allowClear

            options={[
              {
                value: '1',
                label: 'deepgram',
              },
              {
                value: '2',
                label: 'talkscriber',
              },
              {
                value: '3',
                label: 'gladia',
              }
            ]}
          />

          <hr className="splitter" />
        </div>
        <div className="messeging-container-content">
          <h4 className="title">
            Voicemail Message
          </h4>
          <p className="description">
            This is the message that the assistant will say if the call is forwarded to voicemail.
          </p>
          <Input className="input-field" placeholder="https://www.yourserver.com/api" />

          <hr className="splitter" />
        </div>
        <div className="messeging-container-content">
          <h4 className="title">
            End Call Message
          </h4>
          <p className="description">
            This is the message that the assistant will say if it ends the call.
          </p>
          <Input className="input-field" placeholder="https://www.yourserver.com/api" />

          <hr className="splitter" />
        </div>
        <div className="messeging-container-content">
          <h4 className="title">
            Idle Message
          </h4>
          <p className="description">
            Messages that the assistant will speak when the user hasn&lsquo;t responded.
          </p>
          <Select className="select-field"

            placeholder="Select the provider"
           

            options={[
              {
                value: '1',
                label: 'deepgram',
              },
              {
                value: '2',
                label: 'talkscriber',
              },
              {
                value: '3',
                label: 'gladia',
              }
            ]}
          />

          {/* <hr className="splitter" /> */}
        </div>
        <div className="messesing-content-bottom-content">
        <div className="privacy-container-item">
            <div className="left-column">
              <div className="first-container">
                <Image alt="security" src={firstLineImg} width={100}></Image>
              </div>
              <div className="second-container">
                <div className="second-container-content">
                  <h3 className="compliance-title">Max Idle Messages</h3>

                </div>
                <p className="description">
                  Maximum number of times idle messages can be spoken during the call.
                </p>
              </div>
            </div>
            <div className="right-column">
              <div className="thrid-container-content">
                <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
                <div className="point-notation">
                  <span className="point-notation-value">1</span>
                  <span className="point-notation-value">10</span>
                </div>
              </div>
              <div className="fourth-container-content">
                <h2 className="selectedValue">
                  6
                </h2>
              </div>
            </div>
          </div>
          {/* <hr className="splitter" /> */}
          <div className="privacy-container-item">
            <div className="left-column">
              <div className="first-container">
                <Image alt="security" src={timerImg} width={100}></Image>
              </div>
              <div className="second-container">
                <div className="second-container-content">
                  <h3 className="compliance-title">Idle Timeout</h3>

                </div>
                <p className="description">
                  Timeout in seconds before an idle message is spoken.
                </p>
              </div>
            </div>
            <div className="right-column">
              <div className="thrid-container-content">
                <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
                <div className="point-notation">
                  <span className="point-notation-value">5(sec)</span>
                  <span className="point-notation-value">10(sec)</span>
                </div>
              </div>
              <div className="fourth-container-content">
                <h2 className="selectedValue">
                  6
                </h2>
              </div>
            </div>
          </div>
        </div>
        
      </div>



    </div>
  );
}

export default dynamic((): any => Promise.resolve(Advance), { ssr: false });