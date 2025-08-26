import { UploadProps, message, Progress } from "antd";
import Dragger from "antd/es/upload/Dragger";
import React, { useContext, useState, useRef } from "react";
import Image from "next/image";
import documentUploadIcon from "../../../../public/create-chatbot-svgs/document-upload.svg";
import "./source-upload.scss";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import deleteIcon from "../../../../public/create-chatbot-svgs/delete-icon.svg";
import { useCookies } from "react-cookie";

function SourceUpload({
  totalCharCount,
  filesCharCount,
  isPlanNotification,
}: any) {
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the userID from cookies
  const [cookies, setCookies]: any = useCookies(["userId"]);

  /// State to track uploading files with progress
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: number;
  }>({});
  /// Use ref to track intervals for immediate access
  const intervalsRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  /// Function to simulate progress for a file
  const simulateProgress = (fileName: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 5; // Reduced increment between 0-5%
      if (progress >= 85) {
        progress = 85; // Stop at 85% until actual upload completes
      }

      setUploadingFiles((prev) => ({
        ...prev,
        [fileName]: Math.min(progress, 85),
      }));
    }, 500); // Increased interval to 500ms for slower progress

    // Store the interval in ref for immediate access
    intervalsRef.current[fileName] = interval;

    return interval;
  };

  /// get default file to preview if any
  const defaultFileList = botDetails?.defaultFileList;
  /// get new file list
  const newFileList = botDetails?.newFileList;
  /// get delete file list
  const deleteFileList = botDetails?.deleteFileList;

  const props: UploadProps = {
    name: "file",
    multiple: true,
    // action: `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/upload`,
    action:
      "https://torri-extraction-backend-108437277455.us-west3.run.app/process-doc",
    beforeUpload(file) {
      // Check if file already exists in defaultFileList
      const fileExists = defaultFileList?.some(
        (existingFile: any) => existingFile.name === file.name
      );

      // Check if file is currently being uploaded
      const isUploading = uploadingFiles.hasOwnProperty(file.name);

      if (fileExists) {
        message.error(`File "${file.name}" already exists!`);
        return false; // Prevent upload
      }

      if (isUploading) {
        message.error(`File "${file.name}" is currently being uploaded!`);
        return false; // Prevent upload
      }

      return true; // Allow upload
    },
    onChange(info) {
      botContext?.handleChange("isLoading")(true);
      let { status, response } = info.file;

      // Start progress simulation when upload begins (only if not already started)
      if (status === "uploading" && !intervalsRef.current[info.file.name]) {
        simulateProgress(info.file.name);
      }

      if (response?.charLength) {
        /// Clear the interval for this file
        if (intervalsRef.current[info.file.name]) {
          clearInterval(intervalsRef.current[info.file.name]);
          delete intervalsRef.current[info.file.name];
        }

        /// Complete the progress for this file
        setUploadingFiles((prev) => ({
          ...prev,
          [info.file.name]: 100,
        }));

        /// Remove from uploading files after a short delay
        setTimeout(() => {
          setUploadingFiles((prev) => {
            const newState = { ...prev };
            delete newState[info.file.name];
            return newState;
          });
        }, 500);

        /// updating the character count
        botContext?.handleChange("totalCharCount")(
          totalCharCount + response.charLength
        );
        botContext?.handleChange("filesCharCount")(
          filesCharCount + response.charLength
        );
        /// add the file
        botContext?.handleChange("defaultFileList")([
          ...defaultFileList,
          { name: info.file.name, ...response },
        ]);
        /// add the file to new file list if the chatbot is getting updated
        if (botDetails?.isUpdateChatbot) {
          botContext?.handleChange("newFileList")([
            ...newFileList,
            { name: info.file.name, ...response },
          ]);
        }

        message.success(`${info.file.name} uploaded successfully!`).then(() => {
          botContext?.handleChange("isLoading")(false);
        });
      } else if (status === "error") {
        /// Clear the interval for this file on error
        if (intervalsRef.current[info.file.name]) {
          clearInterval(intervalsRef.current[info.file.name]);
          delete intervalsRef.current[info.file.name];
        }

        /// Remove from uploading files on error
        setUploadingFiles((prev) => {
          const newState = { ...prev };
          delete newState[info.file.name];
          return newState;
        });

        message.error(`${response}`).then(() => {
          botContext?.handleChange("isLoading")(false);
        });
      }
    },
    data: (file: any) => {
      return { userId: cookies?.userId };
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
    if (botDetails?.isUpdateChatbot && fileToRemove?.filepath === undefined) {
      botContext?.handleChange("deleteFileList")([
        ...deleteFileList,
        fileToRemove,
      ]);
    } else if (botDetails?.isUpdateChatbot) {
      /// update the newFileList so that we know if we have removed the new file or not
      const updatedNewFileList = newFileList.filter((file: any) => {
        return JSON.stringify(file) !== JSON.stringify(fileToRemove);
      });
      botContext?.handleChange("newFileList")(updatedNewFileList);
    }
    /// updating the character count
    botContext?.handleChange("totalCharCount")(
      totalCharCount - fileToRemove.charLength
    );
    botContext?.handleChange("filesCharCount")(
      filesCharCount - fileToRemove.charLength
    );
    botContext?.handleChange("defaultFileList")(newDefaultFileList);
  }

  /// remove all the documents
  function deleteAll() {
    /// calculate the total characters of the documents
    let totalFileCharCount = 0;
    /// get all the files that need to be deleted from databse first
    const deleteDatabseDoc = defaultFileList?.filter(
      (file: any, index: number) => {
        totalFileCharCount += file?.charLength;
        return file?.id != "" && file?.id != undefined;
      }
    );

    /// the files to the delete list
    botContext?.handleChange("deleteFileList")([
      ...deleteFileList,
      ...deleteDatabseDoc,
    ]);

    /// updating the character count
    botContext?.handleChange("totalCharCount")(
      totalCharCount - totalFileCharCount
    );
    botContext?.handleChange("filesCharCount")(
      filesCharCount - totalFileCharCount
    );

    /// empty the file list
    botContext?.handleChange("defaultFileList")([]);
    botContext?.handleChange("newFileList")([]);
  }

  return (
    <div className="source-upload-container">
      <div className="dragger-wrapper">
        <Dragger
          {...props}
          style={{ position: isPlanNotification ? "unset" : "relative" }}
        >
          <p className="ant-upload-drag-icon">
            <Image src={documentUploadIcon} alt="doc-icon" />
          </p>
          <p className="ant-upload-text">
            Drag & drop files here, or click to select files
          </p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibited from
            uploading company data or other banned files.
          </p>
          <p className="ant-upload-hint">
            Supported File Types: .pdf, .doc, .docx, .txt, .csv, .xlsx
          </p>
        </Dragger>
      </div>

      {(defaultFileList?.length > 0 ||
        Object.keys(uploadingFiles).length > 0) && <hr />}
      <div className="attached-files-container">
        {(defaultFileList?.length > 0 ||
          Object.keys(uploadingFiles).length > 0) && (
          <div className="text">
            <h1>Attached Files</h1>
            {defaultFileList?.length > 0 && (
              <span onClick={deleteAll}>Delete all</span>
            )}
          </div>
        )}

        <div className="item-list-container">
          {/* Show uploading files first */}
          {Object.entries(uploadingFiles).map(([fileName, progress]) => (
            <div key={`uploading-${fileName}`} className="item">
              <div
                className="file"
                style={{
                  justifyContent: "space-between",
                  width: "100%",
                  paddingRight: "30px",
                  alignItems: "center",
                  gap: "0",
                }}
              >
                <p>{fileName}</p>
                <div style={{ width: "300px" }}>
                  <Progress
                    percent={Math.round(progress)}
                    size="small"
                    status={progress === 100 ? "success" : "active"}
                    showInfo={true}
                    strokeColor="#4D72F5"
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Show completed files */}
          {defaultFileList?.map((file: any, index: number) => {
            return (
              <div key={`${file.name}-${index}`} className="item">
                <div className="file">
                  <p>{file.name}</p>
                  <div>({file.charLength} chars)</div>
                </div>
                <div className="delete">
                  <Image
                    src={deleteIcon}
                    alt="delete-icon"
                    onClick={() => removeFile(file)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SourceUpload;
