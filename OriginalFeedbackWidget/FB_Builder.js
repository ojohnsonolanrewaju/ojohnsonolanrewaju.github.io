(function () {
  let template = document.createElement("template");
  template.innerHTML = `
		<form id="form">
			<fieldset>
				<legend>Set URL</legend>
				<table>
					<tr>
						<td>URL</td>
						<td><input id="urlinput" type="text" size="60" maxlength="255"></td>
					</tr>
				</table>
				<input type="submit" style="display:none;">
			</fieldset>
		</form>
		<style>
		:host {
			display: block;
			padding: 1em 1em 1em 1em;
		}
		</style>
	`;

  class FeedbackBuilderPanel extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._shadowRoot
        .getElementById("form")
        .addEventListener("submit", this._submit.bind(this));
    }

    _submit(e) {
      e.preventDefault();
      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              url: this.url,
            },
          },
        })
      );
    }

    set url(newUrl) {
      this._shadowRoot.getElementById("urlinput").value = newUrl;
    }

    get opacity() {
      return this._shadowRoot.getElementById("urlinput").value;
    }
  }

  customElements.define("sac-in-app-feedback-2-builder", FeedbackBuilderPanel);
})();
