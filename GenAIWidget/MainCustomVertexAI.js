const vertexAIAPIUrl = "https://us-central1-aiplatform.googleapis.com/v1"; // Update with your Vertex AI API URL

var vertexAIAjaxCall = (
  apiKey,
  projectId,
  modelId,
  prompt,
  temperature,
  maxOutputTokens
) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: `${vertexAIAPIUrl}/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:serverStreamingPredict`,
      type: "POST",
      dataType: "json",
      data: JSON.stringify({
        inputs: [
          {
            struct_val: {
              prompt: {
                string_val: [prompt],
              },
            },
          },
        ],
        parameters: {
          struct_val: {
            temperature: { float_val: temperature },
            maxOutputTokens: { int_val: maxOutputTokens },
            // Add other parameters here if needed
          },
        },
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      crossDomain: true,
      success: function (response, status, xhr) {
        resolve({ response, status, xhr });
      },
      error: function (xhr, status, error) {
        const err = new Error("xhr error");
        err.status = xhr.status;
        reject(err);
      },
    });
  });
};

(function () {
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      /* Add your custom styles here */
    </style>
    <div id="root" style="width: 100%; height: 100%;">
    </div>
  `;

  class MainCustomVertexAI extends HTMLElement {
    async generateText(apiKey, projectId, modelId, prompt, maxOutputTokens) {
      const temperature = 0.5; // Hardcoded temperature parameter
      const { response } = await vertexAIAjaxCall(
        apiKey,
        projectId,
        modelId,
        prompt,
        temperature,
        maxOutputTokens
      );
      return response.outputs[0].structVal.content.stringVal[0];
    }
  }

  customElements.define("custom-vertex-ai-widget", MainCustomVertexAI);
})();
