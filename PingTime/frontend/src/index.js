import ReactDOM from "react-dom/client";
import "./index.css";

import CardsKPI from "./cardsKPI/App.js";
import HeatMap from "./HeatMap/Grafico.js";
import LineChart from "./LineChart/Grafico.js";
import RadialCharts from "./RadialChart/Grafico.js";

import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <div>
    <CardsKPI />
    <br />
    <br />
    <hr />
    <HeatMap />
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
    <RadialCharts />
  </div>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
