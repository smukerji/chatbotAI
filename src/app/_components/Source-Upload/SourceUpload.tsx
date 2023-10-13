import { DeleteOutlined, InboxOutlined } from "@ant-design/icons";
import { UploadProps } from "antd";
import Dragger from "antd/es/upload/Dragger";
import React, { useState } from "react";
import { message } from "antd";
import "./source-upload.css";

function SourceUpload({
  defaultFileList,
  setDefaultFileList,
  updateCharCount,
  getCharCount,
  setLoadingPage,
  fileTextLength,
  setFileTextLength,
  updateChatbot,
  newFileList,
  setNewFileList,
  deleteFileList,
  setDeleteFileList,
}: any) {
  const props: UploadProps = {
    name: "file",
    multiple: true,
    action: `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/upload`,
    onChange(info) {
      setLoadingPage(true);
      let { status, response } = info.file;

      if (response?.charLength) {
        /// updating the character count
        updateCharCount(getCharCount + response.charLength);
        setFileTextLength(fileTextLength + response.charLength);

        /// add the file
        setDefaultFileList([
          ...defaultFileList,
          { name: info.file.name, ...response },
        ]);

        /// add the file to new file list if the chatbot is getting updated
        if (updateChatbot) {
          setNewFileList([
            ...newFileList,
            { name: info.file.name, ...response },
          ]);
        }
        message
          .success(`${info.file.name} file uploaded successfully.`)
          .then(() => {
            setLoadingPage(false);
          });
      } else if (status === "error") {
        message.error(`${response}`).then(() => {
          setLoadingPage(false);
        });
      }
    },
    onDrop(e) {
      console.log("Dropped files", e.dataTransfer.files);
    },
  };

  /// remove the files
  function removeFile(fileToRemove: any) {
    const newDefaultFileList = defaultFileList.filter((file: any) => {
      return file !== fileToRemove;
    });
    /// add the file to be deleted while retraining
    if (updateChatbot && fileToRemove?.filepath === undefined) {
      setDeleteFileList([...deleteFileList, fileToRemove]);
    } else if (updateChatbot) {
      /// update the newFileList so that we know if we have removed the new file or not
      const updatedNewFileList = newFileList.filter((file: any) => {
        return JSON.stringify(file) !== JSON.stringify(fileToRemove);
      });
      setNewFileList(updatedNewFileList);
    }
    /// updating the character count
    updateCharCount(getCharCount - fileToRemove.charLength);
    setFileTextLength(fileTextLength - fileToRemove.charLength);
    setDefaultFileList(newDefaultFileList);
  }
  // return <h1>"d</h1>;

  return (
    <div>
      {" "}
      <Dragger {...props}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click or drag file to this area to upload
        </p>
        <p className="ant-upload-hint">
          Support for a single or bulk upload. Strictly prohibited from
          uploading company data or other banned files.
        </p>
      </Dragger>
      <div className="item-list-container">
        {defaultFileList?.length > 0 && (
          <div className="text">
            <h1>Attached Files</h1> <p>({fileTextLength}) chars</p>
          </div>
        )}
        {defaultFileList?.map((file: any, index: number) => {
          return (
            <React.Fragment key={index}>
              <div className="item">
                <div className="file">
                  <p>{file.name}</p>
                  <div>({file.charLength} chars)</div>
                </div>
                <div className="delete">
                  <DeleteOutlined onClick={() => removeFile(file)} />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default SourceUpload;
