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
  deleteQAList,
  setDeleteQAList,
  updateChatbot,
}: // qaImage,
any) {
  /// Adding QA
  function addQA() {
    setQAList([...qaList, { question: "", answer: "", image: "" }]);
    setQACount(qaCount + 1);
  }

  /// Removing QA
  function removeQA(indexToRemove: number) {
    const newQa = qaList.filter((qa: any, index: number) => {
      return index !== indexToRemove;
    });

    /// add the qa that need to be deleted while updating the chatbot
    if (updateChatbot && qaList[indexToRemove]?.id) {
      setDeleteQAList([...deleteQAList, qaList[indexToRemove]]);
    }

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
  function updateQA(
    index: number,
    newQuestion: any,
    newAnswer: any,
    newImage: any
  ) {
    const updatedQAList = [...qaList];
    const prev =
      updatedQAList[index].question.length + updatedQAList[index].answer.length;
    if (updatedQAList[index]?.id) {
      updatedQAList[index] = {
        question: newQuestion,
        answer: newAnswer,
        image: newImage,
        id: updatedQAList[index]?.id,
        updated: true,
      };
    } else
      updatedQAList[index] = {
        question: newQuestion,
        answer: newAnswer,
        image: newImage,
      };
    /// update the state
    setQAList(updatedQAList);

    /// update the count of qa
    const count =
      updatedQAList[index].question.length + updatedQAList[index].answer.length;
    setQACharCount(qaCharCount - prev + count);
    updateCharCount(getCharCount - prev + count);
  }

  // console.log(qaList);

  return (
    <>
      {qaList &&
        qaList.map((qa: any, index: number) => {
          return (
            <div className="add-qa-container" key={index}>
              <QAAdd
                onQuestionChange={(newQuestion: any) => {
                  updateQA(index, newQuestion, qa.answer, qa.image);
                }}
                onAnswerChange={(newAnswer: any) =>
                  updateQA(index, qa.question, newAnswer, qa.image)
                }
                onImageChange={(newImage: any) => {
                  updateQA(index, qa.question, qa.answer, newImage);
                }}
                onDelete={() => removeQA(index)}
                question={qa.question}
                answer={qa.answer}
                fileName={qa.image != "" ? qa.image : "No file uploaded"}
                index={index}
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
