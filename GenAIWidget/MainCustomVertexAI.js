var ajaxCall = (key, url, prompt) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: "POST",
      dataType: "json",
      data: JSON.stringify({
        model: "text-bison",
        prompt: prompt,
        max_tokens: 1024,
        n: 1,
        temperature: 0.5,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
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

const url = "https://us-central1-aiplatform.googleapis.com/v1/projects";

(function () {
  const template = document.createElement("template");
  template.innerHTML = `
        <style>
        </style>
        <div id="root" style="width: 100%; height: 100%;">
        </div>
      `;
  class MainWebComponent extends HTMLElement {
    async post(apiKey, endpoint, prompt) {
      const { response } = await ajaxCall(
        apiKey,
        `${url}/${endpoint}/locations/us-central1/`,
        prompt
      );
      //console.log(response.choices[0].text);
      return response.content[0].text;
    }
  }
  customElements.define("custom-widget", MainWebComponent);
})();
