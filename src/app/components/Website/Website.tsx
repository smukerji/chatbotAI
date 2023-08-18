import React, { useState } from "react";
import "./website.css";
import { Input, Progress } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
const { Search } = Input;
function Website({
  updateCharCount,
  getCharCount,
  setLoadingPage,
  setCrawledList,
  crawledList,
}: any) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  /// list of crawled urls
  // const [crawledList, setCrawledList]: any = useState([]);

  /// deleting the link
  const deleteLink = (index: number) => {
    /// remove the selected item from array
    let updatedList = [...crawledList];
    let deletedItem: any = updatedList.splice(index, 1);
    /// update the count
    updateCharCount(getCharCount - deletedItem[0].size);
    /// update the list
    setCrawledList(updatedList);
  };
  /// menthod to handle the fetching
  const onFetch = async (value: string) => {
    let intervalId;
    try {
      /// start the progress bar
      let count = 0;
      setLoading(true);
      setLoadingPage(true);
      intervalId = setInterval(() => {
        if (count != 100) setProgress(count++);
      }, 2000);
      /// send the request
      // const response = await fetch(
      //   `${process.env.NEXT_PUBLIC_WEBSITE_URL}api?source=website&sourceURL=${value}`,
      //   {
      //     method: "GET",
      //   }
      // );
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${process.env.NEXT_PUBLIC_AUTHORIZATION}`,
          cache: "no-store",
        },
        next: { revalidate: 0 },
      };

      const response = await fetch(
        `https://www.chatbase.co/api/v1/fetch-links?sourceURL=${value}`,
        options
      );
      const data = await response.json();
      console.log("Fetched links", data);

      /// if there is any error show error
      if (data.error) return alert(data.error);

      // Calculate total character count
      let totalCharCount = 0;
      data?.fetchedLinks.forEach((item: any) => {
        totalCharCount += item.size;
      });

      // Update charCount in the parent component
      updateCharCount(getCharCount + totalCharCount);

      /// set the fecthed links
      setCrawledList([...crawledList, ...data.fetchedLinks]);
      setProgress(100);
    } catch (error) {
      setProgress(0);
      console.log("Error while fetching ", error);
      alert(`Error while fetching ${error}`);
    } finally {
      setLoading(false);
      setLoadingPage(false);
      clearInterval(intervalId);
    }
  };

  return (
    <div className="website-source-container">
      <Search
        placeholder="https://www.example.com"
        enterButton="Fetch Links"
        size="large"
        onSearch={onFetch}
        disabled={loading}
      />
      <Progress
        status="active"
        percent={progress}
        strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
      />
      <span style={{ marginTop: "15px" }}>
        This will crawl all the links starting with the URL (not including files
        on the website).
      </span>
      <span style={{ marginTop: "50px" }} className="website-text">
        Included links
      </span>
      {crawledList?.map((item: any, index: number) => {
        return (
          <React.Fragment key={index}>
            <div className="fetched-links">
              <div className="link">
                <Input value={item.url} /> <span>{item.size}</span>{" "}
              </div>
              <DeleteOutlined
                style={{ color: "red", marginLeft: "5px" }}
                value={index}
                onClick={() => deleteLink(index)}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Website;

export const revalidate = 10;
