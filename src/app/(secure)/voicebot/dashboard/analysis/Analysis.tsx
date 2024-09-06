import dynamic from "next/dynamic";
import "./design.scss";
import { useState } from "react";
import { Input, Select, Slider, Switch } from 'antd';
const { TextArea } = Input;
import Property from "./property/Property";

function Analysis() {

  const [stepsCount, setStepsCount] = useState<number>(5);
  return (
    <div className="analysis-container">
      <div className="summary-container">
        <h3 className="title">Summary</h3>
        <p className="description">This is the prompt that&lsquo;s used to summarize the call. The output is stored in call.analysis.summary. You can also find the summary in the Call Logs Page.</p>
        <div className="content-wrapper">
          <h4 className="text-area-title">Prompt</h4>
          <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..." />

        </div>
      </div>

      <div className="success-evaluation-container spacer">
        <h3 className="title">Success Evaluation</h3>
        <p className="description">Evaluate if your call was successful. You can use Rubric standalone or in combination with Success Evaluation Prompt. If both are provided, they are concatenated into appropriate instructions.</p>
        <div className="content-wrapper">
          <h4 className="text-area-title">Prompt</h4>
          <p className="text-area-description">This is the prompt that&lsquo;s used to evaluate if the call was successful.</p>
          <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..." />

          <h4 className="text-area-title spacer">Success Evaluation Rubric</h4>
          <p className="text-area-description">This enforces the rubric of the evaluation upon the Success Evaluation. </p>
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
        </div>
      </div>

      <div className="structure-data-container spacer">
        <h3 className="title">Success Evaluation</h3>
        <p className="description">Evaluate if your call was successful. You can use Rubric standalone or in combination with Success Evaluation Prompt. If both are provided, they are concatenated into appropriate instructions.</p>
        <div className="content-wrapper">
          <h4 className="text-area-title">Prompt</h4>
          <p className="text-area-description">This is the prompt that&lsquo;s used to evaluate if the call was successful.</p>
          <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..." />

          <Property/>


        </div>
      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Analysis), { ssr: false });