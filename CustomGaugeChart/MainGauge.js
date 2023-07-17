(function () {
  let template = document.createElement("template");
  template.innerHTML = `
      <style>
        :host {
		  border-radius: 10px;
		  border-width: 2px;
		  border-color: black;
		  border-style: solid;
          display: block;
        }
        
        body {
            background: #fff;
          }
          
          .metric {
            padding: 10%;
          }
          
          .metric svg {
            max-width: 100%;
          }
          
          .metric path {
            stroke-width: 75;
            stroke: #ecf0f1;
            fill: none;
          }
          
          .metric text {
            font-family: "Lato", "Helvetica Neue", Helvetica, Arial, sans-serif;
          }
          
          .metric.participation path.data-arc {
            stroke: #27ae60;
          }
          
          .metric.participation text {
            fill: #27ae60;
          }
        /* Add your custom styles for the Gauge chart here */
      </style>
      
      <div id="chartContainer"></div>
    `;

  class GaugeChart extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));

      this.$chartContainer = this._shadowRoot.getElementById("chartContainer");

      this._dataset = null;
      this._measure = "";
      this._filters = "";
      this._minValue = 0;
      this._maxValue = 100;
      this._targetValue = 50;
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      if ("dataset" in changedProperties) {
        this._dataset = changedProperties["dataset"];
      }
      if ("measure" in changedProperties) {
        this._measure = changedProperties["measure"];
      }
      if ("filters" in changedProperties) {
        this._filters = changedProperties["filters"];
      }
      if ("minValue" in changedProperties) {
        this._minValue = changedProperties["minValue"];
      }
      if ("maxValue" in changedProperties) {
        this._maxValue = changedProperties["maxValue"];
      }
      if ("targetValue" in changedProperties) {
        this._targetValue = changedProperties["targetValue"];
      }
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      if (
        "dataset" in changedProperties ||
        "measure" in changedProperties ||
        "filters" in changedProperties ||
        "minValue" in changedProperties ||
        "maxValue" in changedProperties ||
        "targetValue" in changedProperties
      ) {
        this.renderChart();
      }
    }

    connectedCallback() {
      this.renderChart();
    }

    renderChart() {
      // Retrieve the dataset, measure, filters, minValue, maxValue, and targetValue properties
      const dataset = this._dataset;
      const measure = this._measure;
      const filters = this._filters;
      const minValue = this._minValue;
      const maxValue = this._maxValue;
      const targetValue = this._targetValue;

      // Check if all required properties are available
      if (!dataset || !measure) {
        this.$chartContainer.innerHTML =
          "<p>Please provide a dataset and measure for the chart.</p>";
        return;
      }

      // Apply filters to the dataset if provided
      let filteredData = dataset;
      if (filters) {
        filteredData = applyFilters(dataset, filters);
      }

      // Extract the values for the measure from the filtered dataset
      const measureValues = extractMeasureValues(filteredData, measure);

      // Calculate the percentage based on the measure values and the minValue and maxValue
      const percentage = calculatePercentage(measureValues, minValue, maxValue);

      // Create the chart configuration
      const chartConfig = {
        type: "gauge",
        data: {
          datasets: [
            {
              data: [percentage],
              backgroundColor: ["rgba(54, 162, 235, 0.8)"],
            },
          ],
        },
        options: {
          needle: {
            radiusPercentage: 2,
            widthPercentage: 3,
            lengthPercentage: 80,
            color: "rgba(0, 0, 0, 1)",
          },
          valueLabel: {
            formatter: (value) => `${value}%`,
          },
          minValue,
          maxValue,
          targetValue,
        },
      };

      // Render the chart using the charting library (Chart.js)
      const chartCanvas = document.createElement("canvas");
      this.$chartContainer.innerHTML = "";
      this.$chartContainer.appendChild(chartCanvas);
      new Chart(chartCanvas, chartConfig);
      // Render the Gauge chart based on the dataset, measure, filters, minValue, maxValue, and targetValue properties
      // Use the provided charting library or custom implementation to create the chart visualization
      // Update the content of the chartContainer element in the shadow DOM
    }
  }

  customElements.define("com-example-gaugechart", GaugeChart);
})();
