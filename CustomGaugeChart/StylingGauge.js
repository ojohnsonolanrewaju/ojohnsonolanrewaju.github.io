(function () {
  let template = document.createElement("template");
  template.innerHTML = `
      <form id="form">
        <fieldset>
          <legend>Chart Properties</legend>
          <table>
            <tr>
              <td>Dataset</td>
              <td><input id="bps_dataset" type="text" size="40" maxlength="100"></td>
            </tr>
            <tr>
              <td>Measure</td>
              <td><input id="bps_measure" type="text" size="40" maxlength="100"></td>
            </tr>
            <tr>
              <td>Filters</td>
              <td><input id="bps_filters" type="text" size="40" maxlength="100"></td>
            </tr>
            <tr>
              <td>Minimum Value</td>
              <td><input id="bps_minValue" type="number" min="0"></td>
            </tr>
            <tr>
              <td>Maximum Value</td>
              <td><input id="bps_maxValue" type="number" min="0"></td>
            </tr>
            <tr>
              <td>Target Value</td>
              <td><input id="bps_targetValue" type="number" min="0"></td>
            </tr>
          </table>
          <input type="submit" style="display:none;">
        </fieldset>
      </form>
    `;

  class GaugeChartBps extends HTMLElement {
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

      const dataset = this._shadowRoot.getElementById("bps_dataset").value;
      const measure = this._shadowRoot.getElementById("bps_measure").value;
      const filters = this._shadowRoot.getElementById("bps_filters").value;
      const minValue = parseInt(
        this._shadowRoot.getElementById("bps_minValue").value
      );
      const maxValue = parseInt(
        this._shadowRoot.getElementById("bps_maxValue").value
      );
      const targetValue = parseInt(
        this._shadowRoot.getElementById("bps_targetValue").value
      );

      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: {
            properties: {
              dataset,
              measure,
              filters,
              minValue,
              maxValue,
              targetValue,
            },
          },
        })
      );
    }

    setProperties({
      dataset,
      measure,
      filters,
      minValue,
      maxValue,
      targetValue,
    }) {
      this._shadowRoot.getElementById("bps_dataset").value = dataset || "";
      this._shadowRoot.getElementById("bps_measure").value = measure || "";
      this._shadowRoot.getElementById("bps_filters").value = filters || "";
      this._shadowRoot.getElementById("bps_minValue").value = minValue || "";
      this._shadowRoot.getElementById("bps_maxValue").value = maxValue || "";
      this._shadowRoot.getElementById("bps_targetValue").value =
        targetValue || "";
    }
  }

  customElements.define("com-example-gaugechart-bps", GaugeChartBps);
})();
