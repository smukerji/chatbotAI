import Link from "next/link";
import React from "react";

const Widget = ({ title, list }: { title: string; list: any }) => {
  return (
    <div className="links-container">
      <h2>{title}</h2>
      <ul className="info">
        {list.map((lt: any) => (
          <li key={lt.title}>
            <Link href={lt.url || "#"}>{lt.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Widget;
