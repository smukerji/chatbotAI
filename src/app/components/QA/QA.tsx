import { Button } from "antd";
import React, { useState } from "react";
import "./qa.css";
import QAAdd from "./QAAdd";
import { DeleteOutlined } from "@ant-design/icons";

export default function QA({
  qaList,
  setQAList,
  qaCount,
  setQACount,
  qaCharCount,
  setQACharCount,
  updateCharCount,
  getCharCount,
}: any) {
  /// Adding QA
  function addQA() {
    setQAList([...qaList, { question: "", answer: "" }]);
    setQACount(qaCount + 1);
  }

  /// Removing QA
  function removeQA(indexToRemove: number) {
    const newQa = qaList.filter((qa: any, index: number) => {
      return index !== indexToRemove;
    });

    /// update the overall count
    updateCharCount(
      getCharCount -
        qaList[indexToRemove].question.length -
        qaList[indexToRemove].answer.length
    );

    /// update the character count
    setQACharCount(
      qaCharCount -
        qaList[indexToRemove].question.length -
        qaList[indexToRemove].answer.length
    );

    /// update the state
    setQAList(newQa);
    setQACount(qaCount - 1);
  }

  /// Update QA
  function updateQA(index: number, newQuestion: any, newAnswer: any) {
    const updatedQAList = [...qaList];
    const prev =
      updatedQAList[index].question.length + updatedQAList[index].answer.length;
    updatedQAList[index] = { question: newQuestion, answer: newAnswer };
    /// update the state
    setQAList(updatedQAList);
    /// update the count of qa
    const count =
      updatedQAList[index].question.length + updatedQAList[index].answer.length;
    setQACharCount(qaCharCount - prev + count);
    updateCharCount(getCharCount - prev + count);
  }
  return (
    <>
      {qaList.map((qa: any, index: number) => {
        return (
          <div className="add-qa-container" key={index}>
            <QAAdd
              onQuestionChange={(newQuestion: any) => {
                updateQA(index, newQuestion, qa.answer);
              }}
              onAnswerChange={(newAnswer: any) =>
                updateQA(index, qa.question, newAnswer)
              }
              onDelete={() => removeQA(index)}
              question={qa.question}
              answer={qa.answer}
            />
          </div>
        );
      })}
      <div className="qa-source-btn-container">
        <Button
          className="add-button"
          type="primary"
          shape="round"
          size={"small"}
          onClick={addQA}
        >
          Add
        </Button>
      </div>
    </>
  );
}
