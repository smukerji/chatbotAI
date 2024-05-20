import Image from "next/image";
import Link from "next/link";
import React from "react";
import facebook from "../../../../assets/socialIcons/facebook.webp";
import twitter from "../../../../assets/socialIcons/twitter.webp";
import linkedin from "../../../../assets/socialIcons/linkedin.webp";
import instagram from "../../../../assets/socialIcons/instagram.webp";
const AuthorSocialMedia = () => {
  return (
    <div className="author-social-link-container">
      <div className="author-spacer-line"></div>
      <div className="social-media-div">
        <div className="social-links">
          <Link href="#" className="author-social-profile-wrapper">
            <Image
              src={facebook}
              loading="lazy"
              alt="facebook"
              className="social-media-icon"
            />
          </Link>
          <Link
            href="#"
            target="_blank"
            className="author-social-profile-wrapper"
          >
            <Image
              src={twitter}
              loading="lazy"
              alt="twitter"
              className="social-media-icon"
            />
          </Link>
          <Link
            href="#"
            target="_blank"
            className="author-social-profile-wrapper"
          >
            <Image
              src={linkedin}
              loading="lazy"
              alt="linkedin"
              className="social-media-icon"
            />
          </Link>
          <Link href="#" className="author-social-profile-wrapper ">
            <Image
              src={instagram}
              loading="lazy"
              alt="instagram"
              className="social-media-icon"
            />
          </Link>
        </div>
      </div>
      <div className="author-spacer-line"></div>
    </div>
  );
};

export default AuthorSocialMedia;
