// MainCustomVertexAI.js

// Function for making an AJAX call to Vertex AI API
const generateText = async (
  apiKey,
  projectId,
  modelId,
  prompt,
  temperature,
  maxOutputTokens
) => {
  try {
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${modelId}:serverStreamingPredict`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
              // Add other parameters as needed
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed with status: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.outputs[0].structVal.content.stringVal[0];
    return generatedText;
  } catch (error) {
    console.error("Error generating text:", error);
    throw error;
  }
};

// Define the custom web component
class CustomVertexAIWidget extends HTMLElement {
  async generateText(
    apiKey,
    projectId,
    modelId,
    prompt,
    temperature,
    maxOutputTokens
  ) {
    try {
      const generatedText = await generateText(
        apiKey,
        projectId,
        modelId,
        prompt,
        temperature,
        maxOutputTokens
      );
      return generatedText;
    } catch (error) {
      // Handle error or return a default value
      console.error("Error in generateText method:", error);
      return "Error generating text";
    }
  }
}

// Register the custom web component
customElements.define("custom-vertex-ai-widget", CustomVertexAIWidget);
