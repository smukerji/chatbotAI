import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import "./call-logs-design.scss";
import { Input, Slider, Switch, Button, Pagination } from 'antd';
import Image from 'next/image';
import { useWavesurfer } from '@wavesurfer/react';
import Timeline from 'wavesurfer.js/dist/plugins/timeline.esm.js';

// import microimg from "../../../../../../public/voiceBot/SVG/microphone-2.svg";

import resumeCall from '../../../../../../public/voiceBot/SVG/sound.svg';
import download from '../../../../../../public/voiceBot/SVG/document-download.svg';
import recording from '../../../../../../public/voiceBot/SVG/Mask group.svg';
import play from '../../../../../../public/voiceBot/SVG/play.svg';
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

  const formatTime = (seconds: number) =>
    [seconds / 60, seconds % 60]
      .map((v) => `0${Math.floor(v)}`.slice(-2))
      .join(':');

  const [callListData, setCallListData] = useState<ListCallResponse>();
  const containerRef = useRef(null);

  const { wavesurfer, isPlaying, currentTime, isReady } = useWavesurfer({
    container: containerRef,
    height: 100,
    waveColor: '#7c53efd5',
    progressColor: '#4d03c5',
    url: callListData?.recordingUrl,
    dragToSeek: true,
    plugins: useMemo(() => [Timeline.create()], []),
  });


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
              contacts.map((contact, index) => (
                <>
                  {index !== 0 && <hr className="splitter" />}
                  <div className='list-item'>
                    <div className='number-details'>
                      <h2 className='date'> 12, June 2024 </h2>
                      <p>  12 min </p>
                    </div>
                    <div className='switch-input'>
                      <h3>customer ended the call</h3>
                    </div>
                  </div>
                </>

              ))
            }
          </div>
          <div className='bottom-button'>
            <Pagination defaultCurrent={1} total={50} />
          </div>
        </div>

        <div className="right-container">

        </div>

      </div>
    </div>
       
  )
}

export default CallLogs;