import { Modal, Steps, Switch, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
import copyIcon from "../../../../../../../public/svgs/copy-icon.svg";
import Image from "next/image";
import "./WhatsappModal.scss";
import DeleteIcon from "../../../../../../../public/create-chatbot-svgs/delete-icon.svg";
import editIcon from "../../../../../../../public/sections-images/common/edit.svg";
import { useSearchParams } from "next/navigation";
import { useCookies } from "react-cookie";

function WhatsappModal({ isOpen, onClose }: any) {
  // This state is where the user currently is
  const [stepState, setStepState] = useState({
    step1: true,
    step2: false,
    step3: false,
  });
  const [switchStatus, setSwitchStatus] = useState<boolean>(true);
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

  const[whatsAppWebhookToken,setWhatsAppWebHookToken]=useState<string>()

  const [accountStatus, setAccountStatus] = useState<boolean>(false);

// This is state where there is all credentials for meta app
  const[metaDetails,setMetaDetails]=useState<any>({
    whatsAppAccessToken:'',
   facebookAppSecret:'',
   whatsAppPhoneNumber:'',
   phoneNumberID:'',
   phoneBusinessID:''
  })

  const inputCallBackUrlRef = useRef<HTMLInputElement>(null); // Ref for the input callback url  element
  const inputTokenRef = useRef<HTMLInputElement>(null); // Ref for the input Token   element

  
  // This code is for gettig chatbot id
  const params: any = useSearchParams();
 const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  const userId= useCookies(['userId'])


  //this function is when user clicks on copy icon and values will be copied
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

  // This function is written where user clicks verify button in First step
  const handleVerify = () => {
    setStepState({ ...stepState, step2: true, step1: false });
    // Update the status of the second object in the items array
    setItems([
      { status: "finish" }, // Update the status of the first step
      { status: "process" }, // Update the status of the second step
      { status: "wait" }, // Keep the status of other steps unchanged
    ]);
  };

  // This function is written where user clicks Add Account button in Second step
  const handleAddAccount = () => {
    setStepState({ ...stepState, step3: true, step2: false });
    // Update the status of the third object in the items array
    setItems([
      { status: "finish" }, // Update the status of the first step
      { status: "finish" }, // Update the status of the second step
      { status: "process" },
    ]);
  };

  // This function is written where user clicks save button in Third step
  const saveHandler = async () => {
    setAccountStatus(true);
    setStepState({ step1: false, step2: false, step3: false });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/api`,{
        headers: {
          cache: "no-store",
        },
        method: "POST",
        body:JSON.stringify({...metaDetails,chbotId:chatbot.id,userId:userId[0].userId}),
        next: { revalidate: 0 },
      })
      const resp = await response.json()
      message.success(resp.message)

    } catch (error) {
      message.error('error sending data')
    }


  };

  const handleOk = () => {
    onClose();
  };

  // This function is for changing switch status in last step
  const onChangeSwitch = (checked: boolean) => {
    setSwitchStatus(!switchStatus);
  };


  const  fetchWebhookToken=async ()=>{
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/api`,{
        headers: {
          cache: "no-store",
        },
        method: "GET",
        next: { revalidate: 0 },
      })
      const {webhook_verification_token  } = await response.json()
      setWhatsAppWebHookToken(webhook_verification_token)

    } catch (error) {
      message.error('error getting token')
    }
  }

  useEffect(()=>{
      fetchWebhookToken()
  },[])

  return (
    <div className="whatsapp-modal-container">
      <Modal
        open={isOpen}
        onOk={handleOk}
        onCancel={onClose}
        // closable={false} // Set closable prop to false to remove the cancel icon
        okButtonProps={{ style: { display: "none" } }} // Hide ok button
        cancelButtonProps={{ style: { display: "none" } }} // Hide cancel button
        className="whatsapp-modal"
      >
        <div className="whatsapp-integration-title">WhatsApp Integration</div>
        <Steps items={items} className="whatsapp-steps" />
        <div>
          {/* ------ for first step ------------------- */}
          {stepState.step1 && (
            <>
              <div className="whatsapp-step-container">
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Webhook Callback URL</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      defaultValue='url'
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
                      defaultValue={whatsAppWebhookToken}
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
                <button className="whatsapp-verify" onClick={handleVerify}>
                  <p className="whatsapp-verify-text">Verify</p>
                </button>
              </div>
            </>
          )}
          {/* ------ for second step ----------------- */}
          {stepState.step2 && (
            <>
              <div className="whatsapp-step-container">
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">WhatsApp Access Token</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter your whatsapp access token provided by meta"
                      onChange={(e)=>{setMetaDetails({...metaDetails,whatsAppAccessToken:e.target.value})}}
                    ></input>
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Facebook App Secret</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter your facebook app secret provided by meta"
                      onChange={(e)=>{setMetaDetails({...metaDetails,facebookAppSecret:e.target.value})}}
                    ></input>
                  </div>
                </div>
              </div>
              <div className="whatsapp-btn">
                <button className="whatsapp-verify" onClick={handleAddAccount}>
                  <p className="whatsapp-verify-text">Add Account</p>
                </button>
              </div>
            </>
          )}
          {/* ------ for third step ------------------------ */}
          {stepState.step3 && (
            <>
              <div className="whatsapp-step-container">
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">WhatsApp Phone Number</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter phone number "
                      onChange={(e)=>{setMetaDetails({...metaDetails,whatsAppPhoneNumber:e.target.value})}}
                    ></input>
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Phone Number ID</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter phone number ID"
                      onChange={(e)=>{setMetaDetails({...metaDetails,phoneNumberID:e.target.value})}}
                    ></input>
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Phone Business ID</p>
                  <div className="whatsapp-input-copy-container">
                    <input
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter phone business ID"
                      onChange={(e)=>{setMetaDetails({...metaDetails,phoneBusinessID:e.target.value})}}
                    ></input>
                  </div>
                </div>
              </div>
              <div className="whatsapp-btn">
                <button className="whatsapp-verify" onClick={saveHandler}>
                  <p className="whatsapp-verify-text">Save</p>
                </button>
              </div>
            </>
          )}
          {accountStatus && (
            <>
              <div className="whatsapp-status-container">
                <div className="whatsapp-status-container-mobile-section">
                  22222-2222
                </div>
                <div className="whatsapp-status-container-switch-section">
                  <div>{switchStatus ? "Active" : "Inactive"}</div>
                  <Switch defaultChecked onChange={onChangeSwitch} />
                  <Image src={editIcon} alt="edit" />
                  <Image src={DeleteIcon} alt="delete" />
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
