import { UploadProps, message } from "antd";
import Dragger from "antd/es/upload/Dragger";
import React, { useContext } from "react";
import Image from "next/image";
import documentUploadIcon from "../../../../public/create-chatbot-svgs/document-upload.svg";
import "./source-upload.scss";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import deleteIcon from "../../../../public/create-chatbot-svgs/delete-icon.svg";

function SourceUpload({
  totalCharCount,
  filesCharCount,
  isPlanNotification,
}: any) {
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

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
    onChange(info) {
      botContext?.handleChange("isLoading")(true);
      let { status, response } = info.file;

      if (response?.charLength) {
        /// updating the character count
        // botContext?.handleChange();
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
        message.error(`${response}`).then(() => {
          botContext?.handleChange("isLoading")(false);
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

      {defaultFileList?.length > 0 && <hr />}
      <div className="attached-files-container">
        {defaultFileList?.length > 0 && (
          <>
            <div className="text">
              <h1>Attached Files</h1>
              <span onClick={deleteAll}>Delete all</span>
            </div>
          </>
        )}

        <div className="item-list-container">
          {defaultFileList?.map((file: any, index: number) => {
            return (
              <React.Fragment key={index}>
                <div className="item">
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
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SourceUpload;
