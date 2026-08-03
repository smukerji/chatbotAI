"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Spin, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useSearchParams } from "next/navigation";
import { useCookies } from "react-cookie";
import "./WhatsappQRModal.scss";

type SessionStatus = "idle" | "starting" | "qr_generated" | "connected" | "disconnected" | "error";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (phoneNumber: string) => void;
  onDisconnected: () => void;
}

const POLL_INTERVAL_MS = 2500;
const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "") ?? "";
const SESSION_API = `${BASE_URL}/chatbot/dashboard/whatsapp-qr/session/api`;

function WhatsappQRModal({ isOpen, onClose, onConnected, onDisconnected }: Props) {
  const params: any = useSearchParams();
  const chatbot = JSON.parse(decodeURIComponent(params.get("chatbot")));
  const [cookies] = useCookies(["userId"]);
  const userId: string = cookies.userId;

  const [status, setStatus] = useState<SessionStatus>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const startedAtRef = useRef<number>(0);
  // Grace window: Baileys may briefly close (code 515 restart, 5s reconnect)
  // before the QR is stable. Tolerate "disconnected" during this window.
  const GRACE_MS = 45_000;

  // ── helpers ──────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleError = useCallback(
    (msg: string) => {
      stopPolling();
      setStatus("error");
      setErrorMsg(msg);
    },
    [stopPolling]
  );

  // ── polling ───────────────────────────────────────────────────────────────

  const pollStatus = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const res = await fetch(
        `${SESSION_API}?chatbotId=${chatbot.id}&userId=${userId}`,
        { method: "GET", cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();

      if (!isMountedRef.current) return;

      if (data.status === "connected") {
        stopPolling();
        setStatus("connected");
        setPhoneNumber(data.phoneNumber ?? null);
        setQrDataUrl(null);
        onConnected(data.phoneNumber ?? "");
      } else if (data.status === "qr_generated" && data.qrDataUrl) {
        setStatus("qr_generated");
        // Update QR image if it rotated
        setQrDataUrl((prev) => (prev !== data.qrDataUrl ? data.qrDataUrl : prev));
      } else if (data.status === "disconnected") {
        // The server auto-reconnects on transient closes (code 515, etc.).
        // Only treat disconnected as a hard error after the grace window.
        const elapsed = Date.now() - startedAtRef.current;
        if (elapsed > GRACE_MS) {
          handleError("Session disconnected. Please retry.");
        }
        // else keep polling — reconnect/QR may still arrive
      }
      // "starting" or "initializing" → keep polling, show spinner
    } catch (_) {
      // swallow transient poll errors
    }
  }, [chatbot.id, userId, stopPolling, onConnected, handleError]);

  // ── start session ─────────────────────────────────────────────────────────

  const startSession = useCallback(async () => {
    setStatus("starting");
    setQrDataUrl(null);
    setPhoneNumber(null);
    setErrorMsg("");
    stopPolling();
    startedAtRef.current = Date.now();

    try {
      const res = await fetch(SESSION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId: chatbot.id, userId }),
      });

      const data = await res.json();
      if (!isMountedRef.current) return;

      if (!res.ok) {
        handleError(data.error || "Failed to start session.");
        return;
      }

      // Server returns immediately — handle all three possible quick responses
      if (data.status === "connected") {
        setStatus("connected");
        setPhoneNumber(data.phoneNumber ?? null);
        onConnected(data.phoneNumber ?? "");
        return;
      }

      if (data.status === "qr_generated" && data.qrDataUrl) {
        setStatus("qr_generated");
        setQrDataUrl(data.qrDataUrl);
      }
      // else "starting" — keep spinner, polling will catch the QR

      // Begin polling regardless — will catch QR or connected state
      pollRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    } catch (err: any) {
      handleError(err.message || "Network error.");
    }
  }, [chatbot.id, userId, stopPolling, pollStatus, onConnected, handleError]);

  // ── disconnect ────────────────────────────────────────────────────────────

  const handleDisconnect = useCallback(async () => {
    stopPolling();
    setStatus("starting");
    try {
      await fetch(`${SESSION_API}?chatbotId=${chatbot.id}&userId=${userId}`, {
        method: "DELETE",
      });
      message.success("WhatsApp (QR) disconnected");
      setStatus("disconnected");
      setPhoneNumber(null);
      setQrDataUrl(null);
      onDisconnected();
    } catch (_) {
      message.error("Failed to disconnect. Try again.");
      setStatus("connected");
    }
  }, [chatbot.id, userId, stopPolling, onDisconnected]);

  // ── lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) startSession();
    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClose = () => {
    stopPolling();
    onClose();
    setTimeout(() => {
      setStatus("idle");
      setQrDataUrl(null);
      setPhoneNumber(null);
      setErrorMsg("");
    }, 300);
  };

  const isLoading = status === "starting" || status === "idle";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="whatsapp-qr-modal-container">
      <Modal
        open={isOpen}
        onCancel={handleClose}
        footer={null}
        className="whatsapp-qr-modal"
        width={400}
        maskClosable={!isLoading}
        title={null}
      >
        <div className="waqr-title">WhatsApp (QR / Personal)</div>
        <div className="waqr-subtitle">
          Connect any WhatsApp number — no Business account needed.
        </div>

        {/* Loading / starting */}
        {isLoading && (
          <div className="waqr-loading">
            <Spin size="large" />
            <span>Connecting to WhatsApp…</span>
          </div>
        )}

        {/* QR ready */}
        {status === "qr_generated" && qrDataUrl && (
          <div className="waqr-qr-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="WhatsApp QR code"
              width={280}
              height={280}
              className="waqr-qr-img"
            />
            <p className="waqr-qr-hint">
              Open WhatsApp → tap <strong>Linked Devices</strong> → tap{" "}
              <strong>Link a Device</strong> → scan this code
            </p>
          </div>
        )}

        {/* Connected */}
        {status === "connected" && (
          <div className="waqr-connected">
            <CheckCircleOutlined className="waqr-check-icon" />
            <div className="waqr-connected-title">Connected!</div>
            {phoneNumber && (
              <div className="waqr-phone-number">+{phoneNumber}</div>
            )}
            <div className="waqr-connected-hint">
              All messages to this number are now handled by your AI agent.
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="waqr-error">
            <CloseCircleOutlined style={{ fontSize: 36 }} />
            <span>{errorMsg || "Something went wrong."}</span>
          </div>
        )}

        {/* Footer */}
        <div className="waqr-footer">
          {status === "connected" && (
            <button className="waqr-btn-disconnect" onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
          {(status === "error" || status === "disconnected") && (
            <button className="waqr-btn-retry" onClick={startSession}>
              Retry
            </button>
          )}
          <button className="waqr-btn-close" onClick={handleClose}>
            {status === "connected" ? "Done" : "Close"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default WhatsappQRModal;
