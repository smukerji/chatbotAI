import React, { useContext, useEffect, useRef, useState } from "react";
import { TableProps, DatePicker, ConfigProvider, message } from "antd";
import { Table, Typography } from "antd";
import "./leads.scss";
import ExportBtn from "../../../../../../assets/svg/ExportBtn";
import Image from "next/image";
import NoDataSvg from "../../../../../../../public/svgs/no-data-image.svg";
import { alt } from "joi";
import moment from "moment";
import e from "express";
// import { json2csv } from "json-2-csv";
import json2csv, { Parser } from "json2csv";
import { CreateBotContext } from "@/app/_helpers/client/Context/CreateBotContext";

interface Item {
  key: string;
  name: string;
  age: number;
  address: string;
  email: string;
}

const { RangePicker } = DatePicker;

const Leads = ({ chatbotId }: any) => {
  /// set the total number of lead pages
  const [totalPages, setTotalPages] = useState(0);
  /// leads data
  const [leads, setLeads] = useState([]);
  const selectedDate: any = useRef(null);
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [leadsFilter, setLeadsFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [displayDate, setDisplayDate] = useState(null);

  /// get the bot context
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

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
      title: "Message Log",
      dataIndex: "sessions",
      render: (_: any, record: Item) => {
        return (
          <Typography.Link
            // disabled={editingKey !== ""}
            onClick={() => {
              if (record?.email == "N/A") {
                message.error("Email not found to retrive leads");
              } else {
                botContext?.handleChange("leadSessionsEmail")(record?.email);
                botContext?.handleChange("editChatbot")("history");
                botContext?.handleChange("referedFrom")("leads");
              }
            }}
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
    return {
      ...col,
    };
  });

  /// update the leads data
  const fetchLeadsCount = async (
    count = false,
    page = 1,
    pageSize = 10,
    startDate = null,
    endDate = null
  ) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/lead?count=${count}&chatbotId=${chatbotId}&page=${page}&pageSize=${pageSize}&startDate=${startDate}&endDate=${endDate}`
    );
    const content = await response.json();
    setLeads(content?.leads);

    /// used only to get the total number of pages when page loads
    if (count) {
      setTotalPages(content?.leadsCount);
    }
  };

  // Function for exporting all the leads

  async function exportLeads() {
    const today: any = new Date().toLocaleDateString("en-CA");
    const last7Days: any = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    let refinedFormatLast7Days = last7Days.toLocaleDateString("en-CA");

    const lastMonth: any = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    let refinedFormatLastMonth = lastMonth.toLocaleDateString("en-CA");

    const startDate =
      leadsFilter === "today"
        ? today
        : leadsFilter === "last-7-day"
        ? refinedFormatLast7Days
        : leadsFilter === "last-month"
        ? refinedFormatLastMonth
        : leadsFilter === "custom-date"
        ? selectedDate.current[0]
        : null;

    const endDate =
      leadsFilter === "custom-date"
        ? selectedDate.current[1]
        : leadsFilter === "today" ||
          leadsFilter === "last-7-day" ||
          leadsFilter === "last-month"
        ? today
        : null;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/lead/export?chatbotId=${chatbotId}&startDate=${startDate}&endDate=${endDate}`
      );
      const content = await response.json();

      if (content.length === 0) {
        message.error("No leads to export");
        return;
      }

      // Ensure numbers are treated as text in CSV
      const modifiedContent = content.map((entry: any) => ({
        ...entry,
        Number: ` ${entry.Number}`,
      }));
      const json2csvParser = new Parser();
      const csvString = await json2csvParser.parse(modifiedContent);

      downloadCsv(csvString, "leads.csv");
    } catch (error) {
      console.error("Error exporting leads:", error);
    }
  }

  // function to download the csv

  function downloadCsv(csvString: any, filename: string) {
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const csvFile = document.createElement("a");
    csvFile.setAttribute("hidden", "");
    csvFile.setAttribute("href", url);
    csvFile.setAttribute("download", filename);
    document.body.appendChild(csvFile);
    csvFile.click();
    document.body.removeChild(csvFile);
  }

  useEffect(() => {
    /// set the pages and leads initial data
    fetchLeadsCount(true);
    botContext?.handleChange("leadSessionsEmail")("");
    botContext?.handleChange("referedFrom")("");
  }, []);

  /// when no customers are found display this component
  const customLocale = {
    /// no data component
    emptyText: (
      <div>
        <Image src={NoDataSvg} alt="no-data"></Image>
        <h2>No customer found</h2>
      </div>
    ),
  };

  const handleCancel = () => {
    selectedDate.current = null;
    setOpenDatePicker(false);
  };

  console.log("leads filterre", leadsFilter);

  return (
    <div className="leads-container">
      <div className="action-container">
        <div className="date-picker-container">
          {/* custom date buttons */}
          <div className="interval-btns">
            <button
              className={`interval-btn ${leadsFilter === "today" && "active"}`}
              onClick={() => {
                const today: any = new Date().toLocaleDateString("en-CA");
                fetchLeadsCount(true, 1, 10, today, today);
                setCurrentPage(1);
                setLeadsFilter("today");
                setOpenDatePicker(false);
                setDisplayDate(null);
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
                fetchLeadsCount(true, 1, 10, refinedFormatLast7Days, today);
                setCurrentPage(1);
                setLeadsFilter("last-7-day");
                setOpenDatePicker(false);
                setDisplayDate(null);
              }}
            >
              Last 7 Days
            </button>
            <button
              className={`interval-btn ${
                leadsFilter === "last-month" && "active"
              }`}
              onClick={() => {
                const today: any = new Date().toLocaleDateString("en-CA");
                const lastMonth: any = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                let refinedFormatLastMonth =
                  lastMonth.toLocaleDateString("en-CA");
                fetchLeadsCount(true, 1, 10, refinedFormatLastMonth, today);
                setCurrentPage(1);
                setLeadsFilter("last-month");
                setOpenDatePicker(false);
                setDisplayDate(null);
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
                          setCurrentPage(1);
                          fetchLeadsCount(
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
        {/* <button className="export-btn" onClick={exportLeads}>
          <ExportBtn /> Export
        </button> */}
      </div>
      <Table
        scroll={{ x: 767 }}
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
          current: currentPage,
          onChange: (page) => {
            fetchLeadsCount(false, page);
            setCurrentPage(page);
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
