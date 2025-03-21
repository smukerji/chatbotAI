import { message, Modal } from "antd";
import React, { useContext } from "react";
import Image from "next/image";
import "./shopify-secret-modal.scss";
import {
  AssistantFlowStep,
  CreateAssistantFlowContext,
} from "@/app/_helpers/client/Context/CreateAssistantFlowContext";
import { InfoCircleOutlined } from "@ant-design/icons";

function ShopifySecretModal({ imageUrl, isOpen, setIsOpen }: any) {
  /// get the context data
  const createAssistantFlowContext: any = useContext(
    CreateAssistantFlowContext
  );
  const createAssistantFlowContextDetails =
    createAssistantFlowContext.createAssistantFlowInfo;

  /// if the user is on the last step, and has selected industry type that requires secret key
  // if (
  //   createAssistantFlowContextDetails?.currentAssistantFlowStep ===
  //     AssistantFlowStep.ADD_DATA_SOURCES &&
  //   createAssistantFlowContextDetails?.industryExpertType?.abbreviation ===
  //     "shopify" &&
  //   !createAssistantFlowContextDetails?.integrationSecretVerified
  // ) {
  //   setIsOpen(true);
  // }

  /// validate shopify store and token
  const validateShopifyStoreAndToken = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/shopify/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store: createAssistantFlowContextDetails.integrations?.shopify?.store,
          token: createAssistantFlowContextDetails.integrations?.shopify?.token,
        }),
      }
    );

    const responseData = await response.json();

    // if resposen is not ok then show error message
    if (!response.ok) {
      message.error(responseData.message);
      return;
    }

    // if response is ok then show success message
    message.success(responseData.message);
    setIsOpen(false);
    /// set the integration verified to true
    createAssistantFlowContext?.handleChange("integrationSecretVerified")(true);
  };
  /// handle save button click
  const handleSave = () => {
    validateShopifyStoreAndToken();
  };

  return (
    // modal with no cancel button
    <Modal
      title="Set up your Shopify store"
      open={isOpen}
      okText="Save"
      closeIcon={null}
      centered
      onOk={handleSave}
      cancelText="Cancel"
      onCancel={() => {
        setIsOpen(false);
        /// change the step to previous step if the user press cancel
        createAssistantFlowContext?.handleChange("currentAssistantFlowStep")(
          AssistantFlowStep.CHOOSE_INDUSTRY_EXPERT
        );
      }}
      cancelButtonProps={{ style: { backgroundColor: "#E6E8EC" } }}
      okButtonProps={{ style: { backgroundColor: "#2e58ea", color: "white" } }}
    >
      <div className="modal-content-container">
        <div className="header">
          <span>Your Shopify AI Assistant</span>
          {/* <span>Select other AI Expert</span> */}
        </div>

        <div className="industry-expert-details-container">
          <div className="left">
            <Image
              src={imageUrl}
              alt="industry-img"
              width={120}
              height={120}
            ></Image>
          </div>

          <div className="right">
            <h2 className="industry-expert-name">Shopify</h2>
            <span className="industry-expert-description">
              Performing a wide range of tasks, seamlessly interacting with
              users across various domains.
            </span>
          </div>
        </div>

        <div className="shopify-secret-input-container">
          {/* shop store url */}
          <div>
            <label htmlFor="shopify-store-url">
              Shopify Store URL &nbsp;
              <span>
                <InfoCircleOutlined />
              </span>
            </label>
            <input
              id="shopify-store-url"
              type="text"
              placeholder="Enter your Shopify Store URL"
              className="shopify-store-url"
              value={
                createAssistantFlowContextDetails.integrations?.shopify?.store
              }
              onChange={(e) => {
                createAssistantFlowContext?.handleChange("integrations")({
                  shopify: {
                    ...createAssistantFlowContext?.createAssistantFlowInfo
                      .integrations.shopify,
                    store: e.target.value,
                  },
                });
              }}
            ></input>
          </div>
          {/* shopify access token */}
          <div>
            <label htmlFor="shopify-secret-input">
              Shopify Access Token &nbsp;
              <span>
                <InfoCircleOutlined />
              </span>
            </label>
            <input
              id="shopify-secret-input"
              type="text"
              placeholder="Enter your Shopify Access Token"
              className="shopify-secret-input"
              value={
                createAssistantFlowContextDetails.integrations?.shopify?.token
              }
              onChange={(e) => {
                createAssistantFlowContext?.handleChange("integrations")({
                  shopify: {
                    ...createAssistantFlowContext?.createAssistantFlowInfo
                      .integrations.shopify,
                    token: e.target.value,
                  },
                });
              }}
            ></input>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ShopifySecretModal;
