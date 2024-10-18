/**
 * Here you can define different backend functions that:
 * 1 - Can be called from the frontend
 * 2 - Can secure data access
 * 3 - Can be called as a trigger
 * 4 - Can define a webhook
 * 5 - Can be called as a scheduler
 * 6 - And more
 *
 * Note: This code will be executed in a secure environment and can perform any operation including database access,
 * API calls, etc.
 *
 * For more information and examples see: https://docs.squid.cloud/docs/development-tools/backend/
 */
import {
  secureDatabase,
  SquidService,
  executable,
  trigger,
  TriggerRequest,
  scheduler,
  webhook,
  WebhookRequest,
  WebhookResponse,
  aiFunction
} from "@squidcloud/backend";
import { CronExpression } from "@squidcloud/client";
import { Todo } from "../../../common/types";

export class ExampleService extends SquidService {
  // TODO: !!!IMPORTANT!!! - Replace this function with your own granular security rules
  @secureDatabase("all", "built_in_db")
  allowAllAccessToBuiltInDb(): boolean {
    return true;
  }

  @executable()
  async cleanTodos(): Promise<void> {
    await this.cleanTodosInternal();
  }

  private async cleanTodosInternal() {
    const todoRefs = await this.squid
      .collection<Todo>("todos")
      .query()
      .eq("done", true)
      .snapshot();

    await this.squid.runInTransaction(async (txId) => {
      for (const todoRef of todoRefs) {
        void todoRef.delete(txId);
      }
    });
  }

  @trigger({
    collection: "todos",
    mutationTypes: ["update"],
  })
  async onUpdateTodo(request: TriggerRequest): Promise<void> {
    const { docBefore, docAfter } = request;
  
    if (
      docBefore.done === docAfter.done &&
      docBefore.title === docAfter.title &&
      docBefore.content === docAfter.content
    ) {
      return;
    }
  
    await this.squid.collection<Todo>("todos").doc(docAfter.__id).update({
      updatedAt: new Date(),
    });
  }
  

  @scheduler({
    cron: CronExpression.EVERY_10_SECONDS
  })
  async cleanTodosOnSchedule(): Promise<void> {
    await this.cleanTodosInternal();
  }

  @webhook("createTodo")
  async createTodo(request: WebhookRequest): Promise<WebhookResponse> {
    const { title, content } = request.queryParams;
    if (!title || !content) {
      return this.createWebhookResponse("Invalid request", 400);
    }

    const id = await this.createTodoInternal(title, content);
    return this.createWebhookResponse(`Todo created: ${id}`, 200);
  }

  private async createTodoInternal(title: string, content: string): Promise<string> {
    const now = new Date();
    const doc = this.squid.collection<Todo>("todos").doc();

    await doc.insert({
      title,
      content,
      createdAt: now,
      updatedAt: now,
      done: false,
    });

    return doc.data.__id;
  }

  @webhook("getTodos")
  async getTodos(): Promise<WebhookResponse> {
    const todos = await this.squid.collection<Todo>("todos").query().dereference().snapshot();
    return this.createWebhookResponse(todos, 200);
  }

  @webhook("getTodoById")
  async getTodoById(request: WebhookRequest): Promise<WebhookResponse> {
    const { id } = request.queryParams;
    
    if (!id) {
      return this.createWebhookResponse("Invalid request: missing ID", 400);
    }

    const todo = await this.squid.collection<Todo>("todos").doc(id).snapshot();

    if (!todo) {
      return this.createWebhookResponse(`Todo with ID ${id} not found`, 404);
    }

    return this.createWebhookResponse(todo, 200);
  }


  @webhook("updateTodo")
  async updateTodo(request: WebhookRequest): Promise<WebhookResponse> {
    const { id, title, content } = request.queryParams;
    
    if (!id) {
      return this.createWebhookResponse("Invalid request: missing ID", 400);
    }

    const updateData: Partial<Pick<Todo, "title" | "content">> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    if (Object.keys(updateData).length > 0) {
      await this.squid.collection<Todo>("todos").doc(id).update(updateData);
      return this.createWebhookResponse(`Todo with ID ${id} updated`, 200);
    } else {
      return this.createWebhookResponse("No fields to update", 400);
    }
  }

  @webhook("toggleTodo")
  async toggleTodo(request: WebhookRequest): Promise<WebhookResponse> {
    const { id, done } = request.queryParams;
    
    if (!id || done === undefined) {
      return this.createWebhookResponse("Invalid request: missing ID or done status", 400);
    }

    await this.squid.collection<Todo>("todos").doc(id).update({ done: done === 'true' });
    return this.createWebhookResponse(`Todo with ID ${id} marked as ${done === 'true' ? 'done' : 'not done'}`, 200);
  }

  @webhook("deleteTodo")
  async deleteTodo(request: WebhookRequest): Promise<WebhookResponse> {
    const { id } = request.queryParams;

    if (!id) {
      return this.createWebhookResponse("Invalid request: missing ID", 400);
    }

    await this.squid.collection<Todo>("todos").doc(id).delete();
    return this.createWebhookResponse(`Todo with ID ${id} deleted`, 200);
  }

  @webhook("createTodoWithAI")
  async createTodoWithAI(request: WebhookRequest): Promise<WebhookResponse> {
    const { task } = request.queryParams;

    if (!task) {
      return this.createWebhookResponse("Invalid request: missing task description", 400);
    }

    const result = await this.squid.executeFunction("createTodosWithAI", task);

    return this.createWebhookResponse(`Todo created with AI: ${result}`, 200);
  }

  @executable()
  async createTodosWithAI(task: string): Promise<void> {
    const assistant = this.squid.ai().assistant();
    const assistantId = await assistant.createAssistant(
      "todoCreator",
      "You are designed to create todo list items based on the specified task. You should create anywhere between 3-5 todos.",
      ["createTodoFromAssistant"],
    );
    const threadId = await assistant.createThread(assistantId);

    await assistant.queryAssistant(
      assistantId,
      threadId,
      `Create some todos for the following task: ${task}`,
    );

    await assistant.deleteThread(threadId);
    await assistant.deleteAssistant(assistantId);
  }

  @aiFunction("This function creates a new item in a todo list", [
    {
      name: "title",
      description: "The title of the todo item",
      type: "string",
      required: true,
    },
    {
      name: "content",
      description: "The content of the todo item",
      type: "string",
      required: true,
    },
  ])
  async createTodoFromAssistant(params: {
    title: string;
    content: string;
  }): Promise<void> {
    const { title, content } = params;
    await this.createTodoInternal(title, content);
  }
}
