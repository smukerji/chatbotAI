import { Table, TableProps } from "antd";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import ArrowDownBlack from "../../../../../../public/svgs/arrow-down-bold.svg";
import axios from "axios";
import { useCookies } from "react-cookie";
import { transformDataSource } from "../utils/transformedDataSource";

interface DataType {
  key: React.Key;
  paymentId: number;
  price: number;
  status: string;
  date: string;
  children?: DataType[];
}

function PaymentTable() {
  const [cookies, setCookie] = useCookies(["userId"]);
  const [dataSource, setDataSource] = useState([]);
  const [tranformedDataSource, setTransformedDataSource] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "Payment Invoice",
      dataIndex: "paymentId",
      key: "paymentId",
      sorter: (a: any, b: any) => {
        const paymentA = a.paymentId || ""; // Fallback to an empty string if undefined
        const paymentB = b.paymentId || ""; // Fallback to an empty string if undefined
        return paymentA.localeCompare(paymentB);
      },
    },
    {
      title: "Amount",
      dataIndex: "price",
      key: "price",
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a: any, b: any) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime(); // Compare based on timestamps
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: (a: any, b: any) => a.status.localeCompare(b.status),
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
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/BillingAndUsage/api/payment-history`,
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

  useEffect(() => {
    if (dataSource.length > 0) {
      const data: any = transformDataSource(dataSource);
      setTransformedDataSource(data);
    }
  }, [dataSource]);

  return (
    <>
      <Table
        className="payment-table"
        dataSource={tranformedDataSource} // Use the transformed data
        columns={columns}
        expandable={{
          expandIcon: ({ expanded, onExpand, record }) => {
            // Check if the row has children
            if (!record.children || record.children.length === 0) {
              return (
                <Image
                  src="" // Change the icon based on expand state
                  alt=""
                  style={{
                    marginRight: "15px",
                  }}
                />
              ); // Do not render icon for rows without children
            }

            return (
              <Image
                src={ArrowDownBlack} // Change the icon based on expand state
                alt="expand/collapse"
                onClick={(e) => onExpand(record, e)} // Ensure the `onExpand` function is called on click
                style={{
                  cursor: "pointer",
                  marginRight: "10px",
                  marginBottom: "-6px",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)", // Rotate the icon
                  transition: "transform 0.3s ease", // Add smooth transition effect }} // Make the icon clickable
                }}
              />
            );
          },
        }}
        scroll={{
          x: 600,
        }}
        onChange={onChange}
        loading={loading}
      />
    </>
  );
}

export default PaymentTable;
