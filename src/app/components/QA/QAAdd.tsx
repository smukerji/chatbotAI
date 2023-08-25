import React, { useState } from "react";
import "./qa-add.css";
import { DeleteOutlined } from "@ant-design/icons";

export default function QAAdd({
  onQuestionChange,
  onAnswerChange,
  onDelete,
  question,
  answer,
}: any) {
  return (
    <>
      <div className="delete">
        <DeleteOutlined onClick={onDelete} />
      </div>
      <div className="question">
        <p>Question</p>
        <textarea
          value={question}
          onChange={(e) => {
            onQuestionChange(e.target.value);
          }}
        ></textarea>
      </div>
      <div className="answer">
        <p>Answer</p>
        <textarea
          value={answer}
          onChange={(e) => {
            onAnswerChange(e.target.value);
          }}
        ></textarea>
      </div>
    </>
  );
}
