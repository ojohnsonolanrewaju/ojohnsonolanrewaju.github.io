const loadGoogleApiClient = () => {
  return new Promise((resolve, reject) => {
    // Dynamically load the Google API client library
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google API Client library"));
    document.head.appendChild(script);
  });
};

const initializeAuth = async () => {
  await loadGoogleApiClient();

  return new Promise((resolve, reject) => {
    gapi.load("client:auth2", async () => {
      try {
        await gapi.client.init({
          clientId: "1036848270469-1nj9do9m6a3vgoab8ni7cqg7krqcs5po.apps.googleusercontent.com.apps.googleusercontent.com", // Replace with your OAuth Client ID
          scope: "https://www.googleapis.com/auth/cloud-platform",
        });

        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
          await authInstance.signIn();
        }
        const currentUser = authInstance.currentUser.get();
        const accessToken = currentUser.getAuthResponse().access_token;
        resolve(accessToken);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const geminiCall = (accessToken, prompt) => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString(); // Add timestamp for variability
    const dynamicPrompt = `${prompt}\n\nTimestamp: ${timestamp}`; // Combine prompt with dynamic content

    console.log("Sending Prompt to Gemini API:", dynamicPrompt); // Log prompt before sending

    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [dynamicPrompt],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT"],
        temperature: 1,
        maxOutputTokens: 8192,
        topP: 0.95,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
      ],
    };

    const PROJECT_ID = "dgcp-sandbox-sapanalytics";
    const LOCATION_ID = "us-central1";
    const API_ENDPOINT = "us-central1-aiplatform.googleapis.com";
    const MODEL_ID = "gemini-2.0-flash-exp";
    const GENERATE_CONTENT_API = "streamGenerateContent";

    $.ajax({
      url: `https://${API_ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:${GENERATE_CONTENT_API}`,
      type: "POST",
      dataType: "json",
      data: JSON.stringify(requestPayload),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      success: function (response) {
        console.log("Full API Response Received:", response); // Debug the response

        if (!response || !response.contents || !response.contents[0].parts) {
          console.error("Unexpected API response format:", response);
          throw new Error("Unexpected API response format.");
        }

        const responseText = response.contents[0].parts.join(" ");
        resolve(responseText.trim());
      },
      error: function (xhr, status, error) {
        const err = new Error(`XHR Error: ${error}`);
        err.status = xhr.status;
        err.response = xhr.responseText;
        reject(err);
      },
    });
  });
};

(async function () {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      #root {
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: Arial, sans-serif;
        color: #333;
        height: 100%;
        padding: 10px;
        text-align: center;
        box-sizing: border-box;
      }
    </style>
    <div id="root">Loading...</div>
  `;

  class MainWebComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    async post(prompt) {
      const rootElement = this.shadowRoot.getElementById("root");
      try {
        rootElement.textContent = "Processing...";
        console.log("Received Prompt from SAC:", prompt); // Debug prompt received from SAC

        // Authenticate and get Access Token
        const accessToken = await initializeAuth();
        const response = await geminiCall(accessToken, prompt);

        rootElement.textContent = response || "No valid response received.";
        return response;
      } catch (error) {
        console.error("Error during API call:", error);
        let errorMessage = "Error occurred while processing the request.";
        if (error.response) {
          errorMessage = `Error: ${error.response}`;
        }
        rootElement.textContent = errorMessage;
        throw error;
      }
    }

    connectedCallback() {
      this.shadowRoot.getElementById("root").textContent = "Custom Gemini Widget Ready.";
    }
  }

  customElements.define("custom-widget", MainWebComponent);
})();
