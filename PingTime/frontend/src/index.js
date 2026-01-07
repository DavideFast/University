import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import LineChart from "./LineChart/Grafico.js";
import App2 from "./Grafico1/Grafico.js";
import App3 from "./Grafico2/Grafico.js";
import reportWebVitals from "./reportWebVitals";

import App5 from "./ForceDistanceSimulatingTheoreticDistance/Grafico.js";
import GraphVisualization from "./Node-Link/Grafico.js";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <div>
    <App />
    <br />
    <br />
    <hr />
    <App2 />
    <br />
    <br />
    <br />
    <br />
    <hr />
    <LineChart />
    <br />
    <br />
    <br />
    <br />
    <hr />
    <App5 />
  </div>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
