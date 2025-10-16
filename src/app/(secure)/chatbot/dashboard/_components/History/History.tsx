import React, { useContext, useEffect, useState, useRef } from "react";
import Image from "next/image";
import exportBtn from "../../../../../../../public/svgs/export-btn.svg";
import { useCookies } from "react-cookie";
import likeIcon from "../../../../../../../public/svgs/like.svg";
import dislikeIcon from "../../../../../../../public/svgs/dislike.svg";
import SourcesDots from "../../../../../../../public/sources-dots.png";
import CloseBtn from "../../../../../../../public/close-circle.png";
import BackIcon from "../../../../../../../public/source-reference/arrow-left.png";
import "./history.scss";
import ChatbotNameModal from "../../../../../_components/Modal/ChatbotNameModal";
import {
  ConfigProvider,
  DatePicker,
  Pagination,
  message,
  Typography,
} from "antd";
import { ChatbotSettingContext } from "../../../../../_helpers/client/Context/ChatbotSettingContext";
import { PrintingChats } from "../Printing-Chats/Printing";
import ReactToPrint from "react-to-print";
import {
  AUTHORIZATION_FAILED,
  JWT_EXPIRED,
} from "../../../../../_helpers/errorConstants";
import { getTimeAgo } from "@/app/_helpers/client/getTime";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";
import closeImage from "../../../../../../../public/svgs/close-icon.svg";
import noHistory from "../../../../../../../public/svgs/empty-history.svg";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";

const HighlightedInfoPage = dynamic(
  () => import("../Highlighted-Info/highlighted-info"),
  {
    ssr: false,
  }
);

const { RangePicker } = DatePicker;

function History({ chatbotId }: any) {
  let tempRef: any = useRef<HTMLDivElement>();
  // detect whether current device is mobile/tab (width < 767)
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const handleMobileResize = () => setIsMobileDevice(window.innerWidth < 767);
    handleMobileResize();
    window.addEventListener("resize", handleMobileResize);
    return () => window.removeEventListener("resize", handleMobileResize);
  }, []);

  const [chatHistoryList, setChatHistoryList]: any = useState([]);
  const [currentChatHistory, setCurrentChatHistory]: any = useState([]);
  /// tempary state to store the chat history for filtering leads
  const [tempChatHistory, setTempChatHistory]: any = useState([]);
  const [activeCurrentChatHistory, setActiveCurrentChatHistory]: any =
    useState();

  const [cookies, setCookies] = useCookies(["userId"]);

  const [leadsFilter, setLeadsFilter] = useState("");
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayDate, setDisplayDate] = useState(null);
  const selectedDate: any = useRef(null);

  const [chatClicked, setIsChatClicked] = useState<boolean>(false);

  const handleCancel = () => {
    selectedDate.current = null;
    setOpenDatePicker(false);
  };

  /// method to handle page offset
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the bot settings context
  const botSettingContext: any = useContext(ChatbotSettingContext);
  const botSettings = botSettingContext?.chatbotSettings;

  const [displayEmail, setDisplayEmail] = useState("");

  /// sources container title
  const [sourcesContainerTitle, setSourcesContainerTitle] = useState("sources");

  /// chathistory classifier
  const [chatHistoryClassifier, setChatHistoryClassifier] = useState("normal");

  /// whatsapp history states
  const [whatsappSearchQuery, setWhatsappSearchQuery] = useState("");
  const [whatsappCurrentPage, setWhatsappCurrentPage] = useState(1);
  const [whatsappChats, setWhatsappChats] = useState<any[]>([]);
  const [selectedWhatsappChat, setSelectedWhatsappChat] = useState<any>(null);
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [whatsappStats, setWhatsappStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    connectedClients: 0,
  });
  const [outgoingMessage, setOutgoingMessage] = useState("");

  // Socket reference
  const socketRef = useRef<Socket | null>(null);
  const statsIntervalRef = useRef<any>(null);
  const selectedWhatsappChatRef = useRef<any>(null);
  const whatsappChatsRef = useRef<any[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // WhatsApp socket server URL - update this to your actual server URL
  const WHATSAPP_SERVER_URL = process.env.NEXT_PUBLIC_WHATSAPP_SOCKET_URL || "http://localhost:3001";

  // Update refs when state changes
  useEffect(() => {
    selectedWhatsappChatRef.current = selectedWhatsappChat;
  }, [selectedWhatsappChat]);

  useEffect(() => {
    whatsappChatsRef.current = whatsappChats;
  }, [whatsappChats]);

  // Track previous message count to detect new messages
  const prevMessageCountRef = useRef<number>(0);

  // Auto-scroll to bottom when selectedWhatsappChat messages change
  useEffect(() => {
    if (chatHistoryClassifier === "whatsapp" && selectedWhatsappChat) {
      const currentMessageCount = selectedWhatsappChat.allMessages?.length || 0;
      const isNewChat = prevMessageCountRef.current === 0;
      const hasNewMessages = currentMessageCount > prevMessageCountRef.current;

      // Update ref
      prevMessageCountRef.current = currentMessageCount;

      // Scroll if: new chat selected OR (new messages arrived AND user was near bottom)
      if (isNewChat || (hasNewMessages && isNearBottom())) {
        setTimeout(() => {
          scrollToBottom(true);
        }, 100);
      }
    } else {
      // Reset when no chat selected
      prevMessageCountRef.current = 0;
    }
  }, [selectedWhatsappChat?.allMessages?.length, chatHistoryClassifier, selectedWhatsappChat]);

  const relevanceLevels = React.useMemo(
    () => [
      { label: "All", color: "#F4F5F6" },
      { label: "Most relevant", color: "#E0EDFF" },
      { label: "Relevant", color: "#D3F8DE" },
      { label: "Good", color: "#FFF3B2" },
      { label: "Low", color: "#FFD0B2" },
      { label: "Very low", color: "#FDD" },
    ],
    []
  );

  // active relevance filter (single-select). 'All' means no filter applied.
  const [activeRelevance, setActiveRelevance] = useState<string>("All");

  // color helpers: contrast and darken
  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    const bigint = parseInt(
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h,
      16
    );
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const getContrastColor = (hex: string) => {
    try {
      const { r, g, b } = hexToRgb(hex);
      // relative luminance
      const [R, G, B] = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
      return L > 0.5 ? "#000" : "#fff";
    } catch {
      return "#000";
    }
  };

  const darkenHex = (hex: string, pct = 0.35) => {
    try {
      const { r, g, b } = hexToRgb(hex);
      const nr = Math.max(0, Math.round(r * (1 - pct)));
      const ng = Math.max(0, Math.round(g * (1 - pct)));
      const nb = Math.max(0, Math.round(b * (1 - pct)));
      const toHex = (v: number) => v.toString(16).padStart(2, "0");
      return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
    } catch {
      return hex;
    }
  };

  const getRelevanceLabelForScore = (score: number) => {
    if (score >= 0.85) return "Most relevant";
    if (score >= 0.8) return "Relevant";
    if (score >= 0.7) return "Good";
    if (score >= 0.6) return "Low";
    return "Very low";
  };

  const extractScoreFromSource = (src: any): number | null => {
    if (!src) return null;
    if (typeof src.score === "number") return src.score;
    if (typeof src.score === "string" && src.score !== "") {
      const n = parseFloat(src.score);
      if (!isNaN(n)) return n;
    }
    const label = String(src.source || src.title || "");
    const match = label.match(/\(score:\s*([0-9.]+)\)/i);
    if (match) return parseFloat(match[1]);
    return null;
  };

  const handleRelevanceClick = (label: string) => {
    setActiveRelevance((prev) => (prev === label ? "All" : label));
  };

  // ============ WhatsApp Socket Functions ============

  // Utility: Get contact initials from phone number
  const getContactInitials = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.slice(-2);
  };

  // Utility: Format phone for display
  const formatPhoneDisplay = (phone: string) => {
    const clean = phone.replace(/\D/g, "");
    if (clean.length >= 10) {
      return `+${clean}`;
    }
    return phone;
  };

  // Utility: Format time for chat list
  const formatContactTime = (lastUpdate: string) => {
    const date = new Date(lastUpdate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Utility: Get last message preview
  const getLastMessagePreview = (chat: any) => {
    if (!chat.allMessages || chat.allMessages.length === 0) {
      return "No messages";
    }

    const lastMessage = chat.allMessages[chat.allMessages.length - 1];
    let text = "";

    if (lastMessage.isFromUser) {
      text = `You: ${lastMessage.content}`;
    } else if (lastMessage.isFromBot) {
      // Strip HTML tags for preview
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = lastMessage.content;
      text = tempDiv.textContent || tempDiv.innerText || lastMessage.content;
    } else {
      text = lastMessage.content;
    }

    // Truncate
    if (text.length > 40) {
      text = text.substring(0, 40) + "...";
    }

    return text;
  };

  // Fetch auto-reply list from server
  const fetchAutoReplyList = React.useCallback(async () => {
    try {
      const res = await fetch(
        `${WHATSAPP_SERVER_URL}/api/auto-reply?chatbotId=${chatbotId}&userId=${cookies.userId}`
      );
      if (!res.ok) return;
      const json = await res.json();
      if (json && Array.isArray(json.numbers)) {
        // Tag chats: presence in server list means manual => autoReply = false
        setWhatsappChats((prev) =>
          prev.map((c) => ({
            ...c,
            autoReply: !json.numbers.includes(c.phoneNumber),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch auto-reply list:", err);
    }
  }, [chatbotId, cookies.userId, WHATSAPP_SERVER_URL]);

  // Toggle auto-reply for a phone number
  const toggleAutoReply = async (phoneNumber: string) => {
    const chat = whatsappChats.find((c) => c.phoneNumber === phoneNumber);
    const currentState = !!(chat && chat.autoReply);
    const newState = !currentState;

    // Optimistic update
    setWhatsappChats((prev) =>
      prev.map((c) =>
        c.phoneNumber === phoneNumber ? { ...c, autoReply: newState } : c
      )
    );

    try {
      const enableManual = !newState;
      const res = await fetch(`${WHATSAPP_SERVER_URL}/api/auto-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          enable: enableManual,
          chatbotId,
          userId: cookies.userId,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const json = await res.json();
      if (json && Array.isArray(json.numbers)) {
        setWhatsappChats((prev) =>
          prev.map((c) => ({
            ...c,
            autoReply: !json.numbers.includes(c.phoneNumber),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to toggle auto-reply:", err);
      // Revert on error
      setWhatsappChats((prev) =>
        prev.map((c) =>
          c.phoneNumber === phoneNumber ? { ...c, autoReply: currentState } : c
        )
      );
      message.error("Failed to update auto-reply setting");
    }
  };

  // Fetch server stats
  const fetchServerStats = React.useCallback(async () => {
    try {
      const res = await fetch(`${WHATSAPP_SERVER_URL}/api/stats`);
      if (!res.ok) return;
      const json = await res.json();
      if (json) {
        setWhatsappStats((prev) => ({
          ...prev,
          connectedClients: json.connectedClients || 0,
        }));
      }
    } catch (err) {
      // Silent fail
    }
  }, [WHATSAPP_SERVER_URL]);

  // Handle incoming chats from socket
  const handleIncomingChats = (chats: any[]) => {
    if (!chats || !Array.isArray(chats)) {
      console.error("❌ Invalid chats data received:", chats);
      return;
    }

    setWhatsappChats((prevChats) => {
      const updatedChats = [...prevChats];

      chats.forEach((incomingChat) => {
        if (!incomingChat || !incomingChat.phoneNumber) {
          console.warn("⚠️ Invalid chat object:", incomingChat);
          return;
        }

        const existingIndex = updatedChats.findIndex(
          (chat) => chat.phoneNumber === incomingChat.phoneNumber
        );

        if (existingIndex >= 0) {
          // Preserve autoReply flag
          const hadAutoReply = Object.prototype.hasOwnProperty.call(
            updatedChats[existingIndex],
            "autoReply"
          );
          const preservedAuto = updatedChats[existingIndex].autoReply;

          updatedChats[existingIndex] = incomingChat;

          if (!Object.prototype.hasOwnProperty.call(incomingChat, "autoReply")) {
            updatedChats[existingIndex].autoReply = hadAutoReply
              ? preservedAuto
              : true;
          }

          // Update selected chat if this is the currently selected chat
          if (selectedWhatsappChatRef.current?.phoneNumber === incomingChat.phoneNumber) {
            setSelectedWhatsappChat(updatedChats[existingIndex]);
          }
        } else {
          // New chat - default autoReply to true
          if (!Object.prototype.hasOwnProperty.call(incomingChat, "autoReply")) {
            incomingChat.autoReply = true;
          }
          updatedChats.push(incomingChat);
        }
      });

      return updatedChats;
    });
  };

  // Connect to WhatsApp socket
  const connectWhatsappSocket = React.useCallback(() => {
    // Don't reconnect if already connected
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(WHATSAPP_SERVER_URL, {
      transports: ["websocket", "polling"],
      query: { chatbotId, userId: cookies.userId },
    });

    socket.on("connect", () => {
      setIsWhatsappConnected(true);
      message.success("Connected to WhatsApp server");

      // Start polling stats
      fetchServerStats();
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = setInterval(fetchServerStats, 5000);

      // Fetch auto-reply list
      fetchAutoReplyList();
    });

    socket.on("disconnect", (reason: string) => {
      setIsWhatsappConnected(false);
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    });

    socket.on("connected", (data: any) => {
      // Server confirmation
    });

    socket.on("whatsapp_messages", (data: any) => {
      if (data.messageCount !== undefined) {
        setWhatsappStats((prev) => ({
          ...prev,
          totalMessages: data.messageCount,
        }));
      }
      if (data.chatCount !== undefined) {
        setWhatsappStats((prev) => ({ ...prev, totalChats: data.chatCount }));
      }
      if (data.data && Array.isArray(data.data)) {
        handleIncomingChats(data.data);
        fetchAutoReplyList();
      } else {
        console.warn("⚠️ Invalid data structure in whatsapp_messages:", data);
      }
    });

    socket.on("initial_data", (data: any) => {
      if (data.messageCount !== undefined) {
        setWhatsappStats((prev) => ({
          ...prev,
          totalMessages: data.messageCount,
        }));
      }
      if (data.chatCount !== undefined) {
        setWhatsappStats((prev) => ({ ...prev, totalChats: data.chatCount }));
      }
      if (data.data && Array.isArray(data.data)) {
        handleIncomingChats(data.data);
        fetchAutoReplyList();
      } else {
        console.warn("⚠️ Invalid data structure in initial_data:", data);
      }
    });

    socket.on("chat_data", (response: any) => {
      if (response.success && response.data) {
        handleIncomingChats([response.data]);

        // If this is the selected chat, update it using ref
        if (
          selectedWhatsappChatRef.current &&
          selectedWhatsappChatRef.current.phoneNumber === response.data.phoneNumber
        ) {
          setSelectedWhatsappChat(response.data);
        }
      }
    });

    // Handle message sent confirmation
    socket.on("message_sent", (payload: any) => {
      if (!payload || !payload.clientMessageId) return;
      
      const { clientMessageId } = payload;
      markLocalMessageDelivery(clientMessageId, "sent");
    });

    // Handle message send errors
    socket.on("message_error", (payload: any) => {
      if (!payload || !payload.clientMessageId) return;
      
      const { clientMessageId, error } = payload;
      markLocalMessageDelivery(clientMessageId, "failed");
      message.error(`Failed to send message: ${error || "Unknown error"}`);
    });

    socket.on("error", (error: any) => {
      console.error("Socket error:", error);
      message.error("WhatsApp connection error");
    });

    socket.on("connect_error", (error: any) => {
      console.error("Connection error:", error);
      message.error("Failed to connect to WhatsApp server");
    });

    socketRef.current = socket;
  }, [chatbotId, cookies.userId, WHATSAPP_SERVER_URL, fetchAutoReplyList, fetchServerStats]);

  // Disconnect from WhatsApp socket
  const disconnectWhatsappSocket = React.useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsWhatsappConnected(false);
    setWhatsappChats([]);
    setSelectedWhatsappChat(null);
    setWhatsappStats({ totalChats: 0, totalMessages: 0, connectedClients: 0 });

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
  }, []);

  // Connect/disconnect when switching to/from WhatsApp tab
  useEffect(() => {
    if (chatHistoryClassifier === "whatsapp") {
      // Only connect if not already connected
      if (!socketRef.current || !socketRef.current.connected) {
        connectWhatsappSocket();
      }
    } else {
      // Disconnect when leaving WhatsApp tab
      disconnectWhatsappSocket();
    }

    // Cleanup on unmount
    return () => {
      if (chatHistoryClassifier === "whatsapp") {
        disconnectWhatsappSocket();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistoryClassifier]);

  // ============ End WhatsApp Socket Functions ============

  // Handle WhatsApp chat selection
  const handleWhatsappChatSelect = (chat: any) => {
    setSelectedWhatsappChat(chat);
    setIsChatClicked(true);
  };

  // Format message time for WhatsApp display
  const formatMessageTime = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date for WhatsApp display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (dateString === formatDate(today)) {
      return "Today";
    } else if (dateString === formatDate(yesterday)) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Group WhatsApp messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.timestamp);
      const dateKey = date.toISOString().split("T")[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });

    return grouped;
  };

  // Scroll to bottom of messages container
  const scrollToBottom = (smooth: boolean = true) => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const scrollOptions: ScrollToOptions = {
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      };
      container.scrollTo(scrollOptions);
    }
  };

  // Check if user is near bottom of scroll (within 150px)
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 150;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  };

  // Mark local message delivery status
  const markLocalMessageDelivery = (clientMessageId: string, status: "pending" | "sent" | "failed") => {
    setWhatsappChats((prevChats) => {
      return prevChats.map((chat) => {
        const messageIndex = (chat.allMessages || []).findIndex(
          (m: any) => m.clientMessageId === clientMessageId
        );
        
        if (messageIndex >= 0) {
          const updatedMessages = [...chat.allMessages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            deliveryStatus: status,
          };
          
          const updatedChat = {
            ...chat,
            allMessages: updatedMessages,
          };

          // If this is the selected chat, update it
          if (selectedWhatsappChatRef.current?.phoneNumber === chat.phoneNumber) {
            setSelectedWhatsappChat(updatedChat);
          }

          return updatedChat;
        }
        
        return chat;
      });
    });
  };

  // Send WhatsApp message
  const sendWhatsappMessage = () => {
    const text = outgoingMessage.trim();
    if (!text) {
      message.warning("Please enter a message");
      return;
    }

    if (!selectedWhatsappChat) {
      message.warning("Please select a chat first");
      return;
    }

    if (!socketRef.current || !isWhatsappConnected) {
      message.error("Not connected to WhatsApp server");
      return;
    }

    // Check if auto-reply is enabled for this chat
    if (selectedWhatsappChat.autoReply) {
      message.warning("Auto-reply is enabled for this chat. Please disable it to send manual messages.");
      return;
    }

    // Generate unique client message ID
    const clientMessageId = `cmsg_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;

    // Create optimistic local message
    const localMsg = {
      content: text,
      timestamp: Date.now(),
      isFromUser: false,
      isFromBot: true,
      clientMessageId,
      deliveryStatus: "pending",
    };

    // Add message to local state optimistically
    setWhatsappChats((prevChats) => {
      return prevChats.map((chat) => {
        if (chat.phoneNumber === selectedWhatsappChat.phoneNumber) {
          const updatedChat = {
            ...chat,
            allMessages: [...(chat.allMessages || []), localMsg],
            totalMessages: (chat.totalMessages || 0) + 1,
            lastUpdate: new Date().toISOString(),
          };

          // Update selected chat as well
          setSelectedWhatsappChat(updatedChat);

          return updatedChat;
        }
        return chat;
      });
    });

    // Clear input
    setOutgoingMessage("");

    // Scroll to bottom after message is added
    setTimeout(() => {
      scrollToBottom(true);
    }, 100);

    // Send to server via socket
    socketRef.current.emit(
      "send_whatsapp_message",
      {
        phoneNumber: selectedWhatsappChat.phoneNumber,
        text,
        clientMessageId,
      },
      (response: any) => {
        if (response && response.success) {
          console.log("Server acknowledged message send request");
        } else {
          // Mark as failed if server immediately rejects
          markLocalMessageDelivery(clientMessageId, "failed");
          message.error(`Failed to send message: ${response?.error || "Unknown error"}`);
        }
      }
    );
  };

  /// update the chat history data
  const fetchHistoryCount = async (
    count = false,
    page = 1,
    pageSize = 10,
    startDate: any = null,
    endDate: any = null
  ) => {
    if (botDetails?.referedFrom == "leads") {
      if (tempChatHistory.length == 0) {
        /// filter the data and copy the chat history to temp chat history
        setTempChatHistory(chatHistoryList);
        const filteredData = chatHistoryList.filter((data: any) => {
          const date = new Date(data[1].sessionEndDate).toLocaleDateString(
            "en-CA"
          );

          return date >= startDate && date <= endDate;
        });

        setChatHistoryList(filteredData);
      } else {
        /// filter the data from temp chat history
        const filteredData = tempChatHistory.filter((data: any) => {
          const date = new Date(data[1].sessionEndDate).toLocaleDateString(
            "en-CA"
          );

          return date >= startDate && date <= endDate;
        });

        setChatHistoryList(filteredData);
      }
      // alert("leads");
    } else {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10&filterSource=history`
      );
      const content = await response.json();
      // setChatHistoryList(content?.chatHistory);
      setChatHistoryList(Object.entries(content?.chatHistory?.chats).reverse());
    }

    /// used only to get the total number of pages when page loads
    // if (count) {
    //   setTotalPages(content?.leadsCount);
    // }
  };

  useEffect(() => {
    /// retrive the chatbot data
    const retriveData = async () => {
      let response;
      if (botDetails?.leadSessionsEmail == "") {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=null&endDate=null&page=1&pageSize=10&filterSource=history`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // body: JSON.stringify({

            // }),
            // next: { revalidate: 0 },
          }
        );
      } else {
        response = await fetch(
          `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/history?chatbotId=${chatbotId}&userId=${cookies.userId}&startDate=null&endDate=null&page=1&pageSize=10&filterSource=lead-history&email=${botDetails?.leadSessionsEmail}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            // body: JSON.stringify({

            // }),
            // next: { revalidate: 0 },
          }
        );
      }
      const content = await response.json();

      if (content?.message === JWT_EXPIRED) {
        message.error(AUTHORIZATION_FAILED).then(() => {
          window.location.href = "/account/login";
        });
        return;
      }
      // setChatHistoryList(content?.chatHistory);
      setChatHistoryList(Object.entries(content?.chatHistory?.chats).reverse());
    };

    retriveData();
  }, [botDetails?.leadSessionsEmail, chatbotId, cookies.userId]);

  /// chatbot messages feedback pop up state
  const [open, setOpen] = useState(false);
  const [feedbackText, setfeedbackText] = useState("");
  const [feedbackIndex, setFeedbackIndex] = useState(0);
  const [feedbackStatus, setfeedbackStatus] = useState("");

  /// sources modal state
  const [sourcesModal, setSourcesModal] = useState(false);
  const [selectedSources, setSelectedSources] = useState<any[]>([]);

  // compute counts per relevance label based on selectedSources
  const relevanceCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    relevanceLevels.forEach((r) => map.set(r.label, 0));
    if (!selectedSources || !selectedSources.length) return map;
    for (const src of selectedSources) {
      const s = extractScoreFromSource(src);
      if (s == null) continue; // unscored items don't belong to any bucket
      const label = getRelevanceLabelForScore(s);
      map.set(label, (map.get(label) || 0) + 1);
    }
    // fill 'All' as total items (including unscored)
    map.set("All", selectedSources.length);
    return map;
  }, [selectedSources, relevanceLevels]);

  const relevanceBarRef = useRef<HTMLDivElement | null>(null);

  const RelevanceBar = () => (
    <div className="relevance-bar" ref={relevanceBarRef}>
      {relevanceLevels
        .filter((item) => (relevanceCounts.get(item.label) || 0) > 0)
        .map((item) => {
          const isActive = activeRelevance === item.label;
          const textColor = getContrastColor(item.color);
          const borderColor = isActive
            ? darkenHex(item.color, 0.35)
            : "transparent";
          const count = relevanceCounts.get(item.label) || 0;
          const pillRef = React.createRef<HTMLDivElement>();
          return (
            <div
              key={item.label}
              ref={pillRef}
              className={`relevance-level ${isActive ? "active" : ""}`}
              onClick={() => {
                handleRelevanceClick(item.label);
                // scroll the clicked pill to the start of the container
                try {
                  pillRef.current?.scrollIntoView({
                    behavior: "smooth",
                    inline: "start",
                    block: "nearest",
                  });
                } catch {}
              }}
              style={{ background: item.color, color: textColor, borderColor }}
              role="button"
              aria-pressed={isActive}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleRelevanceClick(item.label);
                }
              }}
            >
              <span className="relevance-label">{item.label}</span>
              <span className="relevance-count">{count}</span>
            </div>
          );
        })}
    </div>
  );

  /// Messages feedback opener
  async function openChatbotModal(index: number, status: string) {
    /// set the like/dislike btn check and the index to store the message history
    setFeedbackIndex(index);
    setfeedbackStatus(status);
    /// open the chatbot naming dialog box when creating bot
    setOpen(true);
  }

  /// Handle sources display
  const handleShowSources = (sources: any[]) => {
    setSelectedSources(sources);
    setSourcesModal(true);
  };

  /// handling the chatbot ok action
  const handleOk = async () => {
    if (feedbackText.length < 10) {
      message.error("Please provide add more feeback");
      return;
    }
    setOpen(false);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/dashboard/feedback/api`,
      {
        headers: {
          cache: "no-store",
        },
        method: "POST",
        body: JSON.stringify({
          chatbotId: chatbotId,
          messages: [...currentChatHistory.slice(0, feedbackIndex + 1)],
          feedback: { text: feedbackText, status: feedbackStatus },
        }),
        next: { revalidate: 0 },
      }
    );

    /// if response is ok then clear the feeback text
    if (!response.ok) throw new Error(await response.json());
    else {
      setfeedbackText("");
    }

    const body = await response.json();
    message.info(body?.message);
  };
  return (
    <div className="history-chat-container">
      <div className="action-container">
        <div className="date-picker-container">
          {/* custom date buttons */}
          <div className="interval-btns">
            <div className="history-classifier">
              <button
                className={`interval-btn ${
                  chatHistoryClassifier === "normal" && "active"
                }`}
                onClick={() => {
                  setChatHistoryClassifier("normal");
                  // setCurrentChatHistory([])
                }}
              >
                Normal
              </button>

              <button
                className={`interval-btn ${
                  chatHistoryClassifier === "whatsapp" && "active"
                }`}
                onClick={() => {
                  setChatHistoryClassifier("whatsapp");
                }}
              >
                Whatsapp
              </button>
            </div>

            <div className="date-picker-container">
              <button
                className={`interval-btn ${
                  leadsFilter === "today" && "active"
                }`}
                onClick={() => {
                  const today: any = new Date().toLocaleDateString("en-CA");
                  fetchHistoryCount(true, 1, 10, today, today);
                  setCurrentPage(1);
                  setLeadsFilter("today");
                  setOpenDatePicker(false);
                  setDisplayDate(null);
                  setCurrentChatHistory([]);
                }}
              >
                Today
              </button>
              <button
                className={`interval-btn ${
                  leadsFilter === "last-7-day" && "active"
                }`}
                onClick={() => {
                  const today: any = new Date().toLocaleDateString("en-CA");
                  const last7Days: any = new Date();
                  last7Days.setDate(last7Days.getDate() - 7);
                  let refinedFormatLast7Days =
                    last7Days.toLocaleDateString("en-CA");
                  fetchHistoryCount(true, 1, 10, refinedFormatLast7Days, today);
                  setCurrentPage(1);
                  setLeadsFilter("last-7-day");
                  setOpenDatePicker(false);
                  setDisplayDate(null);
                  setCurrentChatHistory([]);
                }}
              >
                Last 7 Days
              </button>
              <button
                className={`interval-btn ${
                  leadsFilter === "last-month" && "active"
                }`}
                onClick={() => {
                  const today: any = new Date();
                  today.setDate(0);
                  let refinedFormatLastMonthEndDate =
                    today.toLocaleDateString("en-CA");

                  const lastMonth: any = new Date();
                  lastMonth.setMonth(lastMonth.getMonth() - 1);
                  lastMonth.setDate(1);
                  let refinedFormatLastMonth =
                    lastMonth.toLocaleDateString("en-CA");
                  setCurrentPage(1);
                  fetchHistoryCount(
                    true,
                    1,
                    10,
                    refinedFormatLastMonth,
                    refinedFormatLastMonthEndDate
                  );
                  setLeadsFilter("last-month");
                  setOpenDatePicker(false);
                  setDisplayDate(null);
                  setCurrentChatHistory([]);
                }}
              >
                Last Month
              </button>
              <ConfigProvider
                theme={{
                  components: {
                    DatePicker: {
                      cellActiveWithRangeBg: "#ECF0FE",
                      cellHoverBg: "#ECF0FE",
                      colorPrimary: "#4D72F5",
                    },
                  },
                }}
              >
                <RangePicker
                  className={`${leadsFilter === "custom-date" && "active"}`}
                  onClick={() => {
                    setOpenDatePicker(true);
                    setLeadsFilter("custom-date");
                  }}
                  // superNextIcon={null}
                  // superPrevIcon={null}
                  onCalendarChange={(date: any) => {
                    setDisplayDate(date);
                    if (date) {
                      selectedDate.current = [
                        date[0]?.toDate().toLocaleDateString("en-CA"),
                        date[1]?.toDate().toLocaleDateString("en-CA"),
                      ];

                      // setSelectedDate((prev: any) => {
                      //   return [
                      //     date[0]?.toDate().toLocaleDateString("en-CA"),
                      //     date[1]?.toDate().toLocaleDateString("en-CA"),
                      //   ];
                      // });
                    } else {
                      selectedDate.current = null;
                    }
                  }}
                  // value={emptyDateRange ?? null}
                  format={"DD-MM-YYYY"}
                  open={openDatePicker}
                  value={displayDate}
                  renderExtraFooter={() => (
                    <>
                      <div className="action-btns">
                        <button
                          className="cancel-date-btn"
                          onClick={handleCancel}
                        >
                          Cancel
                        </button>
                        <button
                          className="set-date-btn"
                          onClick={() => {
                            if (!selectedDate.current) {
                              message.error("Please select a date range");
                              return;
                            }
                            if (
                              selectedDate.current[0] > selectedDate.current[1]
                            ) {
                              message.error(
                                "Start date cannot be greater than end date"
                              );
                              return;
                            }

                            setCurrentChatHistory([]);
                            setCurrentPage(1);
                            fetchHistoryCount(
                              true,
                              1,
                              10,
                              selectedDate.current[0],
                              selectedDate.current[1]
                            );
                            setOpenDatePicker(false);
                          }}
                        >
                          Set Date
                        </button>
                      </div>
                    </>
                  )}
                />
              </ConfigProvider>
            </div>
          </div>
        </div>
      </div>
      {(chatHistoryList?.length !== 0 || chatHistoryClassifier === "whatsapp") && (
        <div
          className={`chatbot-history-parts ${sourcesModal ? "with-sources" : ""}`}
        >
          {/*------------------------------------------left-section----------------------------------------------*/}
          {chatHistoryClassifier === "normal" ? (
            <div
              className={`chatbot-history-details ${sourcesModal ? "with-sources" : ""}`}
            >
              {/*------------------------------------------chat-list-section----------------------------------------------*/}
              <div
                className="detail"
                style={{
                  height: botDetails?.leadSessionsEmail == "" ? "100%" : "87%",
                }}
              >
                {botDetails?.referedFrom == "leads" && (
                  <>
                    <p
                      className="first-message"
                      style={{
                        textTransform: "lowercase",
                        pointerEvents: "none",
                      }}
                    >
                      {botDetails?.leadSessionsEmail.toLowerCase()}
                    </p>
                  </>
                )}

                {chatHistoryList?.length > 0 && (
                  <>
                    {chatHistoryList
                      // ?.reverse()
                      ?.slice((currentPage - 1) * 25, currentPage * 25)
                      ?.map((data: any, index: any) => {
                        return (
                          <div
                            className={`first-message ${
                              activeCurrentChatHistory === `today${index}`
                                ? "active"
                                : ""
                            }`}
                            style={{
                              display:
                                botDetails?.referedFrom == "leads" ? "flex" : "",
                              justifyContent:
                                botDetails?.referedFrom == "leads"
                                  ? "space-between"
                                  : "",
                              flexDirection:
                                botDetails?.referedFrom == "leads"
                                  ? "row-reverse"
                                  : "column",
                            }}
                            key={index}
                            onClick={() => {
                              setIsChatClicked(true);
                              setCurrentChatHistory(data[1]?.messages);
                              setDisplayEmail(data[1]?.email);
                              setActiveCurrentChatHistory("today" + index);
                              setSelectedSources([]);
                              setSourcesContainerTitle("sources");
                              setSourcesModal(false);
                            }}
                          >
                            <div
                              className="time"
                              style={{
                                padding: 0,
                                fontSize: "14px",
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    botDetails?.referedFrom == "leads"
                                      ? "none"
                                      : "block",
                                }}
                              >
                                {data[1]?.email ? (
                                  <span
                                    style={{
                                      textTransform:
                                        data[1].email == "Anonymous"
                                          ? "capitalize"
                                          : "lowercase",
                                    }}
                                  >
                                    {data[1]?.email}
                                  </span>
                                ) : (
                                  "Anonymous"
                                )}
                              </div>

                              <div
                                style={{
                                  flex:
                                    botDetails?.referedFrom == "leads"
                                      ? 1
                                      : "none",
                                  textAlign: "end",
                                  textWrap: "nowrap",
                                }}
                              >
                                {getTimeAgo(data[1].sessionEndDate)}
                              </div>
                            </div>

                            <div
                              style={{
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                // width: "250px",
                                textWrap: "nowrap",
                                // flex: botDetails?.referedFrom == "leads" ? 1 : 0,
                              }}
                            >
                              {
                                data[1]?.messages[
                                  data[1]?.initialMessageLength
                                    ? data[1]?.initialMessageLength
                                    : 1
                                ]?.content
                              }
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}

                {botDetails?.referedFrom == "leads" && (
                  <>
                    <p
                      className="history-link"
                      onClick={() => {
                        /// reset to the conversation history
                        botContext?.handleChange("leadSessionsEmail")("");
                        botContext?.handleChange("referedFrom")("");
                      }}
                    >
                      See all converstion history
                    </p>
                  </>
                )}
              </div>

              {chatHistoryList?.length > 0 && (
                <Pagination
                  defaultCurrent={1}
                  current={currentPage}
                  total={chatHistoryList.length}
                  onChange={(page) => {
                    handlePageChange(page);
                  }}
                  showSizeChanger={false}
                  pageSize={25}
                />
              )}
            </div>
          ) : (
            // WhatsApp History View
            <div
              className={`whatsapp-history-details ${sourcesModal ? "with-sources" : ""}`}
            >
              {/* Search Bar */}
              <div className="whatsapp-search-container">
                <input
                  type="text"
                  placeholder="Search phone number"
                  value={whatsappSearchQuery}
                  onChange={(e) => setWhatsappSearchQuery(e.target.value)}
                  className="whatsapp-search-input"
                />
              </div>

              {/* WhatsApp Chat List */}
              <div className="whatsapp-chat-list">
                {whatsappChats.length === 0 ? (
                  <div className="loading">
                    {isWhatsappConnected ? (
                      <>
                        📭 No chats available
                        <br />
                        <small>Waiting for messages...</small>
                      </>
                    ) : (
                      <>
                        🔌 Connecting to server...
                        <br />
                        <small>Please wait...</small>
                      </>
                    )}
                  </div>
                ) : (
                  whatsappChats
                    .filter((chat: any) =>
                      chat.phoneNumber
                        .toLowerCase()
                        .includes(whatsappSearchQuery.toLowerCase())
                    )
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.lastUpdate).getTime() -
                        new Date(a.lastUpdate).getTime()
                    )
                    .slice(
                      (whatsappCurrentPage - 1) * 10,
                      whatsappCurrentPage * 10
                    )
                    .map((chat: any, index: number) => {
                      const initials = getContactInitials(chat.phoneNumber);
                      const displayName = formatPhoneDisplay(chat.phoneNumber);
                      const lastMessageText = getLastMessagePreview(chat);
                      const isActive =
                        selectedWhatsappChat?.phoneNumber === chat.phoneNumber;

                      return (
                        <div
                          key={chat.phoneNumber}
                          className={`whatsapp-chat-item ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() => {
                            setIsChatClicked(true);
                            setSelectedWhatsappChat(chat);
                            setDisplayEmail(chat.phoneNumber);
                            setSelectedSources([]);
                            setSourcesContainerTitle("sources");
                            setSourcesModal(false);
                          }}
                        >
                          {/* Avatar Circle */}
                          <div
                            className="whatsapp-avatar"
                            style={{
                              backgroundColor: `hsl(${
                                (parseInt(initials) * 137.5) % 360
                              }, 70%, 60%)`,
                            }}
                          >
                            {initials}
                          </div>

                          {/* Chat Info */}
                          <div className="whatsapp-chat-info">
                            <div className="whatsapp-chat-header">
                              <span className="whatsapp-phone">
                                {displayName}
                              </span>
                              <span className="whatsapp-time">
                                {formatContactTime(chat.lastUpdate)}
                              </span>
                            </div>
                            <div className="whatsapp-chat-footer">
                              <span className="whatsapp-message">
                                {lastMessageText}
                              </span>
                              {chat.unreadCount > 0 && (
                                <span className="whatsapp-unread-badge">
                                  {chat.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <div className="whatsapp-toggle">
                            <label className="toggle-switch">
                              <input
                                type="checkbox"
                                checked={chat.autoReply !== false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleAutoReply(chat.phoneNumber);
                                }}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Pagination */}
              {whatsappChats.length > 10 && (
                <Pagination
                  defaultCurrent={1}
                  current={whatsappCurrentPage}
                  total={whatsappChats.length}
                  onChange={(page) => {
                    setWhatsappCurrentPage(page);
                  }}
                  showSizeChanger={false}
                  pageSize={10}
                />
              )}
            </div>
          )}
          {/* this is used for printing the chats initially it will be hidden but on print it will be visible*/}
          <PrintingChats
            ref={tempRef}
            messages={currentChatHistory}
            // messagesTime={messagesTime}
          />
          {/*------------------------------------------right-section----------------------------------------------*/}

          {/* mobile scrim for message panel (close on tap) */}
          {isMobileDevice && chatClicked && (
            <div
              className="message-scrim"
              onClick={() => setIsChatClicked(false)}
            />
          )}

          <div
            className={`message-section-wrapper ${sourcesModal ? "with-sources" : ""} ${
              isMobileDevice && chatClicked ? "mobile-panel" : ""
            }`}
            style={{
              // show on desktop or when a chat is opened on mobile
              display: !isMobileDevice
                ? window.innerWidth > 767
                  ? "block"
                  : "none"
                : chatClicked
                ? "block"
                : "none",
            }}
          >
            <div className="messages-section">
              <div
                className="header"
                style={{
                  visibility:
                    currentChatHistory?.length != 0 || selectedWhatsappChat ? "visible" : "hidden",
                }}
              >
                <p className="header-email">
                  {chatHistoryClassifier === "whatsapp" && selectedWhatsappChat
                    ? formatPhoneDisplay(selectedWhatsappChat.phoneNumber)
                    : displayEmail}
                </p>
                <div className="action-btns">
                  <ReactToPrint
                    trigger={() => {
                      return (
                        <button className="export-button">
                          <Image src={exportBtn} alt="export-btn" />
                        </button>
                      );
                    }}
                    content={() => tempRef.current}
                  />
                  {window.innerWidth < 768 && (
                    <Image
                      src={closeImage}
                      alt="close-icon"
                      onClick={() => setIsChatClicked(false)}
                    />
                  )}
                </div>
              </div>
              <hr
                style={{
                  visibility:
                    currentChatHistory?.length != 0 || selectedWhatsappChat ? "visible" : "hidden",
                }}
              />

              <div 
                className="history-conversation-container"
                ref={messagesContainerRef}
              >
                {chatHistoryClassifier === "whatsapp" && selectedWhatsappChat ? (
                  // WhatsApp Message Display
                  (() => {
                    const messagesByDate = groupMessagesByDate(
                      selectedWhatsappChat.allMessages || []
                    );
                    const sortedDates = Object.keys(messagesByDate).sort();

                    return sortedDates.map((dateKey) => (
                      <React.Fragment key={dateKey}>
                        {/* Date Separator */}
                        <div className="whatsapp-date-separator">
                          <span className="date-label">
                            {formatDateForDisplay(dateKey)}
                          </span>
                        </div>

                        {/* Messages for this date */}
                        {messagesByDate[dateKey].map(
                          (message: any, index: number) => {
                            const isFromUser = message.isFromUser;
                            const isFromBot = message.isFromBot;
                            const deliveryStatus = message.deliveryStatus;

                            return (
                              <div
                                key={`${dateKey}-${index}`}
                                className={
                                  isFromUser
                                    ? "user-message-container"
                                    : "assistant-message-container"
                                }
                              >
                                <div
                                  className={
                                    isFromUser
                                      ? "user-message"
                                      : "assistant-message"
                                  }
                                  style={{
                                    ...(isFromUser
                                      ? {
                                          backgroundColor:
                                            botSettings?.userMessageColor ||
                                            "#d9fdd3",
                                        }
                                      : {}),
                                  }}
                                >
                                  {isFromBot ? (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: message.content,
                                      }}
                                    />
                                  ) : (
                                    <div>{message.content}</div>
                                  )}
                                </div>
                                <div className="time" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>{formatMessageTime(message.timestamp)}</span>
                                  {/* Show delivery status only for bot messages (sent by us) */}
                                  {isFromBot && message.clientMessageId && deliveryStatus && (
                                    <span 
                                      className={`whatsapp-delivery-status ${deliveryStatus}`}
                                      title={deliveryStatus}
                                    >
                                      {deliveryStatus === "pending" && "🕐"}
                                      {deliveryStatus === "sent" && "✓"}
                                      {deliveryStatus === "failed" && "❌"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </React.Fragment>
                    ));
                  })()
                ) : (
                  // Normal Chat Message Display
                  currentChatHistory.map((message: any, index: any) => {
                    if (message.role == "assistant")
                      return (
                        <React.Fragment key={index}>
                          <div
                            className="assistant-message-container"
                            style={{
                              marginTop:
                                `${message.messageType}` === "initial"
                                  ? "10px"
                                  : "0",
                            }}
                          >
                            <div
                              className="assistant-message"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: message.content,
                              }}
                            ></div>
                            {/* <div className="time">{message?.messageTime}</div> */}
                            {message.messageType !== "initial" && (
                              <div className="time">{message?.messageTime}</div>
                            )}

                            {(currentChatHistory[index + 1] === undefined ||
                              currentChatHistory[index + 1].role == "user") && (
                              <div className="like-dislike-container">
                                <Image
                                  src={likeIcon}
                                  alt="like-icon"
                                  onClick={() => openChatbotModal(index, "like")}
                                />
                                <Image
                                  src={dislikeIcon}
                                  alt="dislike-icon"
                                  onClick={() =>
                                    openChatbotModal(index, "dislike")
                                  }
                                />
                                {/* Only show sources button if sources are available */}
                                {message.sources &&
                                  message.sources?.length > 0 && (
                                    <button
                                      className="sources-btn"
                                      onClick={() =>
                                        handleShowSources(message.sources)
                                      }
                                      aria-label="Sources"
                                    >
                                      <Image
                                        src={SourcesDots}
                                        alt="sources-icon"
                                        width={16}
                                        height={16}
                                      />
                                      Sources
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                          <ChatbotNameModal
                            open={open}
                            setOpen={setOpen}
                            chatbotText={feedbackText}
                            setChatbotText={setfeedbackText}
                            handleOk={handleOk}
                            forWhat="feedback"
                          />
                        </React.Fragment>
                      );
                    else
                      return (
                        <div className="user-message-container" key={index}>
                          <div
                            className="user-message"
                            style={{
                              backgroundColor: botSettings?.userMessageColor,
                            }}
                          >
                            {message.content}
                          </div>
                          <div className="time">{message?.messageTime}</div>
                        </div>
                      );
                  })
                )}
              </div>

              {/* WhatsApp Chat Input - Only show for WhatsApp chats */}
              {chatHistoryClassifier === "whatsapp" && selectedWhatsappChat && (
                <div className="whatsapp-chat-input">
                  <textarea
                    className="whatsapp-message-input"
                    placeholder={
                      selectedWhatsappChat.autoReply
                        ? "Auto-reply enabled — disable to send manual messages"
                        : "Type a message..."
                    }
                    value={outgoingMessage}
                    onChange={(e) => setOutgoingMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendWhatsappMessage();
                      }
                    }}
                    disabled={selectedWhatsappChat.autoReply || !isWhatsappConnected}
                    rows={1}
                    style={{
                      resize: "none",
                      minHeight: "40px",
                      maxHeight: "120px",
                    }}
                  />
                  <button
                    className="whatsapp-send-btn"
                    onClick={sendWhatsappMessage}
                    disabled={selectedWhatsappChat.autoReply || !isWhatsappConnected || !outgoingMessage.trim()}
                    title={
                      selectedWhatsappChat.autoReply
                        ? "Disable auto-reply to send messages"
                        : !isWhatsappConnected
                        ? "Not connected"
                        : "Send message"
                    }
                  >
                    Send
                  </button>
                </div>
              )}

              <div
                className="footer"
                style={{
                  visibility:
                    currentChatHistory?.length != 0 || selectedWhatsappChat ? "visible" : "hidden",
                }}
              >
                <p>Powered by Torri.AI</p>
              </div>
            </div>
          </div>

          {/* sources div */}
          {sourcesModal && selectedSources.length > 0 && (
            <>
              {isMobileDevice && (
                <div
                  className="sources-scrim"
                  onClick={() => setSourcesModal(false)}
                />
              )}
              <div
                className={`sources-container ${sourcesModal ? "with-sources" : ""} ${
                  isMobileDevice ? "mobile-panel" : ""
                }`}
              >
                <div className="sources-header">
                  <h3
                    title={
                      /^\s*<\s*/.test(String(sourcesContainerTitle))
                        ? "Back"
                        : undefined
                    }
                  >
                    {sourcesContainerTitle.toLowerCase() !== "sources" && (
                      <Image
                        src={BackIcon}
                        alt="back-icon"
                        onClick={() => setSourcesContainerTitle("sources")}
                        style={{
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      />
                    )}
                    <Typography.Text
                      strong
                      ellipsis
                      title={sourcesContainerTitle}
                      style={{ maxWidth: 150 }}
                    >
                      {sourcesContainerTitle}
                    </Typography.Text>
                  </h3>

                  <button
                    onClick={() => setSourcesModal(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#666",
                      fontSize: "18px",
                      cursor: "pointer",
                      padding: "5px",
                      justifyContent: "center",
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <Image src={CloseBtn} alt="close-icon" />
                  </button>
                </div>
                <RelevanceBar />
                {/* <Sources data={selectedSources} />
                 */}
                {/* compute filtered sources based on active relevance */}
                {/** If activeRelevance is null, show all sources */}
                <HighlightedInfoPage
                  data={
                    activeRelevance === "All"
                      ? selectedSources
                      : selectedSources.filter((src) => {
                          const s = extractScoreFromSource(src);
                          if (s == null) return false;
                          const label = getRelevanceLabelForScore(s);
                          return activeRelevance === label;
                        })
                  }
                  chatbotId={chatbotId}
                  sourcesContainerTitle={sourcesContainerTitle}
                  setSourcesContainerTitle={setSourcesContainerTitle}
                />
              </div>
            </>
          )}
        </div>
      )}
      {chatHistoryList?.length == 0 && chatHistoryClassifier === "normal" && (
        <div className="empty-history">
          <Image src={noHistory} alt="no-data"></Image>
          <p className="no-history-text">No chat history found</p>
        </div>
      )}
    </div>
  );
}

export default History;
