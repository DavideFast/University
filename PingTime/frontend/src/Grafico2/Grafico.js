import * as d3 from "d3";
import styles from "./Grafico.module.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import React from "react";

function App3() {
  const [periodo, setPeriodo] = React.useState(0);

  useEffect(() => {}, [periodo]);

  return (
    <div className={styles.container}>
      <br />
      <br />
      <h2> ORGANIZZAZIONE/... </h2>
      <br />
      <br />
      <Select
        sx={{ minWidth: "150px" }}
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={periodo}
        label="Age"
        onChange={(event) => setPeriodo(event.target.value)}
      >
        <MenuItem value={0}>
          <em>None</em>
        </MenuItem>
        <MenuItem value={10}>Settimana</MenuItem>
        <MenuItem value={20}>Mese</MenuItem>
        <MenuItem value={30}>Anno</MenuItem>
        <MenuItem value={40}>Anno2</MenuItem>
      </Select>
      <br />
      <br />
      <div id="dataviz_axisZoom"></div>
    </div>
  );
}

export default App3;
