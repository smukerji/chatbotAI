import Link from "next/link";
import React from "react";

const Widget = ({
  title,
  list,
  setOpenSupport,
}: {
  title: string;
  list: any;
  setOpenSupport: any;
}) => {
  return (
    <div className="links-container">
      <h2>{title}</h2>
      <ul className="info">
        {list.map((lt: any) => (
          <li key={lt.title}>
            {lt.title == "Support" ? (
              <a onClick={() => setOpenSupport(true)}>{lt.title}</a>
            ) : (
              <a href={lt.url || "#"}>{lt.title}</a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Widget;
