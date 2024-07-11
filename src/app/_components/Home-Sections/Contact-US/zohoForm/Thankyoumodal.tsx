import React, { useState } from "react";
import { Button, Modal } from "antd";
import imgSvg from "../../../../../../public/svgs/ThankYou.svg";
import Image from "next/image";

function Thankyoumodal({
  openModal,
  setOpenModal,
  handleOk,
  handleCancel,
}: any) {
  return (
    <div>
      <Modal
        open={openModal}
        closeIcon={false}
        footer={null}
        onOk={() => handleOk()}
        onCancel={() => handleCancel()}
        className="thankyou-modal"
      >
        <div className="thankyoumail-container">
          <Image src={imgSvg} alt="hi" />
          <h1>Thank you for contacting us!</h1>
          <p>
            We have received your request. Our team will carefully review the
            details and respond to your inquiry as soon as possible.If you need
            further assistance or have additional inquiries, please reach out to
            us at info@torri.ai.
          </p>
          <Button onClick={handleOk}>okay</Button>
        </div>
      </Modal>
    </div>
  );
}

export default Thankyoumodal;
