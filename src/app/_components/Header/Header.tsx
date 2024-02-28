import React, { useContext, useEffect, useRef, useState } from "react";
import LuciferLogo from "../../../../public/svgs/lucifer-ai-logo.svg";
import profileIcon from "../../../../public/svgs/profile-circle.svg";
import walletIcon from "../../../../public/svgs/wallet-add.svg";
import receiptIcon from "../../../../public/svgs/receipt-2.svg";
import logoutIcon from "../../../../public/svgs/logout.svg";

import Image from "next/image";
import { Progress } from "antd";
import "./header.scss";
import { useCookies } from "react-cookie";
import { useUserService } from "../../_services/useUserService";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { formatNumber } from "../../_helpers/client/formatNumber";
import { UserDetailsContext } from "../../_helpers/client/Context/UserDetailsContext";

function Header() {
  const router = useRouter();
  /// state to store user plan
  // const [userPlan, setUserPlan] = useState<{
  //   _id: string;
  //   name: string;
  //   messageLimit: number;
  //   numberOfChatbot: number;
  //   trainingDataLimit: number;
  // }>();

  const userDetailContext: any = useContext(UserDetailsContext);
  const userDetails = userDetailContext?.userDetails;

  // const [userMessageCount, setUserMessageCount] = useState<number>(0);

  /// state to store the percentage of message sent by user
  // const [progressPercent, setProgressPercent] = useState<number>(0);

  /// create a ref for menu to close it when user click outside of the mene-container
  const menuRef: any = useRef(null);
  const [cookies, setCookie] = useCookies([
    "profile-img",
    "username",
    "userId",
    "authorization",
  ]);
  /// state for opening the profile menu
  const [openMenu, setOpenMenu] = useState(false);
  const userService = useUserService();
  const { data: session } = useSession();

  let shortUserName = "";
  const names = cookies?.username?.split("_");
  if (names?.length > 1) {
    shortUserName = names?.[0][0] + names?.[1][0];
  } else {
    shortUserName = names?.[0][0];
  }

  async function logout() {
    await userService.logout();
  }

  /// to check if user is logged in or not
  const userId = cookies.userId;
  const isLoggedIn = session?.user || userId !== undefined;

  /// useeffect to check if the user has clicked outside the menu and the menu is open set to false
  useEffect(() => {
    /// get the user and plan details

    const fetchData = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WEBSITE_URL}api/account/user/details?userId=${cookies?.userId}`,
        {
          method: "GET",
          next: { revalidate: 0 },
        }
      );

      const userDetails = await response.json();
      const date2: any = new Date(userDetails?.planExpiry);
      const date1: any = new Date(); // Current date

      // Calculate the difference in milliseconds
      const differenceMs = date2 - date1;
      const differenceDays = Math.round(differenceMs / (1000 * 60 * 60 * 24));
      /// set the expiry
      userDetailContext?.handleChange("planExpiry")(differenceDays);
      userDetailContext?.handleChange("totalMessageCount")(
        userDetails?.userDetails?.totalMessageCount
      );
      userDetailContext?.handleChange("plan")(userDetails?.plan);
      userDetailContext?.handleChange("noOfChatbotsUserCreated")(
        userDetails?.noOfChatbotsUserCreated
      );
      const percent =
        (userDetails?.userDetails?.totalMessageCount /
          userDetails?.plan?.messageLimit) *
        100;
      /// store the percentage of message sent by user
      userDetailContext?.handleChange("percent")(percent);
    };
    fetchData();

    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Remove event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 767) {
      setIsMobile(true);
    }
  }, []);

  return (
    <div className="header-container">
      {/*------------------------------------------logo----------------------------------------------*/}
      <Image
        className="logo"
        src={LuciferLogo}
        alt="img-logo"
        onClick={() => {
          window.location.href = "/";
        }}
      />

      <div className="header-content">
        {!isMobile && (
          <>
            {/*------------------------------------------messages limit----------------------------------------------*/}
            <div className="messages-limit-container">
              <span>Messages</span>
              <Progress
                strokeLinecap="butt"
                percent={userDetails?.percent}
                showInfo={false}
              />
              <span>
                <span style={{ color: "#141416" }}>
                  {userDetails?.totalMessageCount}
                </span>
                /
                {formatNumber(
                  userDetails?.plan?.messageLimit
                    ? userDetails?.plan?.messageLimit
                    : 10000
                )}
              </span>
            </div>

            {/*------------------------------------------chatbot-btn----------------------------------------------*/}
            <a href="/chatbot" style={{ textDecoration: "none" }}>
              <button
                className="feedback-btn"
                style={{
                  color:
                    `${window.location.pathname}` === "/chatbot"
                      ? "#2E58EA"
                      : "",
                }}
              >
                My Chatbots
              </button>
            </a>
            {/*------------------------------------------feedback-btn----------------------------------------------*/}
            <button className="feedback-btn">Support</button>
          </>
        )}
        {/*------------------------------------------Profile Image----------------------------------------------*/}

        <div className="profile-img" onClick={() => setOpenMenu(!openMenu)}>
          {cookies?.["profile-img"] ? (
            <Image
              className="providers-img"
              width={40}
              height={40}
              // style={{ borderRadius: "50%" }}
              src={cookies?.["profile-img"]}
              alt="profile-img"
            />
          ) : (
            <span>{shortUserName?.toUpperCase()}</span>
          )}

          {openMenu && (
            /*------------------------------------------menu container----------------------------------------------*/
            <div
              className="account-menu-conatiner"
              onClick={(e) => e.stopPropagation()}
              ref={menuRef}
            >
              <p className="username">
                {names?.[0]} {names?.[1] ? " " + names?.[1] : ""}
              </p>
              {/*------------------------------------------account actions menu----------------------------------------------*/}
              <div className="account-actions-container">
                <ul>
                  <li onClick={() => router.push("/home/account-settings")}>
                    <Image src={profileIcon} alt="profile-icon" />
                    Account settings
                  </li>
                  <li onClick={() => router.push("/home/BillingAndUsage")}>
                    <Image src={receiptIcon} alt="receipt-icon" />
                    Billing & Usage
                  </li>

                  <li onClick={() => router.push("/home/pricing")}>
                    <Image src={walletIcon} alt="wallet-icon" />
                    Pricing Plans
                  </li>

                  {isMobile && (
                    <>
                      <li>
                        <a href="/chatbot" style={{ textDecoration: "none" }}>
                          <button
                            className="feedback-btn"
                            style={{
                              color:
                                `${window.location.pathname}` === "/chatbot"
                                  ? "#2E58EA"
                                  : "",
                            }}
                          >
                            My Chatbots
                          </button>
                        </a>
                      </li>

                      <li>
                        <button className="feedback-btn">Support</button>
                      </li>

                      <li>
                        <div className="messages-limit-container">
                          <span>Messages</span>

                          <Progress
                            strokeLinecap="butt"
                            percent={userDetails?.percent}
                            showInfo={false}
                          />
                          <span>
                            <span style={{ color: "#141416" }}>
                              {userDetails?.totalMessageCount}
                            </span>
                            /
                            {formatNumber(
                              userDetails?.plan?.messageLimit
                                ? userDetails?.plan?.messageLimit
                                : 10000
                            )}
                          </span>
                        </div>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/*------------------------------------------plan details container----------------------------------------------*/}
              <div className="plan-details-container">
                <div className="plan">
                  <span>Your plan</span>
                  <h1>{userDetails?.plan?.name}</h1>
                </div>
                <p>Expires in {userDetails?.planExpiry} days</p>
              </div>

              <hr />

              {/*------------------------------------------logout action----------------------------------------------*/}
              <button
                className="logout-btn"
                onClick={async (e) => {
                  if (!isLoggedIn) {
                    window.location.href = "/account/login";
                  } else if (session?.user || userId) {
                    setOpenMenu(!openMenu);
                    await logout();
                    await signOut();
                    window.location.href = "/";
                  }
                }}
              >
                <Image src={logoutIcon} alt="logout-icon" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Header;
