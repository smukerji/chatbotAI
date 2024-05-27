import Image from "next/image";
import React from "react";

const AuthorProfile = ({
  profileImage,
  name,
}: {
  profileImage?: string;
  name?: string;
}) => {
  return (
    <div className="author-profile">
      <div>
        {profileImage && (
          <Image
            src={profileImage}
            alt="Author profile image"
            width={100}
            height={100}
          />
        )}
        <p>{name}</p>
      </div>
    </div>
  );
};

export default AuthorProfile;
