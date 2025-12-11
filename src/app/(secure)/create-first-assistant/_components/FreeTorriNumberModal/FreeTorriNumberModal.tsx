import React, { useState } from "react";
import { Modal, Input, Button, message } from "antd";
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

    if (!areaCode) {
      message.error("Please enter an area code");
      return;
    }

    if (areaCode.length !== 3) {
      message.error("Area code must be exactly 3 digits");
      return;
    }

    if (!assistantId) {
      message.error("Please select an assistant first from the dashboard");
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
      console.log("API Response:", result);
      console.log("Response status:", response.status);

      // Check if request was successful
      if (!response.ok) {
        const result = await response.json();
        console.log("Error response:", result);

        // Handle specific error cases
        if (result.error === "LIMIT_REACHED") {
          message.error({
            content: result.message || "You have reached the maximum limit...",
            duration: 6,
          });
        } else {
          message.error({
            content: result.message || "Failed to create VAPI number",
            duration: 5,
          });
        }
        setLoading(false);
        return;
      }

      // Success!
      message.success({
        content: result.message || "VAPI number created successfully!",
        duration: 3,
      });
      setAreaCode(""); // Reset the input
      onClose(); // Close the modal and trigger refresh

    } catch (error: any) {
      console.error("Error creating number:", error);
      message.error({
        content: "An error occurred while creating the number. Please try again.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = () => {
    setAreaCode("");
    onClose();
  };

  return (
    <div>
      <Modal
        open={open}
        onCancel={handleCancel}
        footer={null}
        centered
        className="free-torri-modal"
      >
        <div className="modal-content">
          <div className="modal-label">Area Code</div>
          <Input
            value={areaCode}
            onChange={(e) => {
              // Only allow numbers and max 3 digits
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 3) {
                setAreaCode(value);
              }
            }}
            placeholder="e.g. 356, 543, 658"
            className="modal-input"
            maxLength={3}
            disabled={loading}
          />
          <div className="modal-info-box">
            <InfoCircleOutlined style={{ color: "#2e5bea", marginRight: 8 }} />
            <div className="info-desc">
              Only US area codes are supported. For international numbers, use
              the import options above.
            </div>
          </div>
          <div className="modal-actions">
            <Button onClick={handleCancel} className="cancel-btn" disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={savedFreeVapiNumber}
              type="primary"
              className="create-btn"
              loading={loading}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FreeTorriNumberModal;