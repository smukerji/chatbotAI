import { Modal } from "antd";
import React from "react";
import Image from "next/image";
import "./shopify-secret-modal.scss";

function ShopifySecretModal({ imageUrl }: any) {
  return (
    // modal with no cancel button
    <Modal
      title="Continue setup your AI Expert"
      open={true}
      okText="Save"
      closeIcon={null}
      centered
      cancelButtonProps={{ style: { display: "none" } }}
      okButtonProps={{ style: { backgroundColor: "#2e58ea", color: "white" } }}
    >
      <div className="modal-content-container">
        <div className="header">
          <span>Your Ai Expert</span>
          <span>Select other AI Expert</span>
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
            <label htmlFor="shopify-store-url">Shopify Store URL</label>
            <input
              id="shopify-store-url"
              type="text"
              placeholder="Enter your Shopify Store URL"
              className="shopify-store-url"
            ></input>
          </div>
          {/* shopify access token */}
          <div>
            <label htmlFor="shopify-secret-input">Shopify Access Token</label>
            <input
              id="shopify-secret-input"
              type="text"
              placeholder="Enter your Shopify Access Token"
              className="shopify-secret-input"
            ></input>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ShopifySecretModal;
