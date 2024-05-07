import React, { useEffect, useRef } from "react";
import "./limitReachedModal.scss";
import { useRouter } from "next/navigation";

function LimitReachedModal({ setOpenLimitModel }: any) {
  const router = useRouter();
  const modalRef: any = useRef(null);
  const upgradeHandler = () => {
    router.push("/home/pricing");
  };
  const closeHandler = () => {
    setOpenLimitModel(false);
  };
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setOpenLimitModel(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef, setOpenLimitModel]);
  return (
    <div className="limit-reached-container" ref={modalRef}>
      <div className="title-section">
        <div className="title-icon">
          <p>Chatbot Limit Reached!</p>

          <div className="cros-icon" onClick={closeHandler}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
            >
              <path
                d="M16 2.66602C8.65332 2.66602 2.66666 8.65268 2.66666 15.9993C2.66666 23.346 8.65332 29.3327 16 29.3327C23.3467 29.3327 29.3333 23.346 29.3333 15.9993C29.3333 8.65268 23.3467 2.66602 16 2.66602ZM20.48 19.066C20.8667 19.4527 20.8667 20.0927 20.48 20.4793C20.28 20.6793 20.0267 20.7727 19.7733 20.7727C19.52 20.7727 19.2667 20.6793 19.0667 20.4793L16 17.4127L12.9333 20.4793C12.7333 20.6793 12.48 20.7727 12.2267 20.7727C11.9733 20.7727 11.72 20.6793 11.52 20.4793C11.1333 20.0927 11.1333 19.4527 11.52 19.066L14.5867 15.9993L11.52 12.9327C11.1333 12.546 11.1333 11.906 11.52 11.5193C11.9067 11.1327 12.5467 11.1327 12.9333 11.5193L16 14.586L19.0667 11.5193C19.4533 11.1327 20.0933 11.1327 20.48 11.5193C20.8667 11.906 20.8667 12.546 20.48 12.9327L17.4133 15.9993L20.48 19.066Z"
                fill="#141416"
              />
            </svg>
          </div>
        </div>
        <p className="upgrade-desc">
          Please upgrade plans to install more chatbot
        </p>
      </div>
      <button onClick={upgradeHandler}>
        <p>Upgrade Plan</p>
      </button>
    </div>
  );
}

export default LimitReachedModal;
