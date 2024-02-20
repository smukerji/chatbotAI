import { Modal, Steps } from "antd";
import React, { useRef, useState } from "react";
import copyIcon from "../../../../../../../public/svgs/copy-icon.svg";
import Image from "next/image";
import "./WhatsappModal.scss";

function WhatsappModal({ isOpen, onClose }: any) {
  const [stepState, setStepState] = useState({
    step1: true,
    step2: false,
    step3: false,
  });

  const [items, setItems] = useState<any>([
    {
      status: "process",
    },
    {
      status: "wait",
    },
    {
      status: "wait",
    },
  ]);
  const inputCallBackUrlRef = useRef<HTMLInputElement>(null); // Ref for the input callback url  element
  const inputTokenRef = useRef<HTMLInputElement>(null); // Ref for the input Token   element

  const handleCopy = (value: string) => {
    if (value) {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          console.log("Value copied:", value);
        })
        .catch((error) => {
          console.error("Copy failed:", error);
        });
    }
  };

  const handleVerify = () => {
    setStepState({ ...stepState, step2: true, step1: false });
    // Update the status of the second object in the items array
    setItems([
      { status: "finish" }, // Update the status of the first step
      { status: "process" }, // Update the status of the second step
      ...items.slice(2), // Keep the status of other steps unchanged
    ]);
  };

  const handleAddAccount = () => {
    setStepState({ ...stepState, step3: true, step2: false });
     // Update the status of the third object in the items array
     setItems([
      { status: "finish" }, // Update the status of the first step
      { status: "finish" }, // Update the status of the second step
     {status:'process'}
    ]);
  };

  const handleOk = () => {
    onClose();
  };

  return (
    <div className="whatsapp-modal-container">
      <Modal
        open={isOpen}
        onOk={handleOk}
        onCancel={onClose}
        closable={false} // Set closable prop to false to remove the cancel icon
        okButtonProps={{ style: { display: "none" } }} // Hide ok button
        cancelButtonProps={{ style: { display: "none" } }} // Hide cancel button
        className="whatsapp-modal"
      >
        <div className="whatsapp-integration-title">WhatsApp Integration</div>
        <Steps items={items} />
        <div>
          {/* ------ for first step */}
          {stepState.step1 && (
            <>
              <div className="whatsapp-step-container">
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Webhook Callback URL</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      defaultValue="url"
                      ref={inputCallBackUrlRef}
                    ></input>
                    <Image
                      src={copyIcon}
                      alt="copy-icon"
                      onClick={() =>
                        handleCopy(inputCallBackUrlRef.current?.value || "")
                      }
                    />
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">
                    Webhook Verification Token
                  </p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      defaultValue="token"
                      ref={inputTokenRef}
                    ></input>
                    <Image
                      src={copyIcon}
                      alt="copy-icon"
                      onClick={() =>
                        handleCopy(inputTokenRef.current?.value || "")
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="whatsapp-btn">
                <button className="whatsapp-verify">
                  <p className="whatsapp-verify-text" onClick={handleVerify}>
                    Verify
                  </p>
                </button>
              </div>
            </>
          )}
          {/* ------ for second step */}
          {stepState.step2 && (
            <>
              <div className="whatsapp-step-container">
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">WhatsApp Access Token</p>
                  <div className="whatsapp-input-copy-container">
                    <input type="text" className="whatsapp-input"></input>
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Facebook App Secret</p>
                  <div className="whatsapp-input-copy-container">
                    <input type="text" className="whatsapp-input"></input>
                  </div>
                </div>
              </div>
              <div className="whatsapp-btn">
                <button className="whatsapp-verify">
                  <p
                    className="whatsapp-verify-text"
                    onClick={handleAddAccount}
                  >
                    Add Account
                  </p>
                </button>
              </div>
            </>
          )}
          {/* ------ for third step */}
          {stepState.step3 && (
            <>
              <div className="whatsapp-step-container">
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">WhatsApp Phone Number</p>
                  <div className="whatsapp-input-copy-container">
                    <input type="text" className="whatsapp-input"></input>
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Phone Number ID</p>
                  <div className="whatsapp-input-copy-container">
                    <input type="text" className="whatsapp-input"></input>
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Phone Business ID</p>
                  <div className="whatsapp-input-copy-container">
                    <input type="text" className="whatsapp-input"></input>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default WhatsappModal;
