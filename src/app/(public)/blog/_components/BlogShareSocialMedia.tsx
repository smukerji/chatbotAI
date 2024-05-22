"use client";
import Image from "next/image";
import React from "react";
import facebook from "../../../../assets/socialIcons/facebook.webp";
import twitter from "../../../../assets/socialIcons/twitter.webp";
import linkedin from "../../../../assets/socialIcons/linkedin.webp";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
} from "react-share";
const BlogShareSocialMedia = ({ slug }: { slug: string }) => {
  return (
    <div className="share-social-icon">
      <FacebookShareButton
        hashtag="Torri.AI"
        url={`https://torri.ai/blog/${slug}`}
        children={
          <div>
            <Image
              src={facebook}
              alt="Facebook logo"
              className="social-share"
            />
          </div>
        }
      />
      <TwitterShareButton
        hashtags={[`Torri.AI`]}
        url={`https://torri.ai/blog/${slug}`}
        children={
          <div>
            <Image src={twitter} alt="Twitter logo" className="social-share" />
          </div>
        }
      />
      <LinkedinShareButton
        url={`https://torri.ai/blog/${slug}`}
        children={
          <div>
            <Image
              src={linkedin}
              alt="Linkedin logo"
              className="social-share"
            />
          </div>
        }
      />
    </div>
  );
};

export default BlogShareSocialMedia;
