import React, { useState } from "react";
import { Modal, Input, Button } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import "./FreeTorriNumberModal.scss";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FreeTorriNumberModal: React.FC<Props> = ({ open, onClose }) => {
  const [areaCode, setAreaCode] = useState("");

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
            <Button type="primary" className="create-btn">
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FreeTorriNumberModal;
