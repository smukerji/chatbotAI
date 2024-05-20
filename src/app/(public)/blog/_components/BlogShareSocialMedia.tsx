import Image from "next/image";
import Link from "next/link";
import React from "react";
import facebook from "../../../../assets/socialIcons/facebook.webp";
import twitter from "../../../../assets/socialIcons/twitter.webp";
import linkedin from "../../../../assets/socialIcons/linkedin.webp";
const BlogShareSocialMedia = () => {
  return (
    <div className="share-social-icon">
      <Link href={"#"}>
        <Image src={facebook} alt="Facebook logo" />
      </Link>
      <Link href={"#"}>
        <Image src={twitter} alt="Twitter logo" />
      </Link>
      <Link href={"#"}>
        <Image src={linkedin} alt="Linkedin logo" />
      </Link>
    </div>
  );
};

export default BlogShareSocialMedia;
