import React, { useContext } from "react";
import "./text.scss";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";

export default function Text({ totalCharCount, textCharCount }: any) {
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the state from context
  const text = botDetails?.text;
  // function handleTextChange(e: any) {
  //   /// update the text count
  //   let prev = text.length;
  //   setText(e.target.value);
  //   const count = e.target.value.length;
  //   setTextLength(count);
  //   updateCharCount(getCharCount - prev + count);
  //   prev = count;
  // }

  // return (
  //   <div className="text-source-container">
  //     <textarea
  //       className="text-area"
  //       name="text"
  //       cols={90}
  //       rows={25}
  //       placeholder="data"
  //       onChange={handleTextChange}
  //       value={text}
  //     ></textarea>
  //     {textLength > 0 && <p>{textLength} characters</p>}
  //   </div>
  // );

  function handleTextChange(e: any) {
    /// update the text count
    let prev = text.length;
    botContext.handleChange("text")(e.target.value);
    const count = e.target.value.length;
    botContext.handleChange("textCharCount")(count);
    botContext?.handleChange("totalCharCount")(totalCharCount - prev + count);

    prev = count;
  }

  return (
    <div className="text-source-container">
      <textarea
        className="text-area"
        name="text"
        placeholder="Enter your data"
        onChange={handleTextChange}
        value={text}
      ></textarea>
      {textCharCount > 0 && <p>{textCharCount} characters</p>}
    </div>
  );
}
