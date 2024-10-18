# Create a to-do app with Squid

Welcome to Squid Cloud! This project contains a to-do application in which you will add Squid functionality. The steps to complete the project are displayed in the frontend, so the first step is to get the frontend up and running locally.

## Prerequisites

For this project you will need:

- NodeJS v18 or later.
- A Squid Cloud account and a Squid application. To sign up for Squid, go to [Squid Cloud Console](https://console.squid.cloud). Once signed up, you can create an application.

## Environment configuration

### Setting up your `.env` file

After cloning this project, go to the [Squid Cloud Console](https://console.squid.cloud), create an application (if haven't done so already) and click the **Create .env file** button under **Backend project**. This provides you with the command to create the `.env` file required for this template to work and run.

Change to the backend directory, and install the required dependencies:

```bash
cd backend
npm install
```

Run the initialization command you copied from the console. The command has the following format:

```bash
npx @squidcloud/cli init-env --appId YOUR_APP_ID --apiKey YOUR_API_KEY --environmentId YOUR_ENVIRONMENT_ID --squidDeveloperId YOUR_SQUID_DEVELOPER_ID --region YOUR_REGION
```

## Running the application

### Starting the local backend server

To launch the local backend server of your Squid application, run the following command from the `backend` directory:

```bash
npm run start
```

You'll see output similar to the following, indicating that your server is up and running:

```bash
[Nest] 68047  - 03/15/2024, 7:55:23 PM     LOG [NestApplication] Nest application successfully started +1ms
```

### Launching the frontend server

Open a second terminal window. You should now have two terminal windows open: one running the local backend server, and one in which you will run the frontend. Initialize the frontend server by running the following commands:

```bash
cd frontend
npm install
npm run setup-env
```

To launch the frontend of your Squid application, run the following command from the `front` directory:

```bash
npm run dev
```

Verify that Vite server has started, providing URLs to access your app:

```bash
  VITE v5.1.6  ready in 149 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```
