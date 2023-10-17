import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import * as questionService from "../../services/questionService";
import { Formik, Form, Field, FieldArray } from "formik";
import toastr from "toastr";
import { Button, Breadcrumb, Accordion } from "react-bootstrap";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faCircleMinus } from "@fortawesome/free-solid-svg-icons";
import testBuilderSchema from "schemas/testBuilderSchema";
import "./testbuilder.css";
import testService from "../../services/testService";
import DragDropList from "./DragDropList";

function TestBuilder() {
  const { testId } = useParams();

  const defaultData = {
    questionData: {
      question: "",
      helpText: "helpText",
      isRequired: true,
      isMultipleAllowed: false,
      questionTypeId: 1,
      testId: null,
      statusId: 1,
      sortOrder: 0,
    },
    questionsList: [],
    questionsComp: [],
    answerData: [
      {
        text: "",
        value: "",
        additionalInfo: "",
        isCorrect: true,
        hasAddInfo: false,
        showHelpText: false,
      },
    ],
  };

  const [formData, setFormData] = useState(defaultData);

  const [isEditMode, setisEditMode] = useState(false);

  useEffect(() => {
    if (testId) {
      testService
        .getById(testId)
        .then(onGetTestIdSuccess)
        .catch(onGetTestIdError);
    }
  }, []);

  const onGetTestIdSuccess = (response) => {
    let test = response.item;

    const sortedQuestions = test.testQuestions.sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    const updatedQuestions = sortedQuestions.map((question) => ({
      ...question,
    }));

    setFormData((prevState) => {
      return {
        ...prevState,
        onUpdate: true,
        questionData: {
          ...prevState.questionData,
          testId: test.id,
        },
        questionsList: updatedQuestions,
      };
    });
  };
  const onGetTestIdError = (err) => {
    toastr.error("error testId", err);
  };

  const handleSubmit = (values) => {
    const payload = { ...values.questionData };
    payload.testId = parseInt(testId);
    payload.sortOrder = 1;
    payload.answerOption = [...values.answerData];
    payload.answerOption.forEach((option) => {
      if (typeof option.text === "object") {
        option.text = option.text.text;
      }
    });

    questionService
      .addQuestion(payload)
      .then((response) => onGetQASuccess(response.item, payload))
      .catch(onGetQAError);
  };

  const onGetQASuccess = (newQuestionId, questionData) => {
    toastr.success("Question and answer(s) successful", "Success");

    setFormData((prevFormData) => {
      const newFormData = {
        ...prevFormData,
        questionsList: [
          { ...questionData, id: newQuestionId },
          ...prevFormData.questionsList,
        ],
        answerData: [],
      };

      return newFormData;
    });
  };

  const onGetQAError = (err) => {
    toastr.error("Question and answer submission error", err);
  };

  const handleEditQuestion = (question) => {
    const onGetQuestionsSuccess = () => {
      setFormData((prevState) => {
        const newState = { ...prevState };

        (newState.questionData = {
          ...prevState.questionData,
          question: question.question,
          id: question.id,
        }),
          (newState.answerData = question.answerOption.map((item) => ({
            ...item,
            text: item,
          })));

        return newState;
      });
    };

    const onGetQuestionsError = (err) => {
      toastr.error("Unable to get questions", "Bad Request", err);
    };

    questionService
      .getById(question, question.id)
      .then(onGetQuestionsSuccess)
      .catch(onGetQuestionsError);

    setisEditMode(true);
  };

  const onClickUpdateButton = (question) => {
    const selectedQuestion = question.questionsList.find(
      (aQuestion) => aQuestion.id === question.questionData.id
    );

    const answerDataLength = question.answerData.length;

    if (answerDataLength > 0) {
      for (let i = 0; i < answerDataLength; i++) {
        const answerDataItem = question.answerData[i];
        const updatedAnswerOption = { ...answerDataItem.text };

        const optionToUpdate = selectedQuestion.answerOption.find(
          (option) => option.id === updatedAnswerOption.id
        );

        if (optionToUpdate) {
          optionToUpdate.text = updatedAnswerOption.text;
        } else {
          selectedQuestion.answerOption.push({
            text: updatedAnswerOption.text,
            value: updatedAnswerOption.value,
            additionalInfo: updatedAnswerOption.additionalInfo,
            isCorrect: updatedAnswerOption.isCorrect,
            hasAddInfo: updatedAnswerOption.hasAddInfo,
          });
        }
      }
    }

    const selectedAnswerOptionIds = question.answerData.map(
      (answerDataItem) => answerDataItem.text.id
    );

    for (let i = selectedQuestion.answerOption.length - 1; i >= 0; i--) {
      const option = selectedQuestion.answerOption[i];
      if (!selectedAnswerOptionIds.includes(option.id)) {
        selectedQuestion.answerOption.splice(i, 1);
      }
    }

    selectedQuestion.testId = parseInt(testId);
    selectedQuestion.question = question.questionData.question;

    const payload = {
      ...question.questionData,
      sortOrder: 1,
      answerOption: question.answerData.map((answer) => ({
        ...answer,
        text: answer.text.text,
      })),
    };

    questionService
      .updateQuestionContent(payload, selectedQuestion.id)
      .then(
        onUpdateQuestionContentSuccess(
          question.questionData,
          question.answerData
        )
      )
      .catch(onUpdateQuestionContentError);
  };

  const onUpdateQuestionContentSuccess = (question, answerData) => {
    setFormData((prevFormData) => {
      const updatedQuestionList = prevFormData.questionsList.map(
        (aQuestion) => {
          if (aQuestion.id === question.id) {
            return {
              ...aQuestion,
              question: question.question,
              helpText: question.helpText,
              testId: parseInt(testId),
            };
          }
          return aQuestion;
        }
      );

      const updatedAnswerData = prevFormData.answerData.map((anAnswer) => {
        if (anAnswer.text.id === answerData.id) {
          return {
            ...anAnswer,
            text: {
              ...anAnswer.text,
              text: answerData.text,
            },
          };
        }
        return anAnswer;
      });

      const updatedQuestionData = {
        ...prevFormData.questionData,
        question: question.question,
      };

      return {
        ...prevFormData,
        questionData: updatedQuestionData,
        questionsList: updatedQuestionList,
        answerData: updatedAnswerData,
      };
    });

    toastr.success("Question content updated successfully", "Success");
  };

  const onUpdateQuestionContentError = (err) => {
    toastr.error("Question content was not updated", "Bad Request", err);
  };

  const onCheckboxChanged = (index, values) => {
    const newState = { ...values };

    newState.answerData = values.answerData.map((answer, indexTwo) => {
      const baseObj = { ...answer };
      baseObj.isCorrect = index === indexTwo ? true : false;

      return baseObj;
    });

    setFormData(newState);
  };

  const onCancelClicked = (resetForm, values, setisEditMode) => {
    const newValues = {
      ...values,
      questionData: { ...values.questionData, question: "" },
      answerData: [],
    };

    return () => {
      resetForm({ values: newValues });
      setisEditMode(false);
    };
  };

  const onNextQClicked = (resetForm, values) => {
    const newValues = {
      ...values,
      questionData: { ...values.questionData, question: "" },
      answerData: values.answerData.map((obj) => ({
        ...obj,
        text: "",
        additionalInfo: "",
      })),
    };
    return () => resetForm({ values: newValues });
  };

  const onDeleteQuestion = (question) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will permanently delete the question",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteHandler = onDeleteQuestionSuccess(question);

        questionService
          .deleteById(question.id)
          .then(deleteHandler)
          .catch(onDeleteQuestionError);
      }
    });
  };

  const onDeleteQuestionSuccess = (question) => {
    toastr.success("Question deleted", "Success");

    setFormData((prevFormData) => {
      const newState = { ...prevFormData };

      newState.questionsList = newState.questionsList.filter(
        (q) => q.id !== question.id
      );

      return newState;
    });
  };

  const onDeleteQuestionError = (err) => {
    toastr.error("Question was not deleted", "Bad Request", err);
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    const sourceIndex = source.index;

    const destinationIndex = destination.index;

    const updatedQuestions = [...formData.questionsList];

    const movedQuestion = updatedQuestions.splice(sourceIndex, 1)[0];

    updatedQuestions.splice(destinationIndex, 0, movedQuestion);

    const sortedQuestions = updatedQuestions.map((question, index) => ({
      ...question,
      sortOrder: index + 1,
    }));
    setFormData((prevFormData) => ({
      ...prevFormData,
      questionsList: sortedQuestions,
    }));

    const updatePayload = sortedQuestions.map((question) => ({
      id: question.id,
      sortOrder: question.sortOrder,
    }));

    const onUpdateSortOrderSuccess = (response) => {
      toastr.success("update sort order", response);
    };

    const onUpdateSortOrderError = (err) => {
      toastr.error("update sort order error", err);
    };

    questionService
      .updateQuestionSortOrder(updatePayload)
      .then(onUpdateSortOrderSuccess)
      .catch(onUpdateSortOrderError);
  };

  return (
    <React.Fragment>
      <h1 className="text-left">Test Builder</h1>
      <Breadcrumb>
        <Breadcrumb.Item href="#">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item href="#">Games</Breadcrumb.Item>
      </Breadcrumb>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 text-center dragdrop-list">
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Questions</Accordion.Header>
                <Accordion.Body>
                  <DragDropList
                    key={formData.questionsList.length}
                    items={formData.questionsList}
                    onDragEnd={onDragEnd}
                    onEditQuestion={handleEditQuestion}
                    onDeleteQuestion={onDeleteQuestion}
                  />
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
          <div className="col-lg-8">
            <div className="card shadow-lg testbuilder-all-padding">
              <Formik
                enableReinitialize={true}
                initialValues={formData}
                onSubmit={handleSubmit}
                validationSchema={testBuilderSchema}
              >
                {({ values, setFieldValue, resetForm }) => (
                  <Form>
                    <div className="col-9 d-flex justify-content-start mx-auto">
                      <div className="col-12 ">
                        <h1
                          htmlFor="question"
                          className="form-label testbuilder-text-blk text-center"
                        >
                          Test Builder
                        </h1>
                        <h2
                          htmlFor="question"
                          className="form-label testbuilder-text-blk text-center"
                        >
                          Question
                        </h2>
                        <br />
                        <Field
                          as="textarea"
                          name="questionData.question"
                          className="form-control textbuilder-text-area testbuilder-form-shw testbuilder-pd-btm"
                          id="inputQuestion"
                          placeholder="Add a new question"
                        />

                        <div className="col-md-12 mt-0">
                          <FieldArray
                            name="answerData"
                            render={(arrayHelpers) => (
                              <div>
                                <h2
                                  htmlFor="text"
                                  className="form-label testbuilder-text-blk testbuilder-padding text-center"
                                >
                                  Answer Options
                                </h2>
                                <br />
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end"></div>
                                {values.answerData &&
                                values.answerData.length > 0 ? (
                                  values.answerData.map((answerOpt, index) => (
                                    <div key={index}>
                                      <div className="form-group mb-2">
                                        <div className="testbuilder-checkbox-wrapper">
                                          <h4 className="testbuilder-text-blk testbuilder-checkbox_label_wrapper">
                                            Check if this is the correct answer
                                          </h4>
                                          <Field
                                            className="testbuilder-checkbox"
                                            type="checkbox"
                                            name={`answerData.${index}.isCorrect`}
                                            onChange={() =>
                                              onCheckboxChanged(index, values)
                                            }
                                          />
                                        </div>
                                        <div className="d-flex">
                                          <div className="d-block flex-grow-1">
                                            <Field
                                              className="form-control fs-5 testbuilder-form-shw"
                                              placeholder="Enter answer option"
                                              name={`answerData[${index}].text.text`}
                                              value={answerOpt.text.text}
                                              key={index}
                                            />
                                            <div className="testbuilder-pd-top">
                                              {answerOpt.showHelpText && (
                                                <div className="d-block flex-grow-1 testbuilder-pd-top testbuilder-pd-btm-two">
                                                  <h4 className="testbuilder-text-blk">
                                                    Additional Answer Info
                                                  </h4>
                                                  <Field
                                                    className="form-control mt-2 testbuilder-form-shw"
                                                    placeholder="Enter help text"
                                                    name={`answerData.${index}.additionalInfo`}
                                                    value={
                                                      answerOpt.additionalInfo
                                                    }
                                                  />
                                                </div>
                                              )}
                                            </div>
                                            <div className="form-check form-switch">
                                              <label className="toggle-text testbuilder-text-blk">
                                                Toggle help text
                                              </label>
                                              <input
                                                type="checkbox"
                                                className="form-check-input"
                                                role="switch"
                                                onChange={() =>
                                                  setFieldValue(
                                                    `answerData.${index}.showHelpText`,
                                                    !answerOpt.showHelpText
                                                  )
                                                }
                                              />
                                            </div>
                                          </div>
                                          <div className="col-auto ml-5 plus-icon cursor-pointer">
                                            <FontAwesomeIcon
                                              icon={faCirclePlus}
                                              size="2xl"
                                              onClick={() =>
                                                arrayHelpers.insert(index + 1, {
                                                  text: "",
                                                  value: "",
                                                  additionalInfo: "",
                                                  isCorrect: false,
                                                  hasAddInfo: false,
                                                })
                                              }
                                            />

                                            <FontAwesomeIcon
                                              icon={faCircleMinus}
                                              size="2xl"
                                              onClick={() =>
                                                arrayHelpers.remove(index)
                                              }
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="d-flex justify-content-center">
                                    <Button
                                      className="btn btn-outline-dark btn-light my-1"
                                      type="button"
                                      onClick={() =>
                                        arrayHelpers.push({
                                          text: "",
                                          value: "",
                                          additionalInfo: "",
                                          isCorrect: true,
                                          hasAddInfo: false,
                                        })
                                      }
                                    >
                                      Add Answer Options
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          />
                        </div>
                        <div className="d-flex justify-content-between">
                          {isEditMode ? (
                            <div>
                              <Button
                                type="button"
                                className="btn-outline-danger btn-light my-4"
                                onClick={onCancelClicked(
                                  resetForm,
                                  values,
                                  setisEditMode
                                )}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                className="btn btn-outline-success btn-light mx-2 my-4"
                                onClick={() => {
                                  onClickUpdateButton(values);
                                }}
                              >
                                Update
                              </Button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-light my-4"
                                onClick={onNextQClicked(resetForm, values)}
                              >
                                Next Question
                              </button>
                            </div>
                          ) : (
                            <div>
                              <Button
                                type="button"
                                className="btn-outline-danger btn-light mx-2 my-4"
                                onClick={onCancelClicked(
                                  resetForm,
                                  values,
                                  setisEditMode
                                )}
                              >
                                Cancel
                              </Button>

                              <Button
                                type="submit"
                                className="btn-outline-success btn-light mx-2 my-4"
                              >
                                Add
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default TestBuilder;
