import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';

import { useState } from "react";


const { TextArea } = Input;

function Transcriber() {
  return (
    <div className="transcribe-container">
      <h4 className="provider">Provider</h4>
      <Select
        className="select-field"

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

      <h4 className="provider model">Model</h4>
      <Select
        className="select-field"

        placeholder="Select the model"


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
      <p className="model-info">GPT-4 is more accurate but slower and costlier than GPT-3.5 Turbo (1 min = 1 credit for GPT-3.5 Turbo, 20 credits for GPT-4).</p>

      <h4 className="provider language">Language</h4>
      <Select
        className="select-field"

        placeholder="Select the model"


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

    </div>
  )
}

export default dynamic((): any => Promise.resolve(Transcriber), { ssr: false });