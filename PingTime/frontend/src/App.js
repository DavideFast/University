import logo from "./logo.svg";
import "./App.css";
import * as d3 from "d3";
import { useEffect } from "react";
import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function App() {
  const [periodo, setPeriodo] = React.useState();
  const [spazi, setSpazi] = React.useState(10);
  const [assenze, setAssenze] = React.useState(8);
  const [variazioni, setVariazioni] = React.useState(8);
  const [percentualeRiempimento, setPercentualeRiempimento] = React.useState(6);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3>PingTime - Let's play with us</h3>
      </header>
      <h1>TENNIS TAVOLO 2.0</h1>

      <br />
      <br />
      <br />
      <br />
      <div className="container">
        <div className="container-div">
          <h3>SPAZI LIBERI</h3>
          <h1>{spazi}</h1>
        </div>
        <div className="container-div">
          <h3>ASSENZE</h3>
          <h1>{assenze}</h1>
        </div>
        <div className="container-div">
          <h3>VARIAZIONI</h3>
          <h1>{variazioni}</h1>
        </div>
        <div className="container-div">
          <h3>PERCENTUALE RIEMPIMENTO</h3>
          <h1>{percentualeRiempimento}%</h1>
        </div>
      </div>
    </div>
  );
}

export default App;
