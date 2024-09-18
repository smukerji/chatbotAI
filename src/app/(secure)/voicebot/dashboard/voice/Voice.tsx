import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Slider, Switch } from 'antd';
import { Select } from 'antd';
import { useState, useContext, useEffect } from "react";
import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"


function Voice() {
  const [stepsCount, setStepsCount] = useState<number>(5);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [providerValidationMessage, setProviderValidationMessage] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const [voices, setVoices] = useState<{ value: string; label: string }[]>([]);
  const [voiceValidationMessage, setVoiceValidationMessage] = useState<string>("");

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  
  const voiceProviderList = [
      {
          value: "1",
          label: "cartesia",
          language: ["de", "en", "es", "fr", "ja", "pt", "zh"]
      },
      {
          value: "2",
          label: "11labs",
          language: ["burt", "marissa", "andrea", "sarah", "phillip", "steve", "joseph", "myra", "paula", "ryan", "drew", "paul", "mrb", "matilda", "mark"]
      },
      {
          value: "3",
          label: "rime-ai",
          language: [
              "marsh", "bayou", "creek", "brook", "flower", "spore", "glacier", "gulch", "alpine", "cove", "lagoon", "tundra", "steppe", "mesa", "grove", "rainforest", "moraine", "wildflower", "peak", "boulder", "abbie", "allison", "ally", "alona", "amber", "ana", "antoine", "armon", "brenda", "brittany", "carol", "colin", "courtney", "elena", "elliot", "eva", "geoff", "gerald", "hank", "helen", "hera", "jen", "joe", "joy", "juan", "kendra", "kendrick", "kenneth", "kevin", "kris", "linda", "madison", "marge", "marina", "marissa", "marta", "maya", "nicholas", "nyles", "phil", "reba", "rex", "rick", "ritu", "rob", "rodney", "rohan", "rosco", "samantha", "sandy", "selena", "seth", "sharon", "stan", "tamra", "tanya", "tibur", "tj", "tyler", "viv", "yadira"
          ]
      },
      {
          value: "4",
          label: "playht",
          language: ["jennifer", "melissa", "will", "chris", "matt", "jack", "ruby", "davis", "donna", "michael"]
      },
      {
          value: "5",
          label: "lmnt",
          language: ["lily", "daniel"]
      },
      {
          value: "6",
          label: "deepgram",
          language: ["asteria", "luna", "stella", "athena", "hera", "orion", "arcas", "perseus", "angus", "orpheus", "helios", "zeus"]
      },
      {
          value: "7",
          label: "openai",
        language: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
      },
      {
          value: "8",
          label: "azure",
          language: ["andrew", "brian", "emma"]
          
      },
      {
          value: "9",
          label: "neets",
          language: ["vits", "vits"]
      }
  ];

  const providerChangeHandler = (value: any, options: any) => {

    setSelectedProvider(options.label);
    setProviderValidationMessage(""); // Clear validation message on valid selection
    voiceBotContextData.updateState("voice.provider", options.label);

    // Update models based on selected provider
    const selectedProvider = voiceProviderList.find(provider => provider.label === options.label);

    if (selectedProvider) {
      setVoices(selectedProvider.language.map((lang,index) => ({ value: String(index) + ".", label: lang })));
    } else {
      setVoices([]);
    }

    setSelectedVoice(undefined);
    voiceBotContextData.updateState("voice.voiceId", undefined);

  }

  const handleProviderBlur = () => {
    if (!selectedProvider) {
      setProviderValidationMessage("Please select a provider");
    }
  }
  
  const voiceChangeHandler = (value: string, option: any) => {
    // debugger;
    setSelectedVoice(option.label);
    setVoiceValidationMessage("");// Clear validation message on valid selection
    voiceBotContextData.updateState("voice.voiceId", option.label);
  }

  const handleModelBlur = () => {
    if (selectedProvider) {
      if (!selectedVoice) {
        setVoiceValidationMessage("Please select a voiceId");
      }
    }
  }


  console.log("your voicebot details ", voicebotDetails["voice"]);

  return (
    <div className="voice-container">

      <div className="left-column">

        <h2 className="voice-configuration-title">Voice Configuration</h2>
        <p className="voice-configuration-description">Choose from the list of voices, or sync your voice library if you aren&lsquo;t able to find your voice in the dropdown. If you are still facing any error, you can enable custom voice and add a voice ID manually.</p>
        <div className="provider-container">
          <h4 className="provider">Provider</h4>
          <Select
            className={providerValidationMessage ? "select-field error-provider" : "select-field"}

            placeholder="Select the provider"

            onChange={providerChangeHandler}
            onBlur={handleProviderBlur}
            value={selectedProvider}


            options={voiceProviderList}
          />
          {providerValidationMessage && <p className="invalidation-message">{providerValidationMessage}</p>}

          <h4 className="provider model">Voice</h4>
          <Select
            className={voiceValidationMessage ? "select-field error-voice" : "select-field"}

            placeholder="Select the voice"
            onChange={voiceChangeHandler}
            onBlur={handleModelBlur}
            value={selectedVoice}

            options={voices}
          />

          {voiceValidationMessage && <p className="invalidation-message">{voiceValidationMessage}</p>}

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
          <p className="emotional-detect-description">Make the bot say words like &lsquo;mhmm&lsquo;, &lsquo;ya&lsquo; etc. while listening to make the conversation sounds natural. Default disabled</p>

          <div className="emotional-detect">
            <h4 className="emotional-header">Background Denoising Enabled</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="emotional-detect-description">Filter background noise while the user is talking.</p>

          {/* <div className="emotional-detect">
            <h4 className="emotional-header">Use Speaker Boost</h4>
            <Switch className="emotional-switch" defaultChecked />
          </div>
          <p className="emotional-detect-description">Boost the similarity of the synthesized speech and the voice at the cost of some generation speed.</p>

          <hr className="splitter" /> */}
          {/* <div className="slider-container">
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
          </div>
          <hr className="splitter" /> */}

          {/* <div className="slider-container">
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
          </div>
          <hr className="splitter" /> */}

          {/* <div className="slider-container">
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
          </div>
          <hr className="splitter" /> */}

          {/* <div className="slider-container">
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
          </div> */}

        </div>
      </div>

    </div>
  )
};


export default dynamic((): any => Promise.resolve(Voice), { ssr: false });
