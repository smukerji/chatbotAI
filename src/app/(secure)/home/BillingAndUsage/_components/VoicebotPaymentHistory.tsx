import { Table, TableProps } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

interface DataType {
  key: React.Key;
  paymentId: number;
  price: number;
  status: string;
  date: string;
  children?: DataType[];
}

// Function to format date
function formatDate(timestamp: number) {
  const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function VoicebotPaymentHistory() {
  const [cookies, setCookie] = useCookies(["userId"]);
  const [dataSource, setDataSource] = useState([]);

  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "Payment Invoice",
      dataIndex: "id",
      key: "paymentId",
      sorter: (a: any, b: any) => {
        const paymentA = a.id || ""; // Fallback to an empty string if undefined
        const paymentB = b.id || ""; // Fallback to an empty string if undefined
        return paymentA.localeCompare(paymentB);
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: (a: any, b: any) => a.amount - b.amount,
      render: (text: number) => <span>{(text / 100).toFixed(2)}</span>,
    },
    {
      title: "Date",
      dataIndex: "created",
      key: "created",
      sorter: (a: any, b: any) => {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        return dateA.getTime() - dateB.getTime(); // Compare based on timestamps
      },
      render: (date: number) => formatDate(date),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
      render: (status: string) => (
        <span style={{ color: status === "succeeded" ? "#2e58ea" : "red" }}>
          {status.toUpperCase()}
        </span>
      ),
    },
  ];

  const onChange: TableProps<DataType>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra
  ) => {
    // console.log("params", pagination, filters, sorter, extra);
  };

  const fetchPriceHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}voicebot/dashboard/api/stripe-payment-gateway/plan-history`,
        {
          u_id: cookies.userId,
        }
      );

      setDataSource(response.data.paymentDetails);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, []);

  //   useEffect(() => {
  //     if (dataSource?.length > 0) {
  //       const data: any = transformDataSource(dataSource);
  //       setTransformedDataSource(data);
  //     }
  //   }, [dataSource]);

  return (
    <>
      <Table
        className="payment-table"
        columns={columns}
        dataSource={dataSource}
        scroll={{
          x: 767,
        }}
        onChange={onChange}
        loading={loading}
      />
    </>
  );
}

export default VoicebotPaymentHistory;
