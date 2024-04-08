import { message } from "antd";
import React from "react";
import deleteIcon from "../../../../public/create-chatbot-svgs/delete-icon.svg";
import uploadIcon from "../../../../public/create-chatbot-svgs/image-upload-icon.svg";
import deleteImgIcon from "../../../../public/create-chatbot-svgs/img-delete-icon.svg";
import Image from "next/image";
import "./qa-add.scss";

function QAAdd({
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
      message.error("Invalid file format.");
      return;
    }
  };

  const removeImage = () => {
    onImageChange("");
  };

  // Function to check if a file is an image
  const isImageFile = (file: any) => {
    const acceptedImageTypes = ["image/jpeg", "image/png", "image/gif"];
    return acceptedImageTypes.includes(file.type);
  };

  return (
    <>
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

      <div className="qa-action-container">
        <div className="qa-image-container">
          <input
            id={`fileInput${index}`}
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <div>
            <label
              htmlFor={`fileInput${index}`}
              className={"file-input"}
              // onChange={handleFileChange}
            >
              <Image src={uploadIcon} alt="upload-icon" />
              Upload Image
            </label>
            <span className="file-name">
              {typeof fileName == "string" ? (
                <>
                  {fileName}{" "}
                  {fileName.toLowerCase() !=
                    "No file uploaded".toLowerCase() && (
                    <Image
                      src={deleteImgIcon}
                      alt="img-delete-icon"
                      onClick={removeImage}
                    />
                  )}
                </>
              ) : fileName ? (
                <>
                  {fileName.name}{" "}
                  <Image
                    src={deleteImgIcon}
                    alt="img-delete-icon"
                    onClick={removeImage}
                  />
                </>
              ) : (
                "No file chosen"
              )}
            </span>
          </div>
        </div>
        <div className="delete">
          <Image src={deleteIcon} alt="delete-icon" onClick={onDelete} />
        </div>
      </div>
    </>
  );
}

export default QAAdd;
