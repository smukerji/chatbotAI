import React, { useState } from "react";
import { Modal, Input, Button } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "./FreeTorriNumberModal.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  data: {
    assistantId: string,
    userId: string,
  }
}

const FreeTorriNumberModal: React.FC<Props> = ({ open, onClose, data }) => {
  const [areaCode, setAreaCode] = useState("");


  const [loading, setLoading] = useState(false);

  async function savedFreeVapiNumber() {
    const { assistantId, userId } = data;
    debugger;

    if (!areaCode) {
      return;
    }



    setLoading(true);

    try {
      const response = await fetch("/voicebot/dashboard/api/phone/vapi-free-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId,
          userId,
          areaCode: areaCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create number");
      }

    } catch (error: any) {
      console.error("Error creating number:", error);
    } finally {
      setLoading(false);
    }


  }

  return (
    <div>
      {/* <div className="backdrop"></div> */}
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        className="free-torri-modal"
      //   width={500}
      >
        <div className="modal-content">
          <div className="modal-label">Area Code</div>
          <Input
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value)}
            placeholder="e.g. 356, 543, 658"
            className="modal-input"
          />
          <div className="modal-info-box">
            <InfoCircleOutlined style={{ color: "#2e5bea", marginRight: 8 }} />

            <div className="info-desc">
              Only US area codes are supported. For international numbers, use
              the import options above.
            </div>
          </div>
          <div className="modal-actions">
            <Button onClick={onClose} className="cancel-btn">
              Cancel
            </Button>
            <Button onClick={savedFreeVapiNumber} type="primary" className="create-btn">
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FreeTorriNumberModal;
