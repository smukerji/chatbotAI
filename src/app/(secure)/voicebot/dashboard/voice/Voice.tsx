import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
function Voice() {
  return (
    <div className="voice-container">

      <div className="left-column">

        <h2 className="voice-configuration-title">Voice Configuration</h2>
        <p className="voice-configuration-description">Choose from the list of voices, or sync your voice library if you aren't able to find your voice in the dropdown. If you are still facing any error, you can enable custom voice and add a voice ID manually.</p>
        <div className="provider-container">
          <h4 className="provider">Provider</h4>
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

          <h4 className="provider model">Voice</h4>
          <Select
            className="select-field"

            placeholder="Select the voice model"


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

      </div>
      <div className="right-column">
        <h2 className="title">
          Additional Configuration
        </h2>
        <p className="description">These are the punctuations that are considered valid boundaries or delimiters. This helps decides the chunks that are sent to the voice provider for the voice generation as the LLM tokens are streaming in.</p>
        <div className="config-container">
          <div className="wrapper">
            <div className="wrapper-content">
              <h4>Background Sound</h4>
              <Select
                className="select-field"

                placeholder="Select the voice model"


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
            <div className="wrapper-content">
              <h4>Input Min Characters</h4>
              <Select
                className="select-field"

                placeholder="Select the voice model"


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
          </div>

          <h4 className="provider">Punctuation Boundaries</h4>
          <Select
            className="select-field"

            placeholder="No Puncutation Boundaries Added."


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

          <div className="emotional-detect">
            <h4 className="emotional-header">Detect Emotion</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>

          <div className="emotional-detect">
            <h4 className="emotional-header">Backchanneling Enabled</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>

          <div className="emotional-detect">
            <h4 className="emotional-header">Background Denoising Enabled</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>


        </div>
      </div>

    </div>
  )
};


export default dynamic((): any => Promise.resolve(Voice), { ssr: false });
