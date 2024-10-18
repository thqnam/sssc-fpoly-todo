import { useState } from "react";
import Modal from "react-modal";
import { useForm } from "react-hook-form";

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

Modal.setAppElement("#root");

type FormValues = {
  task: string;
};

type PropTypes = {
  onCreateWithAI: (data: FormValues) => Promise<void>;
};

const CreateWithAI = ({ onCreateWithAI }: PropTypes) => {
  const [modalIsOpen, setIsOpen] = useState(false);
  const { handleSubmit, register, reset } = useForm<FormValues>();

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    reset();
  }

  const [creating, setCreating] = useState(false);

  const onSubmit = async (data: FormValues) => {
    closeModal();
    setCreating(true);
    await onCreateWithAI(data);
    setCreating(false);
  };

  return (
    <>
      <button
        className="sq-btn sq-btn--secondary"
        onClick={openModal}
        disabled={creating}
      >
        {creating ? "Creating..." : "Create With AI"}
      </button>
      <Modal
        className="sq-modal__content"
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
      >
        <form
          className="sq-card p-8 flex flex-col gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="sq-input" style={{ width: "100%" }}>
            <label>Task</label>
            <input {...register("task")} />
          </div>
          <div className="create-modal__buttons">
            <button className="sq-btn" type="submit">
              Add
            </button>
            <button className="sq-btn sq-btn--outline" onClick={closeModal}>
              Close
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CreateWithAI;
