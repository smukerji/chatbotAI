import dynamic from "next/dynamic";
import { UploadProps, message, Button } from "antd";
import Image from "next/image";
import { useEffect, useState } from "react";
// import documentUploadIcon from "../../../../public/create-chatbot-svgs/document-upload.svg";
import documentUploadIcon from "../../../../../../public/create-chatbot-svgs/document-upload.svg";
import "./knowledge-style.scss";
// import documentTrash from "../../../../../public/voiceBot/documents-trash.svg"
import docTrash from "../../../../../../public/voiceBot/documents-trash.svg"
import { useCookies } from "react-cookie";

function Knowledge() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [cookies, setCookie] = useCookies(["userId"]);
    const [fileUpdate, setFileUpdate] = useState("");
    const [userFiles, setUserFiles] = useState<any[]>([]);

    useEffect(() => {
        getUsersFile();
    }, [fileUpdate]);

    async function getUsersFile(){
        try {
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/knowledge-file?userId=${cookies.userId}`)
            const data = await response.json();
            console.table(data.data);
            if(data.status === 200){
                setUserFiles(data.data);
            }
        }
        catch (error) {
            console.error(error);
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

    async function deleteAssistantHandler(id:string){
        try {
          
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
            if(serverBody.status !== 200){
                throw new Error("Failed to delete file from server.");
            }
            console.log("File deleted successfully:", body);
            message.success("File deleted successfully!");

            console.log(body);
            await getUsersFile();
        } catch (error) {
            console.error(error);
        }
    }

    async function handleFileUpload(file: File) {
        try {
          
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

            //send the file data to the server
            const serverResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/knowledge-file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fileData: body,
                    userId: cookies.userId,
                }),
            });

            const serverBody = await serverResponse.json();
            if(serverBody.status !== 200){
                throw new Error("Failed to store file data.");
            }
            setFileUpdate(body.id);
            console.log(body,serverBody);
            message.success("File uploaded successfully!");
        } catch (error) {
            console.error(error);
            message.error("File upload failed.");
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        // setSelectedFile(file);
        if (file) {
            handleFileUpload(file);
        }
    };

    return (
        <div className="knowledge-wrapper">
            <div className="knowledge-container">
            <div className="knowledge-uploader">
                <div className="knowledge-uploader-icon">
                    <Button
                        className="knowledge-uploader-button"
                        style={{
                            backgroundImage: `url(${documentUploadIcon.src})`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            width: "50px",
                            height: "50px",
                        }}
                        onClick={() => document.getElementById("file")?.click()}
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
                <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
            </div>
            <div className="knowledge-list">
                <div className="knowledge-list-header">
                    <span className="description-text">Attached Files</span>
                    <Button className="right-content">Delete all</Button>
                </div>
                {/* <div className="knowledge-list-item"> */}
                    {
                        userFiles.map((file, index) => (
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
                                        border:"none"
                                    }}
                                    onClick={ async () => await deleteAssistantHandler(file.fileData.id)}
                                >
                                </Button>
                            </div>
                        ))
                    }
                {/* </div> */}
            </div>
        </div>
        </div>
        
    );
}

export default dynamic((): any => Promise.resolve(Knowledge), { ssr: false });