import logo from "./logo.svg";
import "./App.css";
import { useEffect } from "react";
import React from "react";
import InputLabel from "@mui/material/InputLabel";

function App() {
  const [periodo, setPeriodo] = React.useState();

  /*const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
  const currentWeek = getWeekNumber(currentDate);
  const currentWeekYear = getWeekYear(currentDate);

  const [year, setYear] = React.useState(currentYear);
  const [month, setMonth] = React.useState(currentMonth);
  const [week, setWeek] = React.useState(currentWeek);
  const [weekYear, setWeekYear] = React.useState(currentWeekYear); // ISO week year for selected week*/

  const [presenze, setPresenze] = React.useState(0);
  const [assenze, setAssenze] = React.useState(10);
  const [cancellazioni, setCancellazioni] = React.useState(0);
  const [variazioni, setVariazioni] = React.useState(0);
  const [percentualeRiempimento, setPercentualeRiempimento] = React.useState(0);

  const [presenzePassato, setPresenzePassato] = React.useState(0);
  const [assenzePassato, setAssenzePassato] = React.useState(0);
  const [cancellazioniPassato, setCancellazioniPassato] = React.useState(0);
  const [variazioniPassato, setVariazioniPassato] = React.useState(0);
  const [percentualeRiempimentoPassato, setPercentualeRiempimentoPassato] = React.useState(0);

  const getVariazione = (valore1, valore2) => {
    if (valore1 > valore2) {
      return "+" + (valore1 / valore2) * 100;
    }
    if (valore1 < valore2) {
      return "-" + (valore1 / valore2) * 100;
    }
    if (valore1 == valore2) {
      return "Nessuna variazione";
    }
  };

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
          <InputLabel>Presenze Totali</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{presenze}</h1>
          <InputLabel sx={{ color: "#d2d2d2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {presenzePassato}</InputLabel>
          <div className="variazione">
            <InputLabel>→ {getVariazione(presenze, presenzePassato)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Assenze Totali</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{assenze}</h1>
          <InputLabel sx={{ color: "#d2d2d2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {assenzePassato}</InputLabel>
          <div className="variazione">
            <InputLabel>→ {getVariazione(assenze, assenzePassato)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Cancellazioni</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{cancellazioni}</h1>
          <InputLabel sx={{ color: "#d2d2d2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {cancellazioniPassato}</InputLabel>
          <div className="variazione">
            <InputLabel>→ {getVariazione(cancellazioni, cancellazioniPassato)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Variazioni Totali</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{variazioni}</h1>
          <InputLabel sx={{ color: "#d2d2d2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {variazioniPassato}</InputLabel>
          <div className="variazione">
            <InputLabel>→ {getVariazione(variazioni, variazioniPassato)}</InputLabel>
          </div>
        </div>
        <div className="container-div">
          <InputLabel>Riempimento Spazi</InputLabel>
          <h1 style={{ color: "black", marginBottom: "10px" }}>{percentualeRiempimento}%</h1>
          <InputLabel sx={{ color: "#d2d2d2", fontSize: "12.5px", marginBottom: "20px" }}>precedente: {percentualeRiempimentoPassato}</InputLabel>
          <div className="variazione">
            <InputLabel>→ {getVariazione(percentualeRiempimento, percentualeRiempimentoPassato)}</InputLabel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
