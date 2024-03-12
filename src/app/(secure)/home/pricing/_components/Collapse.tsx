import React from "react";
import type { CollapseProps } from "antd";
import { Collapse } from "antd";

const text = `
  A dog is a type of domesticated animal.
  Known for its loyalty and faithfulness,
  it can be found as a welcome guest in many households across the world.
`;

const items: CollapseProps["items"] = [
  {
    key: "1",
    label: "When will my Message credits get renewed?",
    children: <p>Your message credits are renewed at the start of every subscription date. So if you subscribe on the 5th of January, your credits will be renewed on the 5th of every month.</p>,
  },
  {
    key: "2",
    label: "What if I exhaust my messages/Training Data before my renewal date?",
    children: <p>You can purchase Add-ons for more messages or training data. We offer 5k messages for $5 USD and 10k messages for $8 USD. We offer 1M characters for $5 USD.</p>,
  },
  {
    key: "3",
    label: "How many users can use my chatbot?",
    children: <p>Anyone with the link will be able to interact with it.</p>,
  },
];

const Coll: React.FC = () => {
  const onChange = (key: string | string[]) => {
    console.log(key);
  };

  return (
    <Collapse items={items} defaultActiveKey={["1"]} onChange={onChange} expandIconPosition={'end'}/>
  );
};

export default Coll;
