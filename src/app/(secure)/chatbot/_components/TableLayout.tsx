import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import chatbotBg from "../../../../../public/sections-images/common/chatbot-bg-img.svg";
import chatbotMenuIcon from "../../../../../public/sections-images/common/chatbot-menu-icon.svg";
import shareIcon from "../../../../../public/sections-images/common/share.svg";
import duplicateIcon from "../../../../../public/sections-images/common/document-copy.svg";
import renameIcon from "../../../../../public/sections-images/common/edit.svg";
import deleteIcon from "../../../../../public/sections-images/common/trash.svg";
import { formatTimestamp } from "../../../_helpers/client/formatTimestamp";
import { formatNumber } from "../../../_helpers/client/formatNumber";
import { UserDetailsContext } from "../../../_helpers/client/Context/UserDetailsContext";

function TableLayout({
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

  /// get userDetails context
  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

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

  // check if chatbotData is available
  if (chatbotData?.length > 0) {
    return (
      <div
        className="chabot-table"
        style={{ pointerEvents: disabled ? "none" : "all" }}
      >
        <table>
          <tbody>
            {/*------------------------------------------table-header----------------------------------------------*/}
            <tr>
              <th>Chatbot Name</th>
              <th>Total Characters </th>
              <th>Message Sent</th>
              <th>Last Trained</th>
              <th colSpan={2}>Last Used</th>
            </tr>

            {/*------------------------------------------table-data----------------------------------------------*/}
            {chatbotData?.map((data: any, index: number) => {
              return (
                <tr
                  className="chatbot"
                  key={data.chatbotId}
                  style={{
                    background: `${
                      data.id === chatbotId
                        ? "#ecf0fe"
                        : openMenu?.[index]
                        ? "ecf0fe"
                        : ""
                    }`,
                  }}
                  //   onClick={() => openMenu && setOpenMenu(null)}
                >
                  <td onClick={() => openChatbot(data.id)}>
                    <Image
                      style={{
                        width: "48px",
                        height: "48px",
                      }}
                      src={chatbotBg}
                      alt={"chatbot-img"}
                    />
                    {data.name}
                  </td>

                  <td>
                    <span>
                      {data?.numberOfCharacterTrained
                        ? formatNumber(data?.numberOfCharacterTrained)
                        : 0}
                    </span>

                    <span style={{ color: "#777E90" }}>
                      /{formatNumber(userDetails?.plan?.trainingDataLimit)}
                    </span>
                  </td>

                  <td>{data?.noOfMessagesSent ? data?.noOfMessagesSent : 0}</td>

                  <td>
                    {formatTimestamp(
                      data?.lastTrained
                        ? data?.lastTrained
                        : new Date().getTime(),
                      true
                    )}
                  </td>

                  <td>
                    {formatTimestamp(
                      data?.lastUsed ? data?.lastUsed : new Date().getTime(),
                      true
                    )}
                  </td>
                  <td
                    style={{
                      textAlign: "end",
                    }}
                  >
                    <Image
                      //   style={{
                      //     visibility: `${
                      //       data.id === currentChatbotId
                      //         ? "visible"
                      //         : openMenu?.[index]
                      //         ? "visible"
                      //         : "hidden"
                      //     }`,
                      //   }}
                      style={{
                        cursor: "pointer",
                        opacity: `${openMenu?.[index] && 1}`,
                      }}
                      className="menu-icon"
                      src={chatbotMenuIcon}
                      alt={"chatbot-menu-icon"}
                      onClick={() => {
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
                            <Image src={renameIcon} alt={"rename-icon"} />{" "}
                            Rename
                          </li>
                          <li className="chatbot-actions" value={3}>
                            <Image src={deleteIcon} alt={"delete-icon"} />
                            Delete
                          </li>
                        </ul>
                      </div>
                    ) : null}
                  </td>

                  {/* opening the menu for chatbot actions */}
                  {/* <Image
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
                  onClick={() => {
                      changeMenu({ [index]: !openMenu?.[index] });
                      setCurrentChatbotId(data.id);
                    }}
                /> */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

export default TableLayout;
