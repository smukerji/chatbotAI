import React, { useEffect, useState } from "react";
import { TableProps, DatePicker, ConfigProvider } from "antd";
import { Form, Input, InputNumber, Popconfirm, Table, Typography } from "antd";
import "./leads.scss";
import ExportBtn from "../../../../../../assets/svg/ExportBtn";
import Image from "next/image";
import NoDataSvg from "../../../../../../../public/svgs/no-data-image.svg";

interface Item {
  key: string;
  name: string;
  age: number;
  address: string;
}

const { RangePicker } = DatePicker;

const Leads = ({ chatbotId }: any) => {
  /// set the total number of lead pages
  const [totalPages, setTotalPages] = useState(0);
  /// leads data
  const [leads, setLeads] = useState([]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      width: "20%",
    },
    {
      title: "Name",
      dataIndex: "name",
      width: "20%",
    },
    {
      title: "Email",
      dataIndex: "email",
      width: "20%",
    },
    {
      title: "Phone number",
      dataIndex: "number",
      width: "20%",
    },
    // {
    //   title: "",
    //   dataIndex: "address",
    //   width: "20%",
    // },
    {
      title: "",
      dataIndex: "sessionId",
      render: (_: any, record: Item) => {
        return (
          <Typography.Link
            // disabled={editingKey !== ""}
            onClick={() => alert(JSON.stringify(record))}
          >
            Detail &nbsp;&nbsp;&gt;
          </Typography.Link>
        );
        // const editable = isEditing(record);
        // return editable ? (
        //   <span>
        //     <Typography.Link
        //       onClick={() => save(record.key)}
        //       style={{ marginRight: 8 }}
        //     >
        //       Save
        //     </Typography.Link>
        //     <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
        //       <a>Cancel</a>
        //     </Popconfirm>
        //   </span>
        // ) : (
        //   <Typography.Link
        //     disabled={editingKey !== ""}
        //     onClick={() => edit(record)}
        //   >
        //     Edit
        //   </Typography.Link>
        // );
      },
    },
  ];

  const mergedColumns: TableProps["columns"] = columns.map((col) => {
    // if (!col.editable) {
    //   return col;
    // }
    return {
      ...col,
    };
  });

  /// update the leads data
  const fetchLeadsCount = async (count = false, page = 1, pageSize = 10) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/lead?count=${count}&chatbotId=${chatbotId}&page=${page}&pageSize=${pageSize}`
    );
    const content = await response.json();
    setLeads(content?.leads);

    /// used only to get the total number of pages when page loads
    if (count) {
      setTotalPages(content?.leadsCount);
    }
  };

  useEffect(() => {
    /// set the pages and leads initial data
    fetchLeadsCount(true);
  }, []);

  const customLocale = {
    /// no data component
    emptyText: (
      <div>
        <Image src={NoDataSvg} alt="no-data"></Image>

        <h2>No customer found</h2>
      </div>
    ),
  };

  return (
    <div className="leads-container">
      <div className="action-container">
        <ConfigProvider
          theme={{
            components: {
              DatePicker: {
                cellActiveWithRangeBg: "#ECF0FE",
                cellHoverBg: "#ECF0FE",
                colorPrimary: "#4D72F5",
                colorFillSecondary: "red",
              },
            },
          }}
        >
          <RangePicker onChange={(e) => alert(JSON.stringify(e))} />
        </ConfigProvider>
        <button className="export-btn">
          <ExportBtn /> Export
        </button>
      </div>
      <Table
        // components={{
        //   body: {
        //     cell: EditableCell,
        //   },
        // }}
        bordered
        dataSource={leads}
        locale={customLocale}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: (page) => {
            fetchLeadsCount(false, page);
          },
          position: ["bottomLeft"],
          showSizeChanger: false,
          total: totalPages,
        }}
      />
    </div>
  );
};

export default Leads;
