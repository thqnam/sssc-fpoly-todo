import "./App.css";
import "@squidcloud/ui/styles/index.css";

import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import CreateWithAI from "./components/CreateWithAI";
import { Todo } from "../../common/types";
import { useCollection, useQuery, useSquid } from '@squidcloud/react';

function App() {
  const squid = useSquid();
  const collection = useCollection<Todo>('todos');
  // Thay thế `const data = []` bằng dòng sau:
  const { data } = useQuery(collection.query().dereference());

  const handleCreate = async (data: Pick<Todo, "title" | "content">) => {
    const { title, content } = data;
    const now = new Date();

    await collection.doc().insert({
      title,
      content,
      createdAt: now,
      updatedAt: now,
      done: false,
    });
  };

  const handleFixIt = async (id: string, data: Pick<Todo, "title" | "content">) => {
    const { title, content } = data;
    const updateData: Partial<Pick<Todo, "title" | "content">> = {};

    if (title) {
      updateData.title = title;
    }
    
    if (content) {
      updateData.content = content;
    }

    if (Object.keys(updateData).length > 0) {
      await collection.doc(id).update(updateData);
    }
  };
  

  const handleToggle = async (id: string, done: boolean) => {
    await collection.doc(id).update({
      done,
    });
  };

  const handleDelete = async (id: string) => {
    await collection.doc(id).delete();
  };

  const handleCleanTodos = async () => {
    await squid.executeFunction('cleanTodos');
  }

  const handleCreateWithAI = async (data: { task: string }) => {
    const { task } = data;
    await squid.executeFunction("createTodosWithAI", task);
  };

  return (
    <>
      <div>
        <a href="https://sfc-vnd.netlify.app/" target="_blank">
          <img src="https://i.ibb.co/vxRnDKx/SFC-VND.jpg" className="logo" alt="SFC - VND logo" title="SFC - VND Logo" width="200" height="200"/>
        </a>
      </div>
      <h1>SSSC - FPOLY - TodoApp online</h1>
      <div className="app-buttons">
        <AddTodo onCreate={handleCreate} />
        <button className="sq-btn sq-btn--secondary" onClick={handleCleanTodos}>
          Clean Todos
        </button>
        <CreateWithAI onCreateWithAI={handleCreateWithAI} />
      </div>

      <TodoList todos={data} onDelete={handleDelete} onToggle={handleToggle} onFixIt={handleFixIt}/>
    </>
  );
}

export default App;
