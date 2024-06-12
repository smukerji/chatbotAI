import React, { useEffect, useState } from "react";
import Image from "next/image";
import chatbotBg from "../../../../../public/sections-images/common/chatbot-bg-img.svg";
import chatbotOpenIcon from "../../../../../public/sections-images/common/chatbot-open-icon.svg";
import chatbotMenuIcon from "../../../../../public/sections-images/common/chatbot-menu-icon.svg";
import shareIcon from "../../../../../public/sections-images/common/share.svg";
import duplicateIcon from "../../../../../public/sections-images/common/document-copy.svg";
import renameIcon from "../../../../../public/sections-images/common/edit.svg";
import deleteIcon from "../../../../../public/sections-images/common/trash.svg";

function GridLayout({
  chatbotData,
  changeMenu,
  openMenu,
  openChatbot,
  setOpenShareModal,
  setChatbotId,
  chatbotId,
  setOpenDeleteModal,
  setOpenRenameModal,
  disabled,
}: any) {
  /// state to maintain the hovering over chatbots
  const [currentChatbotId, setCurrentChatbotId] = useState(null);

  useEffect(() => {
    // Handle chatbot click event
    const handleChatbotClick = (event: any) => {
      // Check if the event target is the chatbot or any of its children
      if (event.target.closest(".chatbot")) {
        /// Open the chatbot menu
        changeMenu(null);
      }
    };

    // Handle menu-icon click event
    const handleChatbotMenuClick = (event: any) => {
      // Check if the event target is the chatbot or any of its children
      const menuClick = event.target.closest(".chatbot-actions");

      if (menuClick?.value == 0) {
        /// if share is clicked
        /// Open the chatbot menu
        setOpenShareModal(true);
      } else if (menuClick?.value == 1) {
        /// if dulpicate is clicked
      } else if (menuClick?.value == 2) {
        /// if rename is clicked
        setOpenRenameModal(true);
      } else if (menuClick?.value == 3) {
        /// if delete is clicked
        setOpenDeleteModal(true);
      }
    };

    // Attach the event listeners to the document body
    document.body.addEventListener("click", handleChatbotClick);
    document.body.addEventListener("click", handleChatbotMenuClick);

    // document.body.addEventListener("click", handleMenuIconClick);

    // Clean up the event listeners when the component is unmounted
    return () => {
      document.body.removeEventListener("click", handleChatbotClick);
      document.body.removeEventListener("click", handleChatbotMenuClick);

      //   document.body.removeEventListener("click", handleMenuIconClick);
    };
  }, []);

  if (chatbotData?.length > 0) {
    return (
      <div
        className="chatbot-grid"
        style={{ pointerEvents: disabled ? "none" : "all" }}
      >
        {chatbotData?.map((data: any, index: number) => {
          return (
            <React.Fragment key={index}>
              <div
                className="chatbot"
                key={data.id}
                onMouseEnter={() => setCurrentChatbotId(data.id)}
                onMouseLeave={() => {
                  setCurrentChatbotId(null);
                }}
                onClick={() => {
                  openChatbot(data.id);
                }}
                style={{
                  background: `${
                    data.id === currentChatbotId
                      ? "#ecf0fe"
                      : openMenu?.[index]
                      ? "ecf0fe"
                      : ""
                  }`,
                }}
                //   onClick={() => openMenu && setOpenMenu(null)}
              >
                <Image src={chatbotBg} alt={"chatbot-img"} />
                <div className="name">
                  {data.name}
                  {/* <Image
                  className="open-icon"
                  src={chatbotOpenIcon}
                  alt={"chatbot-open-icon"}
                /> */}
                </div>

                {/* opening the menu for chatbot actions */}
                <Image
                  style={{
                    visibility: `${
                      data.id === currentChatbotId
                        ? "visible"
                        : openMenu?.[index]
                        ? "visible"
                        : "hidden"
                    }`,
                  }}
                  className="menu-icon"
                  src={chatbotMenuIcon}
                  alt={"chatbot-menu-icon"}
                  onClick={(event) => {
                    event.stopPropagation();
                    changeMenu({ [index]: !openMenu?.[index] });
                    setChatbotId(data.id);
                  }}
                />

                {/* opening the menu for chatbot actions */}
                {openMenu?.[index] ? (
                  <div className={`menu ${openMenu?.[index] && "active"}`}>
                    <ul>
                      <li className="chatbot-actions" value={0}>
                        <Image src={shareIcon} alt={"share-icon"} /> Share
                      </li>
                      {/* <li className="chatbot-actions" value={1}>
                        <Image src={duplicateIcon} alt={'duplicate-icon'} />
                        Duplicate
                      </li> */}

                      <li className="chatbot-actions" value={2}>
                        <Image src={renameIcon} alt={"rename-icon"} /> Rename
                      </li>
                      <li className="chatbot-actions" value={3}>
                        <Image src={deleteIcon} alt={"delete-icon"} />
                        Delete
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }
}

export default GridLayout;
