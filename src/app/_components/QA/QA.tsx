import React, { useContext } from "react";
import { CreateBotContext } from "../../_helpers/client/Context/CreateBotContext";
import QAAdd from "./QAAdd";
import "./qa.scss";

function QA({ totalCharCount, qaCharCount, isUpdateChatbot }: any) {
  const botContext: any = useContext(CreateBotContext);
  const botDetails = botContext?.createBotInfo;

  /// get the qaList from context and qa count
  const qaList = botDetails?.qaList;
  const qaCount = botDetails?.qaCount;
  const deleteQaList = botDetails?.deleteQaList;

  /// Adding QA
  function addQA() {
    botContext?.handleChange("qaList")([
      ...qaList,
      { question: "", answer: "", image: "" },
    ]);
    botContext?.handleChange("qaCount")(qaCount + 1);
  }

  /// Removing QA
  function removeQA(indexToRemove: number) {
    const newQa = qaList.filter((qa: any, index: number) => {
      return index !== indexToRemove;
    });

    /// add the qa that need to be deleted while updating the chatbot
    if (isUpdateChatbot && qaList[indexToRemove]?.id) {
      botContext?.handleChange("deleteQaList")([
        ...deleteQaList,
        qaList[indexToRemove],
      ]);
    }

    /// update the overall count
    botContext?.handleChange("totalCharCount")(
      totalCharCount -
        qaList[indexToRemove].question.length -
        qaList[indexToRemove].answer.length
    );

    /// update the character count
    botContext?.handleChange("qaCharCount")(
      qaCharCount -
        qaList[indexToRemove].question.length -
        qaList[indexToRemove].answer.length
    );

    /// update the state
    botContext?.handleChange("qaList")(newQa);
    botContext?.handleChange("qaCount")(qaCount - 1);
  }

  /// Removing QA
  function removeAllQA() {
    // Calculate total length of all QA pairs
    let totalLength = 0;
    const newDeleteQa = qaList.filter((qa: any, index: number) => {
      // Calculate length of each QA pair
      const qaLength = qa?.question.length + qa?.answer.length;

      // Subtract length from total counts
      totalLength += qaLength;

      return qa?.id != "" && qa?.id != undefined;
    });

    /// add all qa that need to be deleted while updating the chatbot
    if (isUpdateChatbot) {
      botContext?.handleChange("deleteQaList")([
        ...deleteQaList,
        ...newDeleteQa,
      ]);
    }

    /// update the overall count
    botContext?.handleChange("totalCharCount")(totalCharCount - totalLength);

    /// update the character count
    botContext?.handleChange("qaCharCount")(qaCharCount - totalLength);

    /// update the state
    botContext?.handleChange("qaList")([]);
    botContext?.handleChange("qaCount")(0);
  }

  /// Update QA
  function updateQA(
    index: number,
    newQuestion: any,
    newAnswer: any,
    newImage: any
  ) {
    const updatedQAList = [...qaList];
    const prev =
      updatedQAList[index].question.length + updatedQAList[index].answer.length;
    if (updatedQAList[index]?.id) {
      updatedQAList[index] = {
        question: newQuestion,
        answer: newAnswer,
        image: newImage,
        id: updatedQAList[index]?.id,
        updated: true,
      };
    } else
      updatedQAList[index] = {
        question: newQuestion,
        answer: newAnswer,
        image: newImage,
      };
    /// update the state
    botContext?.handleChange("qaList")(updatedQAList);

    /// update the count of qa
    const count =
      updatedQAList[index].question.length + updatedQAList[index].answer.length;
    botContext?.handleChange("qaCharCount")(qaCharCount - prev + count);
    botContext?.handleChange("totalCharCount")(totalCharCount - prev + count);
  }

  return (
    <>
      <div className="qa-container">
        <div className="qa-lists">
          {qaList &&
            qaList.map((qa: any, index: number) => {
              return (
                <div className="add-qa-container" key={index}>
                  <QAAdd
                    onQuestionChange={(newQuestion: any) => {
                      updateQA(index, newQuestion, qa.answer, qa.image);
                    }}
                    onAnswerChange={(newAnswer: any) =>
                      updateQA(index, qa.question, newAnswer, qa.image)
                    }
                    onImageChange={(newImage: any) => {
                      updateQA(index, qa.question, qa.answer, newImage);
                    }}
                    onDelete={() => removeQA(index)}
                    question={qa.question}
                    answer={qa.answer}
                    fileName={qa.image != "" ? qa.image : "No file uploaded"}
                    index={index}
                  />
                </div>
              );
            })}
        </div>
        <div className="qa-action-container">
          <span>{qaCharCount} characters</span>
          <div className="action-btns">
            <button onClick={addQA}>Add</button>
            <button onClick={removeAllQA} disabled={qaCount > 0 ? false : true}>
              Delete All
            </button>
          </div>
        </div>
      </div>
      {/* {qaList &&
            qaList.map((qa: any, index: number) => {
              return (
                <div className="add-qa-container" key={index}>
                  <QAAdd
                    onQuestionChange={(newQuestion: any) => {
                      updateQA(index, newQuestion, qa.answer, qa.image);
                    }}
                    onAnswerChange={(newAnswer: any) =>
                      updateQA(index, qa.question, newAnswer, qa.image)
                    }
                    onImageChange={(newImage: any) => {
                      updateQA(index, qa.question, qa.answer, newImage);
                    }}
                    onDelete={() => removeQA(index)}
                    question={qa.question}
                    answer={qa.answer}
                    fileName={qa.image != "" ? qa.image : "No file uploaded"}
                    index={index}
                  />
                </div>
              );
            })}
          <div className="qa-source-btn-container">
            <Button
              className="add-button"
              type="primary"
              shape="round"
              size={"small"}
              onClick={addQA}
            >
              Add
            </Button>
          </div> */}
    </>
  );
}

export default QA;
