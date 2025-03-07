import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
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
import Transcription from './transcription/Transcription';
import { CreateVoiceBotContext } from '@/app/_helpers/client/Context/VoiceBotContextApi';
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
const formatTime = (seconds: number) =>
  [seconds / 60, seconds % 60]
    .map((v) => `0${Math.floor(v)}`.slice(-2))
    .join(':');


function CallLogs() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  
  const [callListData, setCallListData] = useState<ListCallResponse>();
  const [callLogsList, setCallLogsList] = useState<ListCallResponse[]>([]);



  const Log_Transcriber_Data = [
   
    {
      id: 1,
      image: messageText,
      image2: messageTextColor,
      name: "Transcription",
      children: <Transcription transcriptionData={callListData} />
    },
     {
      id: 2,
      image: clock,
      image2: shadeClock,
      name: "Logs",
      children: <h2>Comming soon...</h2>
    }
  ]

 

    const containerRef = useRef(null);

  const [selectedLog, setSelectedLog] = useState<number>(0);
  const [activeKey, setActiveKey] = useState("");

  let callLogResponse:any;

  async function getLogRecord(pageNumber:number = 1,pageLimit:number = 10) {

    
    setLoading(true);
    ;

    const options = {
      method: 'GET',
      headers: {Authorization: process.env.NEXT_PUBLIC_VAP_PRI_KEY as string} //private api key
    };

    let assId = voiceBotContextData.assistantInfo["vapiAssistantId"];
    ;

    try {
      callLogResponse = await fetch(`https://api.vapi.ai/v2/call?limit=${pageLimit}&page=${pageNumber}&assistantId=${assId}`, options);
      const data = await callLogResponse.json();
      debugger;
      setCallLogsList(data.results);
      setCallLogUrl(data.results[0]?.recordingUrl);
      const firstCallLog = data.results[0];
      ;

      let resData: ListCallResponse = {
        id: firstCallLog.id,
        assistantId: firstCallLog.assistantId,
        type: firstCallLog.type,
        startedAt: firstCallLog.startedAt,
        endedAt: firstCallLog.endedAt,
        transcript: firstCallLog.transcript,
        recordingUrl: firstCallLog.recordingUrl,
        summary: firstCallLog.summary,
        createdAt: firstCallLog.createdAt,
        updatedAt: firstCallLog.updatedAt,
        orgId: firstCallLog.orgId,
        cost: firstCallLog.cost,
        status: firstCallLog.status,
        endedReason: firstCallLog.endedReason,
        messages: firstCallLog.messages,
      };

      //set the callListData
      setCallListData(resData);



      //manage the pagination data
      let totalPage = data.metadata.totalItems / data.metadata.itemsPerPage;
      if (totalPage % 1 !== 0) {
        totalPage = Math.floor(totalPage) + 1;
        totalPage = totalPage * pageLimit;
      }

      setTotalPages(totalPage);

      setLoading(false);

    }
    catch (error: any) {

      setLoading(false);
    }

    
  }

  useEffect( () => {
  ;
    getLogRecord();

  }, []);

  console.log("your call logs ", callLogsList);

  const activeLogChangeHandler = (index:number)=>{
    setSelectedLog(index);
    setCallLogUrl(callLogsList[index].recordingUrl);
    const data = callLogsList[index];
    ;

    let resData: ListCallResponse = {
      id: data.id,
      assistantId: data.assistantId,
      type: data.type,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      transcript: data.transcript,
      recordingUrl: data.recordingUrl,
      summary: data.summary,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      orgId: data.orgId,
      cost: data.cost,
      status: data.status,
      endedReason: data.endedReason,
      messages: data.messages,
    };

     //set the callListData
     setCallListData(resData);
  }

  const [callLogUrl, setCallLogUrl] = useState<string>('');

  const { wavesurfer, isPlaying, currentTime, isReady } = useWavesurfer({
    container: containerRef,
    height: 80,
    waveColor: '#869ae1',
    progressColor: '#4D72F5',
    url:callLogUrl,
    //  "https://auth.vapi.ai/storage/v1/object/public/recordings/fbadc714-a0d8-46af-b1bd-016b03c4d454-1725462488293-b330180c-2642-4ced-97c9-34d895095736-mono.wav",
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

  // Define the function to format call duration
const formatCallDuration = (createdAt: string, endedAt: string): string => {
  const start = new Date(createdAt);
  const end = new Date(endedAt ? endedAt : createdAt);
  const diffMs = end.getTime() - start.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const hours = Math.floor(diffSecs / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);
  const seconds = diffSecs % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

  console.log("state active key ", activeKey);

  const paginationDataHandler = (page: number,pageLimit:number) => {
    setCurrentPage(page);
    ;
    getLogRecord(page,pageLimit);
  }


  return (
    <div className='call-log-container'>
      {
        !loading ? (
          callLogsList?.length >= 1 ?          
    <>
            <div className='top-container'>


            </div>
            <div className='bottom-container'>

              <div className="left-container">
                <div className='list-items'>
                  {
                    callLogsList.map((contact, index) => (
                      <div key={index}>
                        {index !== 0 && <hr className="splitter" />}
                        <div className={selectedLog == index ? 'list-item list-item-active' : 'list-item'} onClick={() => activeLogChangeHandler(index)} >
                          <div className='number-details'>
                              <h2 className='date'>{new Date(contact.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} </h2>
                              <p>
                              {formatCallDuration(contact.createdAt, contact.endedAt)}
                              </p>
                          </div>
                          <div className='switch-input'>
                            <h3>{contact?.endedReason?.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</h3>
                          </div>
                        </div>
                      </div>

                    ))
                  }
                </div>
                <div className='bottom-button'>
                  <Pagination current={currentPage} onChange={paginationDataHandler} total={totalPages}    />
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
                      <Button onClick={onPlayPause}>
                        
                          <Image width={30}
                            height={32} alt="phone-call" src={isPlaying ? pause : playCircle}></Image>
                      </Button>
                      <span className="button-text">{formatTime(currentTime)}</span>
                    </div>
                  
                    <Button className='download-btn'   onClick={() =>
                        window.open(callListData?.recordingUrl, '_blank')
                      }>
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
                        children:Icon.children,
                        icon: <Image alt="Icon-Image" src={activeKey === "1" ? Icon.image : Icon.image2}></Image>,
                      };
                    },
                    
                    )}
                    onChange={onTabChange}
                  
                  />
                </div>
              </div>

            </div>
            </>
            :
            <>
              <div className='no-logs-container'>
                No Call Logs available, Yet!
              </div>
            </>
        ) : (
          <Flex align="center" gap="middle" className="loader">
          <Spin size="large" />
        </Flex>

        )
      }
      
      
    </div>
       
  )
}

export default CallLogs;