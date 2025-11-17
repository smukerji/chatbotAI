"use client";
import React, { useState, useContext } from "react";
import { Table, Button, Input, message } from "antd";
import { SearchOutlined, PlayCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import "./evals.scss";
import { CreateVoiceBotContext } from "@/app/_helpers/client/Context/VoiceBotContextApi";
import { redirect, useRouter } from "next/navigation";

// Table item interface
interface EvalTableItem {
  key: string;
  name: string;
  description: string;
  evalTurns: number;
  totalTurns: number;
  createdAt: string;
}

// Static dummy data
const DUMMY_EVALS: EvalTableItem[] = [
  {
    key: "1",
    name: "Welcome",
    description: "No description",
    evalTurns: 1,
    totalTurns: 1,
    createdAt: "Nov 14, 2025 1:42 AM",
  },
  {
    key: "2",
    name: "Check out guidance",
    description: "No description",
    evalTurns: 1,
    totalTurns: 1,
    createdAt: "Nov 14, 2025 1:42 AM",
  },
  {
    key: "3",
    name: "Welcome",
    description: "No description",
    evalTurns: 1,
    totalTurns: 1,
    createdAt: "Nov 16, 2025 3:30 AM",
  },
  // Add more rows as needed for testing
];

// Table columns
const columns: ColumnsType<EvalTableItem> = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
  },
  {
    title: "Eval Turns",
    dataIndex: "evalTurns",
    key: "evalTurns",
    align: "center",
    sorter: (a, b) => a.evalTurns - b.evalTurns,
  },
  {
    title: "Total Turns",
    dataIndex: "totalTurns",
    key: "totalTurns",
    align: "center",
    sorter: (a, b) => a.totalTurns - b.totalTurns,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  },
  {
    title: "Actions",
    key: "actions",
    render: (_: any, record: EvalTableItem) => (
      <Button
        type="link"
        className="test-button"
        icon={<PlayCircleOutlined />}
        onClick={() => {
          console.log("Test button clicked for eval:", record);
          message.info(`Test clicked for ${record.name}`);
        }}
      >
        Test
      </Button>
    ),
  },
];

export default function Evals() {
  const router = useRouter();
  const contextData = useContext<any>(CreateVoiceBotContext); // Context for future use!
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("created");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Use static test data only
  const [evals] = useState<EvalTableItem[]>(DUMMY_EVALS);

  const filteredData = evals.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => {
      console.log("Row selection changed:", keys);
      setSelectedRowKeys(keys);
    },
  };

  // Log active tab change (for testing tab switch logic)
  React.useEffect(() => {
    console.log("Active tab set to:", activeTab);
  }, [activeTab]);

  // Log filtered data on search
  React.useEffect(() => {
    console.log("Filtered data after search:", filteredData);
  }, [search, evals]);

  return (
    <div className="evals-content">
      <div className="evals-header">
        <div className="toggle-switcher">
          <button
            className={`toggle-btn ${activeTab === "created" ? "active" : ""}`}
            onClick={() => setActiveTab("created")}
          >
            Created
          </button>
          <button
            className={`toggle-btn ${activeTab === "runs" ? "active" : ""}`}
            onClick={() => setActiveTab("runs")}
          >
            Runs
          </button>
        </div>

        <Input
          placeholder="Search evaluations by name or description"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="evals-search"
          allowClear
        />
        <Button
          type="primary"
          className="create-eval-btn"
          onClick={() => {
    router.push("voicebot/dashboard/api/create-evaluation"); // adjust path as per your folder structure
  }}
        >
          <span className="plus-icon">+</span> Create Evaluation
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 2,
          showSizeChanger: false,
          className: "evals-pagination",
        }}
        className="evals-table"
        locale={{
          emptyText: "No evaluations found for this assistant.",
        }}
      />
    </div>
  );
}
