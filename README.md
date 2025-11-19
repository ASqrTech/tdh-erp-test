<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1L2nW2Gpe8j_CggGuhCoqPXNSC6q0tGwb

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in a `.env` file to your Gemini API key.
3. Run the app in development mode:
   `npm run dev`

This will start a development server, usually on `http://localhost:3000`.

## Previewing the production build

You can also build the application for production and preview it locally.

1. Build the app:
   `npm run build`
2. Preview the app:
   `npm run preview`

This will start a local server to preview the production build on `http://localhost:3000`.
