import logo from "./logo.svg";
import "./App.css";
import * as d3 from "d3";
import { useEffect } from "react";
import React from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

function App() {
  const [periodo, setPeriodo] = React.useState();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3>PingTime - Let's play with us</h3>
        <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
      <h1>TENNIS TAVOLO 2.0</h1>
      <h3 htmlFor="intervallo-temporale">Seleziona il periodo temporale</h3>
      <Select sx={{ minWidth: "150px" }} labelId="demo-simple-select-label" id="demo-simple-select" value={periodo} label="Age" onChange={(event) => setPeriodo(event.target.value)}>
        <MenuItem value={0}>
          <em>None</em>
        </MenuItem>
        <MenuItem value={10}>Settimana</MenuItem>
        <MenuItem value={20}>Mese</MenuItem>
        <MenuItem value={30}>Anno</MenuItem>
      </Select>
      <br />
      <br />
      <br />
      <br />
      <div className="container">
        <div className="container-div">SPAZI LIBERI</div>
        <div className="container-div">ASSENZE</div>
        <div className="container-div">VARIAZIONI</div>
        <div className="container-div">PERCENTUALE RIEMPIMENTO</div>
      </div>
    </div>
  );
}

export default App;
