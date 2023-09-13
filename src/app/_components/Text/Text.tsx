import React from "react";
import "./text.css";

export default function Text({
  text,
  setText,
  textLength,
  setTextLength,
  updateCharCount,
  getCharCount,
}: any) {
  function handleTextChange(e: any) {
    /// update the text count
    let prev = text.length;
    setText(e.target.value);
    const count = e.target.value.length;
    setTextLength(count);
    updateCharCount(getCharCount - prev + count);
    prev = count;
  }
  return (
    <div className="text-source-container">
      <textarea
        className="text-area"
        name="text"
        cols={90}
        rows={25}
        placeholder="data"
        onChange={handleTextChange}
        value={text}
      ></textarea>
      {textLength > 0 && <p>{textLength} characters</p>}
    </div>
  );
}
