import Image from "next/image";
import Link from "next/link";
import React from "react";
import facebook from "../../../../assets/socialIcons/facebook.webp";
import twitter from "../../../../assets/socialIcons/twitter.webp";
import linkedin from "../../../../assets/socialIcons/linkedin.webp";
import instagram from "../../../../assets/socialIcons/instagram.webp";

const AuthorSocialMedia = ({
  socialLinks,
}: {
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}) => {
  return (
    <div className="author-social-link-container">
      <div className="author-spacer-line"></div>
      <div className="social-media-div">
        <div className="social-links">
          <Link
            href={socialLinks.facebook || "#"}
            className="author-social-profile-wrapper"
            target="_blank"
          >
            <Image
              src={facebook}
              loading="lazy"
              alt="facebook"
              className="social-media-icon"
            />
          </Link>
          <Link
            href={socialLinks.twitter || "#"}
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
            href={socialLinks.linkedin || "#"}
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
          <Link
            href={socialLinks.instagram || "#"}
            className="author-social-profile-wrapper"
            target="_blank"
          >
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
