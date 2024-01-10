import React from "react";
import "./oldqa-add.css";
import { DeleteOutlined } from "@ant-design/icons";
import { message } from "antd";

export default function QAAdd({
  onQuestionChange,
  onAnswerChange,
  onDelete,
  question,
  answer,
  fileName,
  onImageChange,
  index,
}: any) {
  const handleFileChange = (e: any) => {
    const selectedFile = e.target.files[0];
    // Check if a file is selected and it's an image
    if (selectedFile && isImageFile(selectedFile)) {
      onImageChange(selectedFile);
    } else {
      // Display an error message or handle the invalid file selection as needed
      message.error("Invalid file format. Please select an image.");
      return;
    }
  };

  // Function to check if a file is an image
  const isImageFile = (file: any) => {
    const acceptedImageTypes = ["image/jpeg", "image/png", "image/gif"];
    return acceptedImageTypes.includes(file.type);
  };

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
      <div className="qa-image-container">
        <p>Optional</p>
        <input
          id={`fileInput${index}`}
          type="file"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", padding: "5 5px" }}>
          <label
            htmlFor={`fileInput${index}`}
            className={"file-input"}
            // onChange={handleFileChange}
          >
            Choose file
          </label>
          <span style={{ margin: "5px 5px" }}>
            {typeof fileName == "string"
              ? fileName
              : fileName
              ? fileName.name
              : "No file chosen"}
          </span>
        </div>
      </div>
    </>
  );
}
