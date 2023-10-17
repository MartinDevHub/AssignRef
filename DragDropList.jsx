import React from "react";
import PropTypes from "prop-types";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPencilAlt, faTrash } from "@fortawesome/free-solid-svg-icons";

function DragDropList({ items, onDragEnd, onEditQuestion, onDeleteQuestion }) {
  const handleEditQuestion = (question) => {
    onEditQuestion(question);
  };

  const onClickDeleteButton = (question) => {
    onDeleteQuestion(question);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="questionList">
        {(provided) => (
          <ul
            className="list-group"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {items.map((question, index) => (
              <Draggable
                key={question.id}
                draggableId={
                  typeof question.id === "string"
                    ? question.id
                    : question.id.toString()
                }
                index={index}
              >
                {(provided) => (
                  <li
                    className="list-group-item question-list"
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <span className="mb-2 question-index">
                      {`Q${index + 1}`}
                    </span>
                    <span className="mb-2 question-content">
                      {question.question}
                    </span>
                    <div className="cursor-pointer trash-icon">
                      <FontAwesomeIcon
                        icon={faPencilAlt}
                        className="fa-light"
                        onClick={() => handleEditQuestion(question)}
                      />
                    </div>
                    <div className="cursor-pointer">
                      <FontAwesomeIcon
                        icon={faTrash}
                        onClick={() => onClickDeleteButton(question)}
                      />
                    </div>
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
}

DragDropList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      question: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  onDragEnd: PropTypes.func.isRequired,
  onEditQuestion: PropTypes.func.isRequired,
  onDeleteQuestion: PropTypes.func.isRequired,
};

export default DragDropList;
