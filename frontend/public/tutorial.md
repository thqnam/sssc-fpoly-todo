## Creating a To-do

Welcome to your first Squid project! Through a few simple steps, you will add functionality to a full-stack to-do application and learn about some of the features of Squid.

Right now, the **Add Todo** button displays a modal for adding a new to-do to the list, but saving a to-do does not produce any effect. Let's add some code that writes new to-do tasks to Squid's [built-in database](https://docs.squid.cloud/docs/integrations/database/built-in) and also listens for updates to the to-dos.

1. Open the project in the IDE of your choice.

2. Squid provides [React hooks](https://docs.squid.cloud/docs/development-tools/react-sdk#hooks) to easily subscribe to data changes so the view always stays up-to-date. In the `App.tsx` file of the frontend, add the following code to implement the `useQuery` hook so the latest to-dos always appear:

```tsx
import { useCollection, useQuery } from "@squidcloud/react"

function App() {
  const collection = useCollection<Todo>('todos');
  // Replace `const data = []` with the following line:
  const { data } = useQuery(collection.query().dereference());

  ...
}
```

3. To create a new to-do, we use the `insert` method of the [Squid Client SDK](https://docs.squid.cloud/docs/development-tools/client-sdk/mutations#insert). In `App.tsx`, update the `handleCreate` function with the following code:

```typescript
function App() {
  ...

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
  }

  ...
};
```

Now test out the **Add Todo** button! Notice as you add new to-dos, they appear in the view in real-time. To learn how to update a to-do, click **Next**.

## Updating a To-do

1. To update the status of an existing to-do, we use the `update` method of the [Squid Client SDK](https://docs.squid.cloud/docs/development-tools/client-sdk/mutations#update). In `App.tsx`, update the `handleToggle` function with the following code:

```tsx
function App() {
  ...

  const handleToggle = async (id: string, done: boolean) => {
    await collection.doc(id).update({
      done,
      updatedAt: new Date()
    });
  };

  ...
}
```

2. To delete an existing to-do, use the [`delete`](https://docs.squid.cloud/docs/development-tools/client-sdk/mutations#delete) method. In `App.tsx`, update the `handleDelete` method with the following code:

```tsx
function App() {
  ...

  const handleDelete = async (id: string) => {
    await collection.doc(id).delete();
  };

  ...
}
```

Try updating and deleting to-dos in the app to see these features in action. To add some backend functionality to the app, click **Next**.

## Creating an Executable

To access server-side functionality from the client, use [Squid Executables](https://docs.squid.cloud/docs/development-tools/backend/executables). Executables allow you to provide a client with limited access to backend functionality, ensuring the client can only take the actions you permit.

Let's add an Executable that cleans up the to-do list by querying all of the to-dos that are marked as "done", and then deleting them from the database.

1. In the `backend/src/service/example-service.ts` file, update the code to include the following:

```typescript
import {
  secureDatabase,
  SquidService,
  executable
} from "@squidcloud/backend";
...

export class ExampleService extends SquidService {
  ...

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
}
```

2. To call the Executable from the client, use the Squid Client SDK's `executeFunction` method. Inside of `App.tsx` in the frontend, update the functionality to include the following:

```tsx
import { useCollection, useQuery, useSquid } from '@squidcloud/react';
...

function App() {
  const squid = useSquid();

  ...

  const handleCleanTodos = async () => {
    await squid.executeFunction('cleanTodos');
  }

  ...
}
```

Test the Executable by checking off some to-dos, and then clicking **Clean Todos**. Notice that the checked to-dos disappear from the view.

To learn how to execute functions in response to database changes, click **Next**.

## Adding a Trigger

Squid's [Trigger](https://docs.squid.cloud/docs/development-tools/backend/triggers) functionality executes a given function in response to a change in a database. This feature works with any database connected to Squid, allowing you to extend the functionality of your data source and easily automate tasks.

Let's implement a trigger that runs when a change is made to any to-do, and then updates the value of `lastUpdated` if the value of `done` has changed.

1. Move the functionality that indicates when a to-do was last updated from the client to the backend. In the frontend's `App.tsx` file, remove `updatedAt: new Date()`:

```tsx
function App() {
  ...

  const handleToggle = async (id: string, done: boolean) => {
    await collection.doc(id).update({
      done,
    });
  };

  ...
}
```

2. In the backend's `example-service.ts` file, update the code to include the following:

```typescript
import {
  secureDatabase,
  SquidService,
  executable,
  trigger,
  TriggerRequest
} from "@squidcloud/backend";
...

export class ExampleService extends SquidService {
  ...

  @trigger({
    collection: "todos",
    mutationTypes: ["update"],
  })
  async onUpdateTodo(request: TriggerRequest): Promise<void> {
    const { docBefore, docAfter } = request;
    if (docBefore.done === docAfter.done) return;

    await this.squid.collection<Todo>("todos").doc(docAfter.__id).update({
      updatedAt: new Date(),
    });
  }

}
```

Now whenever a to-do is updated, the date is automatically updated from the backend! Triggers are a great way to take actions that you wouldn't want to make from the client because they are resource-intensive or involve accessing or changing data that the client shouldn't have access to. To test this feature, check or uncheck an existing to-do and notice that the last updated value changes.

To add a Scheduler that periodically runs to clean up the to-dos for us, click **Next**.

## Adding a Scheduler

A [Scheduler](https://docs.squid.cloud/docs/development-tools/backend/schedulers) is a type of Squid decorator that sets a function to be executed at regular intervals.

1. To add a Scheduler that automatically cleans up completed to-dos, update the backend code in `backend/src/service/example-service.ts` to include the following:

```typescript
import {
  secureDatabase,
  SquidService,
  executable,
  trigger,
  TriggerRequest,
  scheduler
} from "@squidcloud/backend";
import { CronExpression } from "@squidcloud/client";
...

export class ExampleService extends SquidService {
  ...

  @scheduler({
    cron: CronExpression.EVERY_10_SECONDS
  })
  async cleanTodosOnSchedule(): Promise<void> {
    await this.cleanTodosInternal();
  }
}
```

2. Notice that this Scheduler calls the same `cleanTodosInternal()` function that is called by the executable. In this case, the Scheduler is set to be called every ten seconds, so the to-dos will be checked and deleted at that interval. To test this functionality, create and check off some to-dos in the app. Within ten seconds, the completed to-dos disappear!

To add a Webhook that creates a new to-do, click **Next**.

## Adding a Webhook

A [Webhook](https://docs.squid.cloud/docs/development-tools/backend/webhooks) is a type of event-driven architecture that allows one web application to communicate with another. In order to integrate your Squid project with external services, sometimes those services will communicate using Webhooks. For example, a payment service might provide webhooks to inform you about events like generating invoices and paying balances.

1. In the `example-service.ts` file of the backend, update the code to include the following:

```typescript
import {
  secureDatabase,
  SquidService,
  executable,
  trigger,
  TriggerRequest,
  scheduler,
  webhook,
  WebhookRequest,
  WebhookResponse
} from "@squidcloud/backend";
...

export class ExampleService extends SquidService {
  ...

  @webhook("createTodo")
  async createTodo(request: WebhookRequest): Promise<WebhookResponse> {
    const { title, content } = request.queryParams;
    if (!title || !content) {
      return this.createWebhookResponse("Invalid request", 400);
    }

    const id = await this.createTodoInternal(title, content)
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
}
```

2. Upon saving the file, in the output of the locally running backend, a log appears with a format similar to the following:

```bash
Webhook URL for createTodo: https://{appId}-dev-{developerId}.us-east-1.aws.squid.cloud/webhooks/createTodo
```

Copy your version of this URL from the terminal logs into a new browser window. Append the following query parameters to the URL, and then press enter:

```typescript
?title=Test%20TODO&content=Test%20Content
```

Notice that a new to-do appears in the app. You can change the title and content of these query parameters to add different to-dos to the app.

To add an AI assistant that automatically creates a list of to-dos based on a provided task, click **Next**.

## Adding AI

[Squid AI Assistant](https://docs.squid.cloud/docs/ai/squid-ai-assistant) lets you manage AI assistant instances, conversation threads, and context files to create AI workflows, automate tasks, or build a unique AI experience for users. The AI Assistant is one of many [AI solutions](https://docs.squid.cloud/docs/ai/) offered by Squid.

1. In `example-service.ts` update the code to include the following functionality:

```typescript
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
...

export class ExampleService extends SquidService {
  ...

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
}
```

2. In the preceeding code, we pass the assistant a `createTodoFromAssistant` function and some instructions on when the AI should call this function. In `example-service.ts`, update the code to define the `createTodoFromAssistant` function using the same `createTodoInternal` helper we defined to use with the webhook:

```typescript
export class ExampleService extends SquidService {
  ...

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
```

3. In the frontend's `App.tsx` file, update the code to call the newly defined Executable function from inside `handleCreateWithAI`:

```tsx
function App() {
  ...

  const handleCreateWithAI = async (data: { task: string }) => {
    const { task } = data;
    await squid.executeFunction("createTodosWithAI", task);
  };

  ...
}
```

To test this functionality, click **Create with AI** and provide a task description like "Plan a vacation". Notice that multiple new to-dos are created for the steps needed to complete the task.

To finish up your first Squid project, click **Next**.

## Congratulations!

Nice work! You just added multiple new features to a full-stack application in minutes. Here's a summary of the Squid features you used:

- Squid's [Built-in database integration](https://bit.ly/44f3Zyt?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding): Squid integrates with any database, but we also provide a built-in NoSQL database with every project to get up and running quickly.
- Squid's [React SDK hooks](https://bit.ly/squid-hooks?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding): Wrappers for features of the Squid Client SDK for easy implementation in React apps. Squid also provides an [Angular SDK](https://bit.ly/squid-ang?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding) to easily integrate Squid in your Angular apps.
- [Squid Executables](https://bit.ly/squid-executables?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding): Used for accessing server-side functionality from a client.
- [Squid Schedulers](https://bit.ly/squid-cron?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding): Run Cron Jobs from the Squid backend.
- [Webhooks](https://bit.ly/squid-webhooks?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding): Trigger functionality when a URL is called. Webhooks are primarily used to facilitate communication with external services.
- [Squid AI Assistant](https://bit.ly/squid-ai-assistant?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding): Create unique AI experiences for clients, including the ability to trigger AI functions based on client queries.

There are plenty more features of Squid to explore, so [check out our tutorials](https://bit.ly/squid-tutorials?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding) for more inspiration and step-by-step instructions, [view the docs on integrations](https://bit.ly/3sgnwzT?utm_source=onboarding&utm_medium=todo-app&utm_campaign=onboarding) to find out how to integrate your favorite database or service with Squid, or [surf our YouTube channel](https://bit.ly/squid-yt) for tutorials and demos.

To chat with the Squid Crew and other Squid developers, [join our Discord server](https://bit.ly/squid-HELP).
