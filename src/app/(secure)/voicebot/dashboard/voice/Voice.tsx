import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select, ConfigProvider } from 'antd';
import { useState } from "react";
function Voice() {
  const [stepsCount, setStepsCount] = useState<number>(5);
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
            <h4 className="emotional-header">Filler Injection Enabled</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="emotional-detect-description">This determines whether fillers are injected into the Model output before inputting it into the Voice provider.</p>

          <div className="emotional-detect">
            <h4 className="emotional-header">Backchanneling Enabled</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="emotional-detect-description">Make the bot say words like 'mhmm', 'ya' etc. while listening to make the conversation sounds natural. Default disabled</p>

          <div className="emotional-detect">
            <h4 className="emotional-header">Background Denoising Enabled</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="emotional-detect-description">Filter background noise while the user is talking.</p>

          <div className="emotional-detect">
            <h4 className="emotional-header">Use Speaker Boost</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="emotional-detect-description">Boost the similarity of the synthesized speech and the voice at the cost of some generation speed.</p>

          <hr className="splitter" />
          <div className="slider-container">
            {/* <div className="slider-wrapper-container"> */}
            <div className="left-column">
              <h4 className="emotional-header">Stability</h4>
            </div>
            <div className="right-column">
              <div className="top">
                <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
                <h4>0.6</h4>
              </div>
              <div className="bottom">
                <span>More Variable</span>
                <span>More Stable</span>
              </div>
            </div>
            {/* </div> */}
          </div>
          <hr className="splitter" />

          <div className="slider-container">
            {/* <div className="slider-wrapper-container"> */}
            <div className="left-column">
              <h4 className="emotional-header">Clarity + Similarity</h4>
            </div>
            <div className="right-column">
              <div className="top">
                <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
                <h4>0.6</h4>
              </div>
              <div className="bottom">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
            {/* </div> */}
          </div>
          <hr className="splitter" />

          <div className="slider-container">
            {/* <div className="slider-wrapper-container"> */}
            <div className="left-column">
              <h4 className="emotional-header">Style Exaggeration</h4>
            </div>
            <div className="right-column">
              <div className="top">
                <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
                <h4>0.6</h4>
              </div>
              <div className="bottom">
                <span>None (Fastest)</span>
                <span>Exaggerated</span>
              </div>
            </div>
            {/* </div> */}
          </div>
          <hr className="splitter" />

          <div className="slider-container">
            {/* <div className="slider-wrapper-container"> */}
            <div className="left-column">
              <h4 className="emotional-header">Optimize Streaming Latency</h4>
            </div>
            <div className="right-column">
              <div className="top">
                <Slider className="slider" min={2} max={10} value={stepsCount} onChange={setStepsCount} />
                <h4>3</h4>
              </div>
              <div className="bottom">
                <span>More Latency</span>
                <span>Less Latency</span>
              </div>
            </div>
            {/* </div> */}
          </div>

        </div>
      </div>

    </div>
  )
};


export default dynamic((): any => Promise.resolve(Voice), { ssr: false });
