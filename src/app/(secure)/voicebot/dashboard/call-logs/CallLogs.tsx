import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import "./call-logs-design.scss";
import { Input, Slider, Switch, Button, Pagination, Tabs } from 'antd';
import Image from 'next/image';
import { useWavesurfer } from '@wavesurfer/react';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';

// import microimg from "../../../../../../public/voiceBot/SVG/microphone-2.svg";

import resumeCall from '../../../../../../public/voiceBot/SVG/sound.svg';
import download from '../../../../../../public/voiceBot/SVG/document-download.svg';
import recording from '../../../../../../public/voiceBot/SVG/Mask group.svg';
import play from '../../../../../../public/voiceBot/SVG/play.svg';
import playCircle from '../../../../../../public/voiceBot/SVG/play-circle.svg';
import pauseCircle from '../../../../../../public/voiceBot/SVG/pause-circle.svg';

import messageText from '../../../../../../public/voiceBot/SVG/message-text.svg';
import messageTextColor from '../../../../../../public/voiceBot/SVG/message-text-colored.svg';

import clock from '../../../../../../public/voiceBot/SVG/clock.svg';
import shadeClock from '../../../../../../public/voiceBot/SVG/clock-shade.svg';

import pause from '../../../../../../public/voiceBot/SVG/pause.svg';

import { Flex, Modal, message, Spin } from 'antd';
type ListCallResponseMessage = {
  role: string;
  message: string;
};

type ListCallResponse = {
  id: string;
  assistantId: string;
  type: string;
  startedAt: string;
  endedAt: string;
  transcript: string;
  recordingUrl: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  cost: number;
  status: string;
  endedReason: string;
  messages: ListCallResponseMessage;
};



function CallLogs() {
  const [loading, setLoading] = useState<boolean>(false);
  const contacts = [
    { id: 1, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: true },
    { id: 2, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 3, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 4, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false },
    { id: 5, phone: '+84 (353) 085 867', email: 'tuan@sapakh.ai', toggle: false }

  ];

  const Log_Transcriber_Data = [
    {
      id: 1,
      image: clock,
      image2: shadeClock,
      name: "Logs",
      children:"Logs Div"
    },
    {
      id: 2,
      image: messageText,
      image2: messageTextColor,
      name: "Transcriber",
      children:"Transcriber Div"
    }
  ]

  const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
      .map((v) => `0${Math.floor(v)}`.slice(-2))
      .join(':');

  const [callListData, setCallListData] = useState<ListCallResponse>();
  const [callLogsList, setCallLogsList] = useState<ListCallResponse[]>([]);
  const containerRef = useRef(null);

  const [activeKey, setActiveKey] = useState("");

  let callLogResponse:any;

  async function getLogRecord(){
    const options = {
      method: 'GET',
      headers: {Authorization: 'Bearer 36d15d26-9036-4dcc-b646-0f7564106615'}
    };

    debugger;

    callLogResponse = await fetch('https://api.vapi.ai/v2/call?limit=10&page=1&assistantId=9529df0a-110c-48ee-8de2-6a851e5b4352', options);

    const data = await callLogResponse.json();

    setCallLogsList(data.results);


  }


  useEffect( () => {

    getLogRecord();


  }, []);

  console.log("your call logs ", callLogsList);


  let activeLog = 2;
  const callLogIds = [
    {
      id: '1',
      startTime: '2023-10-01T10:00:00Z',
      endedReason: 'user-ended',
      duration: '5m',
    },
    {
      id: '2',
      startTime: '2023-10-01T11:00:00Z',
      endedReason: 'network-issue',
      duration: '10m',
    },
    {
      id: '3',
      startTime: '2023-10-01T12:00:00Z',
      endedReason: 'user-ended',
      duration: '15m',
    },
    {
      id: '4',
      startTime: undefined,
      endedReason: 'call-failed',
      duration: '0m',
    },
  ];



  const { wavesurfer, isPlaying, currentTime, isReady } = useWavesurfer({
    container: containerRef,
    height: 80,
    waveColor: '#869ae1',
    progressColor: '#4D72F5',
    url: "https://auth.vapi.ai/storage/v1/object/public/recordings/fbadc714-a0d8-46af-b1bd-016b03c4d454-1725462488293-b330180c-2642-4ced-97c9-34d895095736-mono.wav",
    dragToSeek: true,
    plugins: useMemo(() => [Timeline.create()], []),
  });

  wavesurfer?.on('ready', (data: any) => {
    console.log('on ready ', data);
    // wavesurfer.setTime(1)
  });

  const onPlayPause = useCallback(() => {
    wavesurfer && wavesurfer.playPause();
  }, [wavesurfer]);

  const onTabChange = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
  };

  console.log("state active key ", activeKey);


  return (
    <div className='call-log-container'>
      <div className='top-container'>
        <Button>Today</Button>
        <Button>Last 7 day</Button>
        <Button>Last month</Button>
        <Button>Select date range</Button>

      </div>
      <div className='bottom-container'>

        <div className="left-container">
          <div className='list-items'>
            {
              callLogsList.map((contact, index) => (
                <div key={index}>
                  {index !== 0 && <hr className="splitter" />}
                  <div className='list-item' >
                    <div className='number-details'>
                      <h2 className='date'>{contact.createdAt} </h2>
                      <p>  12 min </p>
                    </div>
                    <div className='switch-input'>
                      <h3>customer ended the call</h3>
                    </div>
                  </div>
                </div>

              ))
            }
          </div>
          <div className='bottom-button'>
            <Pagination defaultCurrent={1} total={50}  />
          </div>
        </div>

        <div className="right-container">
          <div className="recording-panel">
            <h3 className='title'>Call Logs</h3>
            <p className='description'>This section allows you to configure the model for the assistant.</p>
            <div className="recording-area">
              <div ref={containerRef}></div>
            </div>
            <div className='buttons-wrapper'>
              <div className='play-pause'>
                <Button>
                  <Image alt="phone-call" src={playCircle}></Image>
                </Button>
                <span className="button-text">0:00</span>
              </div>
            
              <Button className='download-btn'>
                <Image alt='downlaod' src={download}></Image>
                <span className='download-text'>Download</span>
              </Button>
            </div>
          </div>
          <div className="logs-transcript">
            <Tabs
              defaultActiveKey="1"
              items={Log_Transcriber_Data.map((Icon, i) => {
                const id:string = String(Icon.id);
                return {
                  key: id,
                  label: ` ${Icon.name}`,
                  children: `${Icon.children}`,
                  icon: <Image alt="Icon-Image" src={activeKey === "1" ? Icon.image : Icon.image2}></Image>,
                };
              },
              
              )}
              onChange={onTabChange}
             
            />
          </div>
        </div>

      </div>
    </div>
       
  )
}

export default CallLogs;