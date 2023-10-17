import React from "react";
import propTypes from "prop-types";
import "./testbuilder.css";

function QuestionCard(props) {
  const handleEditQuestion = () => {
    props.onEditQuestion(props.question);
  };

  return (
    <div className="card shadow-sm rounded mb-2">
      <div className="card-body question-card">
        <div className="card-title text-center">
          <h5 className="mb-2">{`Q${props.index + 1}`} </h5>
          <span className="mb-2">{props.question.question}</span>
          <div className="div-edit-button">
            <button
              type="button"
              className="btn btn-outline-dark edit-button"
              onClick={handleEditQuestion}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

QuestionCard.propTypes = {
  index: propTypes.number.isRequired,
  question: propTypes.shape({
    question: propTypes.string,
  }).isRequired,
  onEditQuestion: propTypes.func.isRequired,
};
export default QuestionCard;
