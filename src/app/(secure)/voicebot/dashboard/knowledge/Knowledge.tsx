import dynamic from "next/dynamic";
import { UploadProps, message, Button } from "antd";
import Image from "next/image";
import { useState } from "react";
// import documentUploadIcon from "../../../../public/create-chatbot-svgs/document-upload.svg";
import documentUploadIcon from "../../../../../../public/create-chatbot-svgs/document-upload.svg";
import "./knowledge-style.scss";

function Knowledge() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    async function getValidToken(): Promise<string> {
        try {
            const response = await fetch("http://localhost:3000/voicebot/dashboard/api/get-token");
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
            console.log(body);
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
                <div className="knowledge-list-item">
                    <span>Attached Files</span>
                    <span>Delete all</span>
                </div>
                <div className="knowledge-list-item"></div>
            </div>
        </div>
    );
}

export default dynamic((): any => Promise.resolve(Knowledge), { ssr: false });