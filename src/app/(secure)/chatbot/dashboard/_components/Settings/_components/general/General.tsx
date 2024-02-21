import React, { useContext, useState } from "react";
import "./../general/general.scss";
import Icon from "@/app/_components/Icon/Icon";
import DocumentIcon from "@/assets/svg/DocumentIcon";
import DeleteIcon from "@/assets/svg/DeleteIcon";
import { useCookies } from "react-cookie";
import { message } from "antd";
import DeleteModal from "../../../Modal/DeleteModal";
import { CreateBotContext } from "../../../../../../../_helpers/client/Context/CreateBotContext";

function General({ chatbotId, chatbotName }: any) {
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  const [cookies, setCookies]: any = useCookies(["userId"]);

  /// this is use to check if chatbot name has been changed or not
  const [currentChatbotName, setCurrentChatbotName] = useState(chatbotName);

  const changeName = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot/api/setting/api`,
        {
          method: "PUT",
          body: JSON.stringify({
            chatbotId: chatbotId,
            userId: cookies?.userId,
            chatbotRename: currentChatbotName,
          }),
          next: { revalidate: 0 },
        }
      );
      /// displaying status
      const data = await res.json();

      message.success(data?.message);
      botContext.handleChange("chatbotName")(currentChatbotName);
      // window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}chatbot`;
    } catch (error) {
      console.log("Error while renaming chatbot", error);
    }
  };

  /// to copy chatbot Id
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chatbotId);
      message.success("ID copied to clipboard");
    } catch (err: any) {
      message.error("Copy Failed!", err.message);
    }
  };

  /// managing delete chatbot
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  return (
    <div className="general-setting-parent">
      <div className="ids-container">
        <div className="ids">ID</div>
        <div className="ids-details">
          <div className="ids-detail-content">{chatbotId}</div>
          <div className="icon" onClick={handleCopy}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M9.24984 18.9577H5.74984C2.4915 18.9577 1.0415 17.5077 1.0415 14.2494V10.7493C1.0415 7.49102 2.4915 6.04102 5.74984 6.04102H9.24984C12.5082 6.04102 13.9582 7.49102 13.9582 10.7493V14.2494C13.9582 17.5077 12.5082 18.9577 9.24984 18.9577ZM5.74984 7.29102C3.1665 7.29102 2.2915 8.16602 2.2915 10.7493V14.2494C2.2915 16.8327 3.1665 17.7077 5.74984 17.7077H9.24984C11.8332 17.7077 12.7082 16.8327 12.7082 14.2494V10.7493C12.7082 8.16602 11.8332 7.29102 9.24984 7.29102H5.74984V7.29102Z"
                fill="#2E58EA"
              />
              <path
                d="M14.2498 13.9577H13.3332C12.9915 13.9577 12.7082 13.6743 12.7082 13.3327V10.7493C12.7082 8.16602 11.8332 7.29102 9.24984 7.29102H6.6665C6.32484 7.29102 6.0415 7.00768 6.0415 6.66602V5.74935C6.0415 2.49102 7.4915 1.04102 10.7498 1.04102H14.2498C17.5082 1.04102 18.9582 2.49102 18.9582 5.74935V9.24935C18.9582 12.5077 17.5082 13.9577 14.2498 13.9577ZM13.9582 12.7077H14.2498C16.8332 12.7077 17.7082 11.8327 17.7082 9.24935V5.74935C17.7082 3.16602 16.8332 2.29102 14.2498 2.29102H10.7498C8.1665 2.29102 7.2915 3.16602 7.2915 5.74935V6.04102H9.24984C12.5082 6.04102 13.9582 7.49102 13.9582 10.7493V12.7077Z"
                fill="#2E58EA"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="characters-container">
        <div className="characters-details">Characters Used</div>
        <div>
          {botDetails?.totalCharCount}
          <span className="span">/12000</span>
        </div>
      </div>
      <div className="parent-name-btn">
        <div className="name-container">
          <div className="name-container-details">Name</div>
          <div>
            <input
              className="input-box"
              value={currentChatbotName}
              onChange={(e) => {
                setCurrentChatbotName(e.target.value);
              }}
            ></input>
          </div>
        </div>
        <button
          className="save-btn"
          disabled={currentChatbotName == chatbotName}
          onClick={() => changeName()}
        >
          <div className="save-btn-content">Save</div>
        </button>
      </div>

      <div
        className="delete-container"
        onClick={() => {
          setOpenDeleteModal(true);
        }}
      >
        <div className="delete-icon">
          <Icon Icon={DeleteIcon} />
        </div>
        <div className="delete-text">Delete this chatbot</div>
      </div>

      <DeleteModal
        open={openDeleteModal}
        setOpen={setOpenDeleteModal}
        chatbotId={chatbotId}
        reload={true}
      />
    </div>
  );
}

export default General;
