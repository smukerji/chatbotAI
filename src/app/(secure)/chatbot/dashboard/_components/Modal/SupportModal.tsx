import { Button, Modal } from "antd";
import React from "react";
import "./support-modal.scss";

function SupportModal({ openSupport, setOpenSupport, centered = true }: any) {
  return (
    <>
      <Modal
        title="Support"
        centered={centered}
        open={openSupport}
        closeIcon={null}
        footer={[
          <button
            className="ok-btn"
            key="submit"
            onClick={() => setOpenSupport(false)}
          >
            OK
          </button>,
        ]}
      >
        <p>
          In case of enquiry, please email us at <a href="">info@torri.ai</a>
        </p>
      </Modal>
    </>
  );
}

export default SupportModal;
