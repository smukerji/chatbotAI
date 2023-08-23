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
}: any) {
  //   const [defaultFileList, setDefaultFileList]: any = useState([]);
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
        setDefaultFileList([
          ...defaultFileList,
          { name: info.file.name, ...response },
        ]);
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

  return (
    <div>
      {" "}
      <Dragger {...props} defaultFileList={defaultFileList}>
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
        {defaultFileList.map((file: any, index: number) => {
          return (
            <React.Fragment key={index}>
              <div className="item">
                <div className="file">
                  <p>{file.name}</p>
                  <div>({file.charLength} chars)</div>
                </div>
                <div className="delete">
                  <DeleteOutlined />
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
