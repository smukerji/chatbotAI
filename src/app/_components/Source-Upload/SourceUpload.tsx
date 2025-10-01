import { UploadProps, message, Progress } from "antd";
import Dragger from "antd/es/upload/Dragger";
import React, { useContext, useState, useRef, useEffect } from "react";
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

  // Clear any remaining intervals when the component unmounts to avoid leaking timers
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach((iv) => clearInterval(iv));
      intervalsRef.current = {};
    };
  }, []);

  /// Function to simulate progress for a file deterministically over 5 minutes
  const simulateProgress = (fileName: string) => {
    const SIMULATION_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_SIMULATED_PROGRESS = 95; // cap until actual upload completes (stop just before completion)
    const TICK_MS = 1000; // update every 1s

    const startTime = Date.now();
    let progress = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(1, elapsed / SIMULATION_DURATION_MS);
      progress = fraction * MAX_SIMULATED_PROGRESS;

      setUploadingFiles((prev) => ({
        ...prev,
        [fileName]: Math.min(Math.round(progress), MAX_SIMULATED_PROGRESS),
      }));

      // If we've reached the end of the simulation window, stop the interval to avoid unnecessary work.
      if (elapsed >= SIMULATION_DURATION_MS) {
        clearInterval(interval);
        // remove stored interval since it's no longer active
        if (intervalsRef.current[fileName]) {
          delete intervalsRef.current[fileName];
        }
      }
    }, TICK_MS);

    // Store the interval in ref for immediate access/cleanup by onChange
    intervalsRef.current[fileName] = interval;

    return interval;
  };

  // Truncate filenames in the middle while preserving extension
  function truncateFilenameMiddle(name: string, maxLen = 34) {
    if (!name) return "";
    if (name.length <= maxLen) return name;
    const extIndex = name.lastIndexOf(".");
    const ext = extIndex !== -1 ? name.slice(extIndex) : "";
    const base = ext ? name.slice(0, extIndex) : name;
    // reserve 5 chars for dots
    const keep = Math.max(3, Math.floor((maxLen - ext.length - 5) / 2));
    const start = base.slice(0, keep);
    const end = base.slice(-keep);
    return `${start}.....${end}${ext}`;
  }

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
                  alignItems: "center",
                  gap: "0",
                }}
              >
                <p>{truncateFilenameMiddle(fileName)}</p>
                <div style={{ width: "250px", marginLeft: "20px" }}>
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
                  <p>{truncateFilenameMiddle(file.name)}</p>
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
