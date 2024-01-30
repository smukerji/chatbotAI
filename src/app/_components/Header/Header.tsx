import React, { useEffect, useRef, useState } from "react";
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

function Header() {
  const router = useRouter();

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
        {/*------------------------------------------messages limit----------------------------------------------*/}
        <div className="messages-limit-container">
          <span>Messages</span>
          <Progress strokeLinecap="butt" percent={75} showInfo={false} />
          <span>
            <span style={{ color: "#141416" }}>24</span>/100
          </span>
        </div>

        {/*------------------------------------------feedback-btn----------------------------------------------*/}
        <button className="feedback-btn">Feedback</button>
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
                  <li>
                    <Image src={receiptIcon} alt="receipt-icon" />
                    Billing & Usage
                  </li>

                  <li>
                    <Image src={walletIcon} alt="wallet-icon" />
                    Pricing Plans
                  </li>
                </ul>
              </div>

              {/*------------------------------------------plan details container----------------------------------------------*/}
              <div className="plan-details-container">
                <div className="plan">
                  <span>Your plan</span>
                  <h1>Starter</h1>
                </div>
                <p>Expires in 14 days</p>
              </div>

              <hr />

              {/*------------------------------------------logout action----------------------------------------------*/}
              <button
                className="logout-btn"
                onClick={async (e) => {
                  if (!isLoggedIn) {
                    window.location.href = "/account/login";
                  } else if (session?.user || userId) {
                    await logout();
                    signOut();
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
