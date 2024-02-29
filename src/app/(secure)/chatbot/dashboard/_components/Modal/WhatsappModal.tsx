import { Modal, Spin, Steps, Switch, message } from "antd";
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

  const [whatsAppWebhookToken, setWhatsAppWebHookToken] = useState<string>();

  const [accountStatus, setAccountStatus] = useState<boolean>(false);

  // This is state where there is all credentials for meta app
  const [metaDetails, setMetaDetails] = useState<any>({
    id:null,
    whatsAppAccessToken: "",
    facebookAppSecret: "",
    whatsAppPhoneNumber: "",
    phoneNumberID: "",
    phoneBusinessID: "",
    isActive: true,
  });

  const[whatsapp_id,setWhatsapp_id]=useState<any>()

  // This state is for handeling userinput errors
  const [errors, setErrors] = useState<any>({
    whatsAppAccessToken: null,
    facebookAppSecret: null,
    whatsAppPhoneNumber: null,
    phoneNumberID: null,
    phoneBusinessID: null,
  });

  const handleChange = (field: string, value: string) => {
    const trimmedValue = value.trim(); // Trim the value to remove leading and trailing spaces
    setMetaDetails({ ...metaDetails, [field]: trimmedValue });
    setErrors({
      ...errors,
      [field]: trimmedValue ? "" : `Please fill in this field`,
    });
  };

  // WhatsApp Change handler
  const whatsappChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("whatsAppAccessToken", e.target.value);
  };

  // Facebook App Secret Change handler
  const facebookChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange("facebookAppSecret", e.target.value);
  };

  // WhatsApp Phone Number Change handler
  const whatsappPhoneNumberHandler = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleChange("whatsAppPhoneNumber", e.target.value);
  };

  // Phone Number ID Change handler
  const whatsappPhoneNumberIDHandler = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleChange("phoneNumberID", e.target.value);
  };

  // Phone Business ID Change handler
  const whatsappBusinessIDHandler = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleChange("phoneBusinessID", e.target.value);
  };

  const inputCallBackUrlRef = useRef<HTMLInputElement>(null); // Ref for the input callback url  element
  const inputTokenRef = useRef<HTMLInputElement>(null); // Ref for the input Token   element

  // This code is for gettig chatbot id
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));

  const userId = useCookies(["userId"]);

  //this function is when user clicks on copy icon and values will be copied
  const handleCopy = (value: string) => {
    if (value) {
      navigator.clipboard
        .writeText(value)
        .then(() => {
          message.success('Value copied')
          console.log("Value copied:", value);
        })
        .catch((error) => {
          message.error('Copy failed')
          console.error("Copy failed:", error);
        });
    }
  };

  // This function is written where user clicks verify button in First step
  const handleVerify = async () => {
    // This code is for verifying that user has verified call back or not from meta

    try {
      const url = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/whatsapp/api?whatsAppVerifyToken=${whatsAppWebhookToken}`;

      const result = await fetch(url, {
        headers: {
          cache: "no-store",
        },
        method: "PUT",
        next: { revalidate: 0 },
      });
      const res = await result.json();
      if (res?.verifyValue === true) {
        message.success(res?.verifyMessage);
        setStepState({ ...stepState, step2: true, step1: false });
        // Update the status of the second object in the items array
        setItems([
          { status: "finish" }, // Update the status of the first step
          { status: "process" }, // Update the status of the second step
          { status: "wait" }, // Keep the status of other steps unchanged
        ]);
      } else {
        message.error(res?.verifyMessage || res?.message);
      }
    } catch (error) {
      console.log("error verifying", error);
    }
  };

  // This function is written where user clicks Add Account button in Second step
  const handleAddAccount = () => {
    // Check if the errors for both fields are empty
    if (errors.whatsAppAccessToken === "" && errors.facebookAppSecret === "") {
      // Proceed to the next step if both fields are filled
      setStepState({ ...stepState, step3: true, step2: false });
      // Update the status of the third object in the items array
      setItems([
        { status: "finish" }, // Update the status of the first step
        { status: "finish" }, // Update the status of the second step
        { status: "process" },
      ]);
    } else {
      setErrors({
        ...errors,
        whatsAppAccessToken:
          errors.whatsAppAccessToken === null
            ? "Please fill in this field"
            : errors.whatsAppAccessToken,
        facebookAppSecret:
          errors.facebookAppSecret === null
            ? "Please fill in this field"
            : errors.facebookAppSecret,
      });
    }
  };

  // This function is written where user clicks save button in Third step
  const saveHandler = async () => {
    if (
      errors.whatsAppPhoneNumber == "" &&
      errors.phoneNumberID == "" &&
      errors.phoneBusinessID == ""
    ) {
      
      try {
        // const {id,...wrapMetaDetails} = metaDetails
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/api`,
          {
            headers: {
              cache: "no-store",
            },
            method: "POST",
            body: JSON.stringify({
              metaDetails,
              chatbotId: chatbot.id,
              userId: userId[0].userId,
            }),
            next: { revalidate: 0 },
          }
          );
          
          const resp = await response.json();
          if(response.status !=200){
            message.error(resp.message);
            onClose();
            setAccountStatus(false);
            setStepState({ step1: true, step2: false, step3: false });
            setItems([
              { status: "process" }, // Update the status of the first step
              { status: "wait" }, // Update the status of the second step
              { status: "wait" },
            ]);
            
          }
          else{
            message.success(resp.message);
            setStepState({ step1: false, step2: false, step3: false });
            setAccountStatus(true);
        }
       
      } catch (error) {
        message.error("error sending data");
      }
    } else {
      setErrors({
        ...errors,
        whatsAppPhoneNumber:
          errors.whatsAppPhoneNumber === null
            ? "Please fill in this field"
            : errors.whatsAppPhoneNumber,
        phoneNumberID:
          errors.phoneNumberID === null
            ? "Please fill in this field"
            : errors.phoneNumberID,
        phoneBusinessID:
          errors.phoneBusinessID === null
            ? "Please fill in this field"
            : errors.phoneBusinessID,
      });
    }
  };

  const handleOk = () => {
    onClose();
  };

  // This function is for changing switch status in last step
  const onChangeSwitch = async  (checked: boolean) => {
    setSwitchStatus(!switchStatus);

    // This is for setting active and inactive 
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/account?whatsappDetailsId=${whatsapp_id}`,
        {
          headers: {
            cache: "no-store",
          },
          method: "PUT",
          next: { revalidate: 0 },
        }
      );
     const data = await response.json();
     if(data?.message === 'success'){
        message.success(data?.message)
     }
     else{
      message.error(data?.message)
     }
     
    } catch (error) {
      console.log("error",error)
      // message.error(error);
    }
  };

  // This function is for fetching token
  const fetchWebhookToken = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/api?chatBotId=${chatbot.id}`,
        {
          headers: {
            cache: "no-store",
          },
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const { webhook_verification_token,whatsAppDetailId } = await response.json();
      setWhatsAppWebHookToken(webhook_verification_token);
      setWhatsapp_id(whatsAppDetailId)
    } catch (error) {
      message.error("error getting token");
    }
  };

  //this function is for deleting details of whatsapp
  const deleteWhatsAppAccountDetails = async () => {


    try {

      let whatsAppDetailsId :any = null
      //check if whatsapp id is available
      if  (metaDetails.id == null || metaDetails.id == undefined) {
        //call the get endpoints
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/account?userId=${userId[0].userId}`,
            {
              headers: {
                cache: "no-store",
              },
              method: "GET",
              next: { revalidate: 0 },
            }
          );
          const data = await response.json();
            whatsAppDetailsId = data?._id
         
          
    
        } catch (error) {
          message.error("error getting data");
        }
        //update the whatsAppDetailsId
      }
      else{
        whatsAppDetailsId=metaDetails?.id
      }
    
        
   

      const response = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/account?whatsAppDetailsId=${whatsAppDetailsId}`, {
        headers: {
          cache: "no-store",
        },
        method: "DELETE",
        next: { revalidate: 0 },
      })
      const resp = await response.json()
      if(resp.message === 'success'){

        message.success(resp.message)
        window.location.reload();

      }
      else{
        message.error(resp.message)
      }

    } catch (error) {
      message.error('error sending data')
    }

  }

  // This is for fetching values if present
  const fetchWhatsappDetails = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}/chatbot/dashboard/whatsapp/account?chatBotId=${chatbot.id}`,
        {
          headers: {
            cache: "no-store",
          },
          method: "GET",
          next: { revalidate: 0 },
        }
      );
      const data = await response.json();
      setMetaDetails({
        ...metaDetails,
        whatsAppAccessToken: data?.whatsAppAccessToken,
        facebookAppSecret: data?.facebookAppSecret,
        whatsAppPhoneNumber: data?.whatsAppPhoneNumber,
        phoneNumberID: data?.phoneNumberID,
        phoneBusinessID: data?.phoneBusinessID,
        isActive: data?.isActive,
        id:data?._id
      });
      setSwitchStatus(data?.isEnabled == undefined ? true : data?.isEnabled)

      // Assuming data is an object containing all the fields
     // Assuming data is an object containing all the fields

      setErrors({...errors,
        whatsAppAccessToken: data?.whatsAppAccessToken ? '' :null,
        facebookAppSecret: data?.facebookAppSecret ? '' :null,
        whatsAppPhoneNumber: data?.whatsAppPhoneNumber ? '' :null,
        phoneNumberID: data?.phoneNumberID ? '' :null,
        phoneBusinessID: data?.phoneBusinessID ? '' :null,
      
      
      })

     
    } catch (error) {
      message.error("error getting data");
    }
  };

  useEffect(() => {
    fetchWebhookToken();
    // fetch details if already present
    fetchWhatsappDetails();
  }, []);
  console.log("switch",switchStatus)
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
                      defaultValue={`${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/webhook/api`}
                      ref={inputCallBackUrlRef}
                    ></input>
                    <Image
                    className="whatsapp-copy-icon"
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
                    {!whatsAppWebhookToken ?  <div className="whatsapp-spin-token"><Spin /></div> :<>
                    <input
                      type="text"
                      className="whatsapp-input"
                      defaultValue={whatsAppWebhookToken}
                      ref={inputTokenRef}
                      onChange={(e) => {
                        setWhatsAppWebHookToken(e.target.value);
                      }}
                    ></input>
                    <Image
                      src={copyIcon}
                      alt="copy-icon"
                      className="whatsapp-copy-icon"
                      onClick={() =>
                        handleCopy(inputTokenRef.current?.value || "")
                      }
                    />
                    </>
}
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
                  <div className="whatsapp-input-copy-container-step2">
                    <input
                      value={
                        metaDetails.whatsAppAccessToken &&
                        metaDetails.whatsAppAccessToken
                      }
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter your whatsapp access token provided by meta"
                      onChange={whatsappChangeHandler}
                    ></input>
                    {errors.whatsAppAccessToken && (
                      <p className="whatsapp-error-message">
                        {errors.whatsAppAccessToken}
                      </p>
                    )}
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Facebook App Secret</p>
                  <div className="whatsapp-input-copy-container-step2">
                    <input
                     value={
                      metaDetails.facebookAppSecret &&
                      metaDetails.facebookAppSecret
                    }
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter your facebook app secret provided by meta"
                      onChange={facebookChangeHandler}
                    ></input>
                    {errors.facebookAppSecret && (
                      <p className="whatsapp-error-message">
                        {errors.facebookAppSecret}
                      </p>
                    )}
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
                  <div className="whatsapp-input-copy-container-step3">
                    <input
                     value={
                      metaDetails.whatsAppPhoneNumber &&
                      metaDetails.whatsAppPhoneNumber
                    }
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter phone number "
                      onChange={whatsappPhoneNumberHandler}
                    ></input>
                    {errors.whatsAppPhoneNumber && (
                      <p className="whatsapp-error-message">
                        {errors.whatsAppPhoneNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Phone Number ID</p>
                  <div className="whatsapp-input-copy-container-step3">
                    <input
                      value={
                        metaDetails.phoneNumberID &&
                        metaDetails.phoneNumberID
                      }
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter phone number ID"
                      onChange={whatsappPhoneNumberIDHandler}
                    ></input>
                    {errors.phoneNumberID && (
                      <p className="whatsapp-error-message">
                        {errors.phoneNumberID}
                      </p>
                    )}
                  </div>
                </div>
                <div className="whatsapp-top-container">
                  <p className="whatsapp-top-title">Phone Business ID</p>
                  <div className="whatsapp-input-copy-container-step3">
                    <input
                     value={
                      metaDetails.phoneBusinessID &&
                      metaDetails.phoneBusinessID
                    }
                      type="text"
                      className="whatsapp-input"
                      placeholder="Enter phone business ID"
                      onChange={whatsappBusinessIDHandler}
                    ></input>
                    {errors.phoneBusinessID && (
                      <p className="whatsapp-error-message">
                        {errors.phoneBusinessID}
                      </p>
                    )}
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
                  {metaDetails?.whatsAppPhoneNumber && metaDetails?.whatsAppPhoneNumber}
                </div>
                <div className="whatsapp-status-container-switch-section">
                  <div>{switchStatus ? "Active" : "Inactive"}</div>
                  <Switch checked={switchStatus} onChange={onChangeSwitch} />
                  {/* <Image src={editIcon} alt="edit" /> */}
                  <Image src={DeleteIcon} className="whatsapp-delete" alt="delete" onClick={deleteWhatsAppAccountDetails}/>
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
