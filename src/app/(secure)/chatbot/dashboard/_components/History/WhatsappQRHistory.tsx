"use client";

import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import MessageContent from "@/app/_components/MessageContent/MessageContent";
import { Pagination, message } from "antd";
import { useCookies } from "react-cookie";
import { ChatbotSettingContext } from "@/app/_helpers/client/Context/ChatbotSettingContext";
import closeImage from "../../../../../../../public/svgs/close-icon.svg";
import Image from "next/image";

interface Props {
  chatbotId: string;
}

type InboxMessage = {
  content: string;
  timestamp: string;
  isFromUser: boolean;
  isFromBot: boolean;
  isOwnerSent: boolean;
};

type ChatSummary = {
  phoneNumber: string;
  allMessages: InboxMessage[];
  totalMessages: number;
  lastUpdate: string | null;
};

const BASE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, "") ?? "";
const INBOX_API = `${BASE_URL}/chatbot/dashboard/whatsapp-qr/inbox/api`;
const AUTO_REPLY_API = `${BASE_URL}/chatbot/dashboard/whatsapp-qr/auto-reply/api`;
const SESSION_API = `${BASE_URL}/chatbot/dashboard/whatsapp-qr/session/api`;

const LIST_POLL_MS = 5000;
const CHAT_POLL_MS = 3000;

function getContactInitials(phone: string) {
  return phone.replace(/\D/g, "").slice(-2);
}

function formatPhoneDisplay(phone: string) {
  const clean = phone.replace(/\D/g, "");
  return clean.length >= 10 ? `+${clean}` : phone;
}

function formatContactTime(lastUpdate: string | null) {
  if (!lastUpdate) return "";
  const date = new Date(lastUpdate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDateForDisplay(dateKey: string) {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  if (dateKey === fmt(today)) return "Today";
  if (dateKey === fmt(yesterday)) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function groupMessagesByDate(messages: InboxMessage[]) {
  const grouped: Record<string, InboxMessage[]> = {};
  messages.forEach((m) => {
    const key = new Date(m.timestamp).toISOString().split("T")[0];
    (grouped[key] ||= []).push(m);
  });
  return grouped;
}

function getLastMessagePreview(msg?: InboxMessage) {
  if (!msg) return "No messages";
  let text = msg.content || "";
  if (msg.isFromBot) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    text = tempDiv.textContent || tempDiv.innerText || text;
  }
  return text.length > 40 ? `${text.slice(0, 40)}...` : text;
}

function getSenderLabel(msg: InboxMessage, ownerName?: string) {
  if (msg.isOwnerSent) return ownerName;
  if (msg.isFromBot) return "Torri AI";
  return null;
}

function WhatsappQRHistory({ chatbotId }: Props) {
  const [cookies] = useCookies(["userId"]);
  const userId: string = cookies.userId;
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [chatClicked, setChatClicked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [manualNumbers, setManualNumbers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);

  const listPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedPhoneRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedPhoneRef.current = selectedPhoneNumber;
  }, [selectedPhoneNumber]);

  useEffect(() => {
    const handleResize = () => setIsMobileDevice(window.innerWidth < 767);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE_URL}/api/user?userId=${encodeURIComponent(userId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json && setUserDetails(json.user))
      .catch(() => {});
  }, [userId]);

  const fetchConnectionStatus = useCallback(async () => {
    if (!chatbotId || !userId) return;
    try {
      const res = await fetch(`${SESSION_API}?chatbotId=${chatbotId}&userId=${userId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setIsConnected(data.status === "connected");
    } catch {
      // transient — ignore
    }
  }, [chatbotId, userId]);

  const fetchChatList = useCallback(async () => {
    if (!chatbotId || !userId) return;
    try {
      const res = await fetch(`${INBOX_API}?chatbotId=${chatbotId}&userId=${userId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.chats)) setChats(data.chats);
    } catch {
      // transient — ignore
    }
  }, [chatbotId, userId]);

  const fetchManualNumbers = useCallback(async () => {
    if (!chatbotId || !userId) return;
    try {
      const res = await fetch(`${AUTO_REPLY_API}?chatbotId=${chatbotId}&userId=${userId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.numbers)) setManualNumbers(data.numbers);
    } catch {
      // transient — ignore
    }
  }, [chatbotId, userId]);

  const fetchChatDetail = useCallback(
    async (phoneNumber: string) => {
      if (!chatbotId || !userId) return;
      try {
        const res = await fetch(
          `${INBOX_API}?chatbotId=${chatbotId}&userId=${userId}&phoneNumber=${phoneNumber}`,
          { cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        // Guard against a stale response landing after the user switched contacts.
        if (data.chat && selectedPhoneRef.current === phoneNumber) {
          setSelectedChat(data.chat);
        }
      } catch {
        // transient — ignore
      }
    },
    [chatbotId, userId]
  );

  // ── list + status polling ────────────────────────────────────────────────
  useEffect(() => {
    fetchConnectionStatus();
    fetchChatList();
    fetchManualNumbers();

    listPollRef.current = setInterval(() => {
      fetchConnectionStatus();
      fetchChatList();
      fetchManualNumbers();
    }, LIST_POLL_MS);

    return () => {
      if (listPollRef.current) clearInterval(listPollRef.current);
    };
  }, [fetchConnectionStatus, fetchChatList, fetchManualNumbers]);

  // ── open-conversation polling ────────────────────────────────────────────
  useEffect(() => {
    if (chatPollRef.current) {
      clearInterval(chatPollRef.current);
      chatPollRef.current = null;
    }
    if (!selectedPhoneNumber) {
      setSelectedChat(null);
      return;
    }
    fetchChatDetail(selectedPhoneNumber);
    chatPollRef.current = setInterval(() => fetchChatDetail(selectedPhoneNumber), CHAT_POLL_MS);
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [selectedPhoneNumber, fetchChatDetail]);

  // ── autoscroll ────────────────────────────────────────────────────────────
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const count = selectedChat?.allMessages?.length || 0;
    const isNewChat = prevMessageCountRef.current === 0;
    const grew = count > prevMessageCountRef.current;
    prevMessageCountRef.current = count;
    if ((isNewChat || grew) && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNewChat || nearBottom) {
        setTimeout(() => container.scrollTo({ top: container.scrollHeight, behavior: "smooth" }), 100);
      }
    }
  }, [selectedChat?.allMessages?.length]);

  const isAutoReply = (phoneNumber: string) => !manualNumbers.includes(phoneNumber);

  const toggleAutoReply = async (phoneNumber: string) => {
    const nextAutoReply = !isAutoReply(phoneNumber);
    // Optimistic update
    setManualNumbers((prev) =>
      nextAutoReply ? prev.filter((n) => n !== phoneNumber) : [...prev, phoneNumber]
    );
    try {
      const res = await fetch(AUTO_REPLY_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, userId, phoneNumber, enable: !nextAutoReply }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (Array.isArray(data.numbers)) setManualNumbers(data.numbers);
    } catch {
      // Revert on failure
      setManualNumbers((prev) =>
        nextAutoReply ? [...prev, phoneNumber] : prev.filter((n) => n !== phoneNumber)
      );
      message.error("Failed to update auto-reply setting");
    }
  };

  const filteredChats = chats
    .filter((c) => c.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.lastUpdate || 0).getTime() - new Date(a.lastUpdate || 0).getTime());

  const pageSize = 10;
  const pagedChats = filteredChats.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const ownerName = userDetails?.username?.split("_")[0];

  return (
    <div className="chatbot-history-parts">
      <div className="whatsapp-history-details">
        <div className="whatsapp-search-container">
          <input
            type="text"
            placeholder="Search phone number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="whatsapp-search-input"
          />
        </div>

        <div className="whatsapp-chat-list">
          {chats.length === 0 ? (
            <div className="loading">
              {isConnected ? (
                <>
                  📭 No chats available
                  <br />
                  <small>Waiting for messages...</small>
                </>
              ) : (
                <>
                  🔌 No WhatsApp QR number connected
                  <br />
                  <small>Connect one from Integrations first</small>
                </>
              )}
            </div>
          ) : (
            pagedChats.map((chat) => {
              const initials = getContactInitials(chat.phoneNumber);
              const autoReply = isAutoReply(chat.phoneNumber);
              const isActive = selectedPhoneNumber === chat.phoneNumber;
              return (
                <div
                  key={chat.phoneNumber}
                  className={`whatsapp-chat-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setSelectedPhoneNumber(chat.phoneNumber);
                    setChatClicked(true);
                  }}
                >
                  <div
                    className="whatsapp-avatar"
                    style={{ backgroundColor: `hsl(${(parseInt(initials, 10) * 137.5) % 360}, 70%, 60%)` }}
                  >
                    {initials}
                  </div>
                  <div className="whatsapp-chat-info">
                    <div className="whatsapp-chat-header">
                      <span className="whatsapp-phone">{formatPhoneDisplay(chat.phoneNumber)}</span>
                    </div>
                    <div className="whatsapp-chat-footer">
                      <span className="whatsapp-message">{getLastMessagePreview(chat.allMessages?.[0])}</span>
                    </div>
                  </div>
                  <div
                    className="whatsapp-toggle"
                    title={autoReply ? "AI will reply" : `${ownerName || "You"} will reply`}
                  >
                    <label className="toggle-switch" aria-label={autoReply ? "Auto-reply on" : "Auto-reply off"}>
                      <input
                        type="checkbox"
                        checked={autoReply}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleAutoReply(chat.phoneNumber);
                        }}
                      />
                      <span className="toggle-slider">
                        <span className="toggle-label toggle-label-on">AI</span>
                        <span className="toggle-label toggle-label-off">You</span>
                        <span className="toggle-knob" aria-hidden="true"></span>
                      </span>
                    </label>
                    <span className="whatsapp-time">{formatContactTime(chat.lastUpdate)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredChats.length > pageSize && (
          <Pagination
            defaultCurrent={1}
            current={currentPage}
            total={filteredChats.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            pageSize={pageSize}
          />
        )}
      </div>

      {isMobileDevice && chatClicked && (
        <div className="message-scrim" onClick={() => setChatClicked(false)} />
      )}

      <div
        className={`message-section-wrapper ${isMobileDevice && chatClicked ? "mobile-panel" : ""}`}
        style={{
          display: !isMobileDevice ? "block" : chatClicked ? "block" : "none",
        }}
      >
        <div className="messages-section">
          <div className="header" style={{ visibility: selectedChat ? "visible" : "hidden" }}>
            <p className="header-email">{selectedPhoneNumber ? formatPhoneDisplay(selectedPhoneNumber) : ""}</p>
            <div className="action-btns">
              {isMobileDevice && (
                <Image src={closeImage} alt="close-icon" onClick={() => setChatClicked(false)} />
              )}
            </div>
          </div>
          <hr style={{ visibility: selectedChat ? "visible" : "hidden" }} />

          <div className="history-conversation-container" ref={messagesContainerRef}>
            {selectedChat &&
              Object.entries(groupMessagesByDate(selectedChat.allMessages || [])).map(([dateKey, messages]) => (
                <React.Fragment key={dateKey}>
                  <div className="whatsapp-date-separator">
                    <span className="date-label">{formatDateForDisplay(dateKey)}</span>
                  </div>
                  {messages.map((msg, index) => (
                    <div
                      key={`${dateKey}-${index}`}
                      className={msg.isFromUser ? "user-message-container" : "assistant-message-container"}
                    >
                      <div
                        className={msg.isFromUser ? "user-message" : "assistant-message"}
                        style={msg.isFromUser ? { backgroundColor: botSettings?.userMessageColor || "#d9fdd3" } : {}}
                      >
                        {msg.isFromBot ? <MessageContent content={msg.content} /> : <div>{msg.content}</div>}
                      </div>
                      <div className="time" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {(() => {
                          const label = getSenderLabel(msg, ownerName);
                          return label ? (
                            <span className="whatsapp-sender-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span className="whatsapp-dot" aria-hidden="true" />
                              <span className="whatsapp-sender-text">{label}</span>
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
          </div>

          {selectedChat && !isAutoReply(selectedChat.phoneNumber) && (
            <div className="whatsapp-manual-mode-banner">
              You&apos;ve turned off AI auto-reply for this contact — please continue this chat from
              the WhatsApp app on your phone. Messages sent from either side will still show up here.
            </div>
          )}

          <div className="footer" style={{ visibility: selectedChat ? "visible" : "hidden" }}>
            <p>Powered by Torri.AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsappQRHistory;
