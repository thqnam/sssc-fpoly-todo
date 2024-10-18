import TodoCard from "./TodoCard";
import "./TodoList.scss";
import { Todo } from "../../../common/types";

type FormValues = Pick<Todo, "title" | "content">;

type PropTypes = {
  todos: Array<Todo>;
  onDelete: (id: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onFixIt: (id: string, data: FormValues) => void;
};

const TodoList = ({ todos, onDelete, onToggle, onFixIt }: PropTypes) => {
  return (
    <div className="todo-list">
      <div className="todo-list__column">
        {todos.map((todo) => (
          <TodoCard
            key={todo.__id}
            todo={todo}
            onDelete={onDelete}
            onToggle={onToggle}
            onFixIt={onFixIt}
          />
        ))}
      </div>
    </div>
  );
};

export default TodoList;
