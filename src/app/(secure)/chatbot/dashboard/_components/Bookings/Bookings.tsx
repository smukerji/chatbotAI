"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useCookies } from "react-cookie";
import { Table, Tag, Button, Select, Empty, Spin, Tooltip, message } from "antd";
import { ReloadOutlined, CalendarOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Option } = Select;

interface Booking {
  _id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  dateTime: string;
  timezone: string;
  notes: string | null;
  status: "confirmed" | "rescheduled" | "cancelled";
  createdAt: string;
}

interface BookingsProps {
  chatbotId: string;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "green",
  rescheduled: "blue",
  cancelled: "red",
};

export default function Bookings({ chatbotId }: BookingsProps) {
  const [cookies] = useCookies(["userId"]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchCalendarStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/status?chatbotId=${chatbotId}`
      );
      const data = await res.json();
      setCalendarConnected(data.connected);
    } catch {
      setCalendarConnected(false);
    }
  }, [chatbotId]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = statusFilter ? `&status=${statusFilter}` : "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/bookings?chatbotId=${chatbotId}&userId=${cookies.userId}${statusParam}`
      );
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err) {
      messageApi.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [chatbotId, cookies.userId, statusFilter, messageApi]);

  useEffect(() => {
    fetchCalendarStatus();
    fetchBookings();

    // Check for gcalSuccess in URL (redirect from OAuth callback)
    const params = new URLSearchParams(window.location.search);
    if (params.get("gcalSuccess")) {
      messageApi.success("Google Calendar connected successfully!");
      // Clean the URL param
      params.delete("gcalSuccess");
      window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
      fetchCalendarStatus();
    }
    if (params.get("gcalError")) {
      messageApi.error(`Google Calendar connection failed: ${params.get("gcalError")}`);
      params.delete("gcalError");
      window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
    }
  }, [fetchCalendarStatus, fetchBookings]);

  const handleConnectCalendar = () => {
    setConnectingCalendar(true);
    window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/auth?chatbotId=${chatbotId}&userId=${cookies.userId}`;
  };

  const handleDisconnectCalendar = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/integrations/google-calendar/status?chatbotId=${chatbotId}`,
        { method: "DELETE" }
      );
      setCalendarConnected(false);
      messageApi.success("Google Calendar disconnected.");
    } catch {
      messageApi.error("Failed to disconnect Google Calendar.");
    }
  };

  const columns: ColumnsType<Booking> = [
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
      render: (id) => <code style={{ fontSize: 12 }}>{id}</code>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.customerName}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{r.customerEmail}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{r.customerPhone}</div>
        </div>
      ),
    },
    {
      title: "Service",
      dataIndex: "serviceType",
      key: "serviceType",
    },
    {
      title: "Date & Time",
      key: "dateTime",
      render: (_, r) => (
        <div>
          <div>{new Date(r.dateTime).toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{r.timezone}</div>
        </div>
      ),
      sorter: (a, b) =>
        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (n) => n ?? <span style={{ color: "#ccc" }}>—</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={STATUS_COLORS[status] ?? "default"}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => new Date(d).toLocaleDateString(),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1100 }}>
      {contextHolder}

      {/* ── Google Calendar connection banner ── */}
      <div
        style={{
          background: calendarConnected ? "#f6ffed" : "#fffbe6",
          border: `1px solid ${calendarConnected ? "#b7eb8f" : "#ffe58f"}`,
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalendarOutlined
            style={{
              fontSize: 20,
              color: calendarConnected ? "#52c41a" : "#faad14",
            }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>
              {calendarConnected
                ? "Google Calendar connected"
                : "Google Calendar not connected"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {calendarConnected
                ? "Bookings are automatically synced to your Google Calendar."
                : "Connect Google Calendar to sync bookings and check availability."}
            </div>
          </div>
        </div>
        {calendarConnected ? (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDisconnectCalendar}
            size="small"
          >
            Disconnect
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            loading={connectingCalendar}
            onClick={handleConnectCalendar}
          >
            Connect Google Calendar
          </Button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>Bookings</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 180 }}
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val ?? "")}
          >
            <Option value="confirmed">Confirmed</Option>
            <Option value="rescheduled">Rescheduled</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Tooltip title="Refresh">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBookings}
              loading={loading}
            />
          </Tooltip>
        </div>
      </div>

      {/* ── Table ── */}
      <Spin spinning={loading}>
        {bookings.length === 0 && !loading ? (
          <Empty
            description="No bookings yet. The booking agent will create entries here."
            style={{ marginTop: 60 }}
          />
        ) : (
          <Table
            dataSource={bookings}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
      </Spin>
    </div>
  );
}
