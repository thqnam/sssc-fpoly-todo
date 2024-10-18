import dayjs from "dayjs";
import "./TodoCard.scss";
import { Todo } from "../../../common/types";
import { useState } from "react";
import Modal from "react-modal";
import { useForm } from "react-hook-form";

import TrashIcon from "@squidcloud/ui/icons/trash.svg";

Modal.setAppElement("#root");

type FormValues = Pick<Todo, "title" | "content">;

type PropTypes = {
  todo: Todo;
  onDelete: (id: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onFixIt: (id: string, data: FormValues) => void;
};

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
  },
};

const TodoCard = ({ todo, onDelete, onToggle, onFixIt }: PropTypes) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const { handleSubmit, register, reset } = useForm<FormValues>();

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    reset();
  }
  const { __id, title, content, createdAt, updatedAt, done } = todo;

  return (
    <div
      className={`sq-card p-4 sq-card--elevation2 todo-card ${done ? "done" : ""}`}
    >
      <div className="todo-card__content">
        <h6>{title}</h6>
        <span>{content}</span>
        <span className="todo-card__created">
          Created At: {dayjs(createdAt).format("MMM DD h:mm:ssa")}
        </span>
        <span className="todo-card__updated">
          Updated At: {dayjs(updatedAt).format("MMM DD h:mm:ssa")}
        </span>
      </div>
      <div className="todo-card__buttons">
        <input
          type="checkbox"
          checked={done}
          onChange={() => onToggle(__id, !done)}
        />
        <button onClick={() => onDelete(__id)}>
          <img src={TrashIcon} width={32} className="sq-icon sq-icon--gray" />
        </button>
      </div>
      <button className="sq-btn" onClick={openModal}>
        Fix Todo
      </button>
      <Modal
        className="sq-modal__content"
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <form
          className="sq-card p-8 flex flex-col gap-6"
          onSubmit={handleSubmit(async (data) => {
            onFixIt(__id, data);
            closeModal();
          })}
        >
          <div className="sq-input">
            <label> Title</label>
            <input {...register("title")} />
          </div>
          <div className="sq-input">
            <label>Content</label>
            <textarea rows={5} {...register("content")} />
          </div>
          <div className="create-modal__buttons">
            <button className="sq-btn" type="submit">
              Fix It
            </button>
            <button className="sq-btn sq-btn--outline" onClick={closeModal}>
              Close
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TodoCard;
