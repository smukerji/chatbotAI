import React from "react";
import "./custom-modal.scss";

export default function CustomModal({
  header,
  content,
  footer,
  open,
  setOpen,
}: any) {
  return (
    open && (
      <div className="custom-modal-wrapper">
        <div className="custom-modal-inner">
          <div className="custom-modal-header">{header}</div>
          <div className="custom-modal-content">{content}</div>
          <div className="custom-modal-footer">{footer}</div>
        </div>
      </div>
    )
  );
}
