import dynamic from "next/dynamic";
import { UploadProps, message, Button, Spin, Upload } from "antd";
import Image from "next/image";
import { useEffect, useState, useContext } from "react";
import { CreateVoiceBotContext } from "../../../../_helpers/client/Context/VoiceBotContextApi"
// import documentUploadIcon from "../../../../public/create-chatbot-svgs/document-upload.svg";
import documentUploadIcon from "../../../../../../public/create-chatbot-svgs/document-upload.svg";
import "./knowledge-style.scss";
// import documentTrash from "../../../../../public/voiceBot/documents-trash.svg"
import docTrash from "../../../../../../public/voiceBot/documents-trash.svg"
import { useCookies } from "react-cookie";
import { Flex } from "antd"; // Assuming Flex is imported from Ant Design or another library


const { Dragger } = Upload;

function SpinnerLoader() {
    return (
        <>
              <Flex align="center" gap="middle" className="loader">
                <Spin size="large" />
            </Flex>
        </>
 
    );
}

// Add triggerPublishMethod to props
export type KnowledgeProps = {
    triggerPublishMethod: (fromKnowledge:boolean) => Promise<void>;
};

function Knowledge({ triggerPublishMethod }: KnowledgeProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isFetchingFiles, setIsFetchingFiles] = useState(false); // New state for fetching files
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [cookies, setCookie] = useCookies(["userId"]);
    const [fileUpdate, setFileUpdate] = useState("");
    const [userFiles, setUserFiles] = useState<any[]>([]);

    const voiceBotContextData: any = useContext(CreateVoiceBotContext);
    const voicebotDetails = voiceBotContextData.state;
    console.log("voicebotDetails front row", voicebotDetails);

    useEffect(() => {
        getUsersFile();
    }, [fileUpdate]);

    async function getUsersFile() {
        try {
            console.log("your assistant id", voiceBotContextData?.assistantInfo?.vapiAssistantId);
            setIsFetchingFiles(true); // Show spinner while fetching files
            const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/knowledge-file?userId=${cookies.userId}&assistantId=${voiceBotContextData?.assistantInfo?.vapiAssistantId}`);
            const data = await response.json();
            console.table(data.data);
            if (data.status === 200) {
                setUserFiles(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetchingFiles(false); // Hide spinner after fetching files
        }
    }

    async function getValidToken(): Promise<string> {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/get-token`);
            if (!response.ok) {
                throw new Error("Failed to fetch token.");
            }
            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error("Error fetching token:", error);
            throw error;
        }
    }

    async function deleteAssistantHandler(id: string) {
        try {

             setIsFetchingFiles(true);
            console.log("asistant data ",voicebotDetails);
            if (("tools" in voicebotDetails.model) && Array.isArray(voicebotDetails.model.tools) && "knowledgeBases" in voicebotDetails.model.tools[0] && Array.isArray(voicebotDetails.model.tools[0].knowledgeBases) && "fileIds" in voicebotDetails.model.tools[0].knowledgeBases[0] && Array.isArray(voicebotDetails.model.tools[0].knowledgeBases[0].fileIds)) {
                //remove the file id from the fileIds array
                const fileIds = voicebotDetails.model.tools[0].knowledgeBases[0].fileIds;
                const newFileIds = fileIds.filter((fileId: string) => fileId !== id);
                if( newFileIds.length === 0) {
                    //delete tools field from the model
                    const model = voicebotDetails.model;
                    delete model.tools;
                    voiceBotContextData.updateState("model", model);
                }
                else{
                    voiceBotContextData.updateState("model.tools.0.knowledgeBases.0.fileIds", newFileIds);
                }


                await triggerPublishMethod(true);

            }
           
            const token = await getValidToken();
            const response = await fetch(`https://api.vapi.ai/file/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error("Failed to delete file.");
            }
            const body = await response.json();

            //delete file from the server
            const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/knowledge-file?userId=${cookies.userId}&fileId=${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const serverBody = await serverResponse.json();
            if (serverBody.status !== 200) {
                throw new Error("Failed to delete file from server.");
            }
            console.log("File deleted successfully:", body);
            message.success("File deleted successfully!");

            console.log(body);
            await getUsersFile();
        } catch (error) {
            console.error(error);
        }
        finally {
            setIsFetchingFiles(false); // Hide spinner after deleting files
        }
    }

    async function handleFileUpload(file: File) {
        try {
            console.log("your voicebot context data", voiceBotContextData);
            
            setIsUploading(true); // Show spinner
            const token = await getValidToken();
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("https://api.vapi.ai/file", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to upload file.");
            }

            const body = await response.json();

                //check if tools is in the model
                if (!("tools" in voicebotDetails.model)) {
                voiceBotContextData.updateState("model.tools", [
                            {
                            type: "query",
                            knowledgeBases: [
                                {
                                    name: body?.name,
                                    provider: "google",
                                    description: "file",
                                    fileIds: [
                                            body?.id
                                        ]
                                }
                            ],
                            },
                        ]);
                        
                } else {
                    const oldIds = voicebotDetails.model.tools[0].knowledgeBases[0].fileIds;
                    const newIds = [...oldIds, body.id];
                    voiceBotContextData.updateState("model.tools.0.knowledgeBases.0.fileIds", newIds);
                    // voiceBotContextData.updateState("model.tools.0.knowledgeBases.0.name", "File names old is fine");

                }
            

                await triggerPublishMethod(true);
                

            //send the file data to the server
            const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/knowledge-file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileData: body,
                    userId: cookies.userId,
                    assistantId: voiceBotContextData?.assistantInfo?.vapiAssistantId,
                }),
            });

            const serverBody = await serverResponse.json();
            if (serverBody.status !== 200) {
                throw new Error("Failed to store file data.");
            }
            setFileUpdate(body.id);
         
           
           
            console.log(body, serverBody);
            // message.success("File uploaded successfully!");
        } catch (error:any) {
            console.error(error);
            message.error(error.message || "File upload failed.");
        } finally {
            setIsUploading(false); // Hide spinner
        }
    }


    const draggerProps: UploadProps = {
        name: "file",
        multiple: false,
        customRequest: async ({ file, onSuccess, onError }) => {
            try {
                const assistantId = voiceBotContextData?.assistantInfo?.vapiAssistantId;
                if(!assistantId) {
                    message.error("Assistant Need to Publish First");
                    return;
                 
                }
                await handleFileUpload(file as File);
                onSuccess && onSuccess("File uploaded successfully.");
            } catch (error) {
                console.error("Upload error:", error);
                onError && onError(new Error("File upload failed."));
                // onError && onError(error);
            }
        },
        onChange(info) {
            const { status } = info.file;
            if (status === "done") {
                message.success(`${info.file.name} file uploaded successfully.`);
            } else if (status === "error") {
                message.error(`${info.file.name} file upload failed.`);
            }
        },
        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
    };

    return (
        <div className="knowledge-wrapper">
            {isUploading && (
                <div className="spinner-loader">
                    <SpinnerLoader />
                </div>
            )}
            <div className="knowledge-container">
                <Dragger {...draggerProps}>
                    <div className="knowledge-uploader">
                        <div className="knowledge-uploader-icon">
                            <Button
                                className={`knowledge-uploader-button`}
                                style={{
                                    backgroundImage: `url(${documentUploadIcon.src})`,
                                    backgroundSize: "contain",
                                    backgroundRepeat: "no-repeat",
                                    backgroundPosition: "center",
                                    width: "50px",
                                    height: "50px",
                                    zIndex: isUploading ? -1 : "auto",
                                }}
                            >
                            </Button>
                        </div>
                        <div className="knowledge-uploader-text">
                            <h2 className="header-text">Upload your knowledge base file here!</h2>
                            <p className="description-text">
                                Upload your file here, and select it inside the model configuration page.
                            </p>
                            <span className="description-text">
                                Supported File Types: text/markdown, application/pdf, text/plain, text/csv, text/tab-separated-values, text/x-log, text/javascript, text/css, text/html, text/xml, application/xml, application/json, application/x-yaml, text/yaml, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/typescript, text/typescript.
                            </span>
                        </div>
                    </div>
                </Dragger>
                <div className="knowledge-list">
                    <div className="knowledge-list-header">
                        <span className="description-text">Attached Files</span>
                        <span className="right-content">Delete all</span>
                    </div>
                    {isFetchingFiles ? (
                        <div className="user-file-loader">
                            <SpinnerLoader />
                        </div>
                    ) : (
                        <div className="knowledge-list-content">
                            {userFiles.map((file, index) => (
                                <div className="knowledge-list-item" key={index}>
                                    <span className="description-text">{file.fileData.name}</span>
                                    <Button
                                        className=""
                                        style={{
                                            backgroundImage: `url(${docTrash.src})`,
                                            backgroundSize: "contain",
                                            backgroundRepeat: "no-repeat",
                                            backgroundPosition: "center",
                                            width: "20px",
                                            height: "20px",
                                            border: "none",
                                            zIndex: isUploading ? -1 : "auto",
                                        }}
                                        onClick={async () => await deleteAssistantHandler(file.fileData.id)}
                                    >
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Fix the dynamic export to accept props
export default dynamic<KnowledgeProps>(() => Promise.resolve(Knowledge), { ssr: false });