import React, { useContext, useState } from "react";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import { Progress, message } from "antd";
import Image from "next/image";
import "./website.scss";
import deleteIcon from "../../../../public/create-chatbot-svgs/delete-icon.svg";
import { UserDetailsContext } from "../../_helpers/client/Context/UserDetailsContext";

function Website({
  websiteCharCount,
  totalCharCount,
  isUpdateChatbot,
  chatbotId,
  userId,
}: any) {
  const [progress, setProgress] = useState(0);

  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  /// get the crawledlist & deleteCrawlList from context
  const crawledList = botDetails?.crawledList;
  const deleteCrawlList = botDetails?.deleteCrawlList;

  const isLoading = botDetails?.isLoading;

  /// deleting the link
  const deleteLink = (index: number) => {
    /// remove the selected item from array
    let updatedList = [...crawledList];
    let deletedItem: any = updatedList.splice(index, 1);

    /// add the link that need to be deleted while updating the chatbot
    if (isUpdateChatbot && deletedItem[0]?.dataID) {
      botContext?.handleChange("deleteCrawlList")([
        ...deleteCrawlList,
        ...deletedItem,
      ]);
    }

    /// update the count
    botContext?.handleChange("totalCharCount")(
      totalCharCount - deletedItem[0].charCount
    );
    botContext?.handleChange("websiteCharCount")(
      websiteCharCount - deletedItem[0].charCount
    );
    /// update the list
    botContext?.handleChange("crawledList")(updatedList);
  };

  /// menthod to handle the fetching
  const onFetch = async () => {
    /// get the link from context to fetch data
    const value: string = botDetails?.crawlLink;
    let intervalId;
    try {
      /// start the progress bar
      let count = 0;
      botContext?.handleChange("isLoading")(true);

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
        method: "POST",
        headers: {
          accept: "application/json",
          cache: "no-store",
        },
        body: JSON.stringify({
          sourceURL: value,
          chatbotId: chatbotId,
          userId: userId,
        }),
        next: { revalidate: 0 },
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}home/fetch-links/api`,
        options
      );
      const data = await response.json();
      if (data?.error) {
        message.warning(data.error);
        return;
      }

      /// if there is any error show error
      // if (data.error) return alert(data.error);

      // Calculate total character count
      let retotalCharCount = 0;

      data?.fetchedLinks?.forEach((item: any) => {
        retotalCharCount += parseInt(item.charCount);
      });

      // Update charCount in the parent component
      botContext?.handleChange("totalCharCount")(
        totalCharCount + retotalCharCount
      );
      botContext?.handleChange("websiteCharCount")(
        websiteCharCount + retotalCharCount
      );

      /// set the fecthed links
      botContext?.handleChange("crawledList")([
        ...crawledList,
        ...data.fetchedLinks,
      ]);
      setProgress(100);
    } catch (error) {
      setProgress(0);
      console.log("Error while fetching ", error);
      alert(`Error while fetching ${error}`);
    } finally {
      botContext?.handleChange("isLoading")(false);
      clearInterval(intervalId);
    }
  };

  const deleteAllLinks = () => {
    // console.log(botDetails);
    let totalLinksCharToDelete = 0;
    /// filter the links that need to be deleted from database
    const newDeleteCrawlLinks = crawledList?.filter(
      (link: any, index: number) => {
        totalLinksCharToDelete += link?.charCount;

        return link?.dataID != "" && link?.dataID != undefined;
      }
    );

    /// set the delete crawl list
    botContext?.handleChange("deleteCrawlList")([
      ...deleteCrawlList,
      ...newDeleteCrawlLinks,
    ]);

    /// update the char count
    botContext?.handleChange("totalCharCount")(
      totalCharCount - totalLinksCharToDelete
    );
    botContext?.handleChange("websiteCharCount")(
      websiteCharCount - totalLinksCharToDelete
    );

    /// update the list
    botContext?.handleChange("crawledList")([]);
  };

  return (
    <div className="website-source-container">
      {/* <Search
        placeholder="https://www.example.com"
        enterButton="Fetch Links"
        size="large"
        onSearch={onFetch}
        disabled={loading}
      /> */}
      <div className="input-container">
        <input
          type="text"
          className={`${isLoading ? "disabled" : ""}`}
          placeholder="https://example.com"
          onChange={(event) =>
            botContext?.handleChange("crawlLink")(event?.target.value)
          }
          disabled={isLoading}
          value={botDetails?.crawlLink}
        />
        <button
          type="button"
          className={`${isLoading ? "disabled" : ""}`}
          onClick={() => onFetch()}
          disabled={isLoading}
        >
          Fetch links
        </button>
      </div>
      <Progress
        status="active"
        percent={progress}
        strokeColor={{ "0%": "#335df3", "100%": "#335df3" }}
      />
      <span className="text-note">
        This will crawl all the links starting with the URL (not including files
        on the website).
        <span>
          {crawledList?.length}
          <span>/{userDetails?.plan?.websiteCrawlingLimit} links</span>
        </span>
      </span>
      <hr />
      {crawledList?.length > 0 && (
        <div className="website-text-container">
          <h2 className="website-text">Included links</h2>
          <span onClick={deleteAllLinks}>Delete all</span>
        </div>
      )}
      <div className="fetched-links-container">
        {crawledList?.map((item: any, index: number) => {
          return (
            <React.Fragment key={index}>
              <div className="fetched-links">
                <div className="link">
                  {/* <Input value={item.url} /> <span>{item.size}</span>{" "} */}
                  <input value={item.crawlLink} disabled />
                  <span>{item.charCount}</span>{" "}
                </div>
                <Image
                  //   style={{ color: "red", marginLeft: "5px" }}
                  //   value={index}
                  src={deleteIcon}
                  alt="delete-icon"
                  onClick={() => deleteLink(index)}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default Website;
export const revalidate = 10;
