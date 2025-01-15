import dynamic from "next/dynamic";
import "./design.scss";
import { Input, Select, Slider, Switch } from 'antd';
const { TextArea } = Input;
import Property from "./property/Property";

import { useState, useContext, useEffect } from "react";

import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"

function Analysis() {

  const voiceBotContextData: any = useContext(CreateVoiceBotContext);
  const voicebotDetails = voiceBotContextData.state;

  const [systemPrompts, setSystemPrompts] = useState<string>();
  const [successEvaluationPrompts, setSuccessEvaluationPrompts] = useState<string>();
  const [evaluationRubik, setEvaluationRubik] = useState<string>();
  const [structuredDataPrompts, setStructuredDataPrompts] = useState<string>();
  const [stepsCount, setStepsCount] = useState<number>(5);

  const systemPromptEnterHandler = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    const enteredValue: string = e.target.value;
    setSystemPrompts(enteredValue);
    voiceBotContextData.updateState("analysisPlan.summaryPrompt", enteredValue.trim());
  }

  const successEvaluationPromptEnterHandler = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    const enteredValue: string = e.target.value;
    setSuccessEvaluationPrompts(enteredValue);
    voiceBotContextData.updateState("analysisPlan.successEvaluationPrompt", enteredValue.trim());
  }

  const structuredDataPromptEnterHandler = (e:React.ChangeEvent<HTMLTextAreaElement>) => {
    const enteredValue: string = e.target.value;
    setStructuredDataPrompts(enteredValue);
    voiceBotContextData.updateState("analysisPlan.structuredDataPrompt", enteredValue.trim());
  }


  const rubikChangeHandler = (value: string, option: any) => {
    // ;
    setEvaluationRubik(option.label);
    voiceBotContextData.updateState("analysisPlan.successEvaluationRubric", option.label);
  }

    // console.log("server messages ",serverMessages);
    console.log("your voicebot details ", voicebotDetails["analysisPlan"]);


  const evaluationRubicList = [
    { "value": "1", "label": "NumericScale" },
    { "value": "2", "label": "DescriptiveScale" },
    { "value": "3", "label": "Checklist" },
    { "value": "4", "label": "Matrix" },
    { "value": "5", "label": "PercentageScale" },
    { "value": "6", "label": "LikertScale" },
    { "value": "7", "label": "AutomaticRubric" },
    { "value": "8", "label": "PassFail" }
  ];



  return (
    <div className="analysis-container">
      <div className="summary-container">
        <h3 className="title">Summary</h3>
        <p className="description">This is the prompt that&lsquo;s used to summarize the call. The output is stored in call.analysis.summary. You can also find the summary in the Call Logs Page.</p>
        <div className="content-wrapper">
          <h4 className="text-area-title">Prompt</h4>
          <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..." 
          value={systemPrompts}
          onChange={systemPromptEnterHandler}
          />
        </div>
      </div>

      <div className="success-evaluation-container spacer">
        <h3 className="title">Success Evaluation</h3>
        <p className="description">Evaluate if your call was successful. You can use Rubric standalone or in combination with Success Evaluation Prompt. If both are provided, they are concatenated into appropriate instructions.</p>
        <div className="content-wrapper">
          <h4 className="text-area-title">Prompt</h4>
          <p className="text-area-description">This is the prompt that&lsquo;s used to evaluate if the call was successful.</p>
          <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..." 
          value={successEvaluationPrompts}
          onChange={successEvaluationPromptEnterHandler}
          />

          <h4 className="text-area-title spacer">Success Evaluation Rubric</h4>
          <p className="text-area-description">This enforces the rubric of the evaluation upon the Success Evaluation. </p>
          <Select
            className="select-field"

            placeholder="Select the provider"
            onChange={rubikChangeHandler}
            value={evaluationRubik}

            options={evaluationRubicList}
          />
        </div>
      </div>

      <div className="structure-data-container spacer">
        <h3 className="title">Structured Data</h3>
        <p className="description">Extract structured data from call conversation. You can use Data Schema standalone or in combination with Structured Data Prompt. If both are provided, they are concatenated into appropriate instructions.</p>
        <div className="content-wrapper">
          <h4 className="text-area-title">Prompt</h4>
          <p className="text-area-description">This is the prompt that&lsquo;s used to extract structured data from the call.</p>
          <TextArea className="text-area" rows={4} placeholder="Write your system prompts here..."
           onChange={structuredDataPromptEnterHandler}
            value={structuredDataPrompts}
          />

          <Property/>


        </div>
      </div>
    </div>
  )
}

export default dynamic((): any => Promise.resolve(Analysis), { ssr: false });