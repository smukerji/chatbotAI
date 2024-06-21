import { Button, Modal } from "antd";
import React from "react";
import "./support-modal.scss";
import Link from "next/link";

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
          In case of enquiry, please email us at{" "}
          <Link
            href="https://mail.google.com/mail/?view=cm&fs=1&to=info@torri.ai"
            target="_blank"
          >
            info@torri.ai
          </Link>
        </p>
      </Modal>
    </>
  );
}

export default SupportModal;
