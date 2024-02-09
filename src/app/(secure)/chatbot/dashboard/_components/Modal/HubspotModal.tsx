import { Modal, message } from "antd";
import React, { useState } from "react";
require('dotenv').config()

function HubspotModal({ isModalOpen, setIsModalOpen,chatbotId }: any) {
  const [accessToken, setAccessToken] = useState<string>("");
  const[error,setError]=useState<string>('');

  // a function to send access token to backend

  const sendAccessToken = async () => {
    const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/hubspot/api`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({accessToken,chatbotId}),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData = await response.json();
      // Handle the response data as needed
      if(responseData.message === 'success'){

        message.success(responseData.message);
      }
      else{
        message.error(responseData.message)
      }
    } catch (error:any) {
      message.error(error);
    }
  };

  const handleOk = () => {
      if(accessToken){
        setIsModalOpen(false);
        sendAccessToken();
    }
    else{
       setError('Please provide access Token')
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <div className="hubspot-container">
      <Modal
        title="Enter your hubspot access token "
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        className="hubspot-modal"
      >
        <input
          className="hubspot-input"
          type="text"
          placeholder="Access token"
          onChange={(e) => {
            setAccessToken(e.target.value);
          }}
        />
        <p className="error">{error && error}</p>
      </Modal>
    </div>
  );
}

export default HubspotModal;
