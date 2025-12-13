import * as d3 from "d3";
import styles from "./Grafico.module.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import React from "react";
import * as dayjs from "dayjs";
import Slider from "@mui/material/Slider";

function calcola(valore) {
  console.log("Valore slider: " + valore);
  if (valore < 8) return 1 / 12;
  if (valore < 16) return 1 / 6;
  if (valore < 50) return 0.25;
  if (valore < 75) return 0.5;
  if (valore <= 100) return 1;
  return 1;
}

function d3_create_graphic(spostamento, finestraTemporale, db_data, db_fascia) {
  // set the dimensions and margins of the graph
  const margin = { top: 80, right: 25, bottom: 50, left: 120 },
    width = 1800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  d3.select("#my_dataviz").selectAll("*").remove(); // Clear previous content
  const svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  db_fascia.sort((a, b) => {
    return a.id - b.id;
  });
  const dimensione_array_fascia = Number(db_fascia[db_fascia.length - 1].id);
  var newFascia = new Array(dimensione_array_fascia);
  for (let i = 0; i < db_fascia.length; i++) {
    newFascia[db_fascia[i].id] = db_fascia[i] ? db_fascia[i] : null;
  }

  console.log(db_fascia);
  console.log(newFascia);
  //Read the data
  var newData = new Array(db_data.length);
  console.log(db_data);
  for (let i = 0; i < db_data.length; i++) {
    newData[i] = {};
    newData[i].inizio = new Date(
      "january 1, 2000 " + newFascia[db_data[i].fascia_oraria].ora_inizio
    );
    newData[i].fine = new Date(
      "January 1, 2000 " + newFascia[db_data[i].fascia_oraria].ora_fine
    );
    newData[i].giorno = newFascia[db_data[i].fascia_oraria].giorno;
    if (newData[i].giorno == "Lunedì") newData[i].giorno_numerico = 1;
    if (newData[i].giorno == "Martedì") newData[i].giorno_numerico = 2;
    if (newData[i].giorno == "Mercoledì") newData[i].giorno_numerico = 3;
    if (newData[i].giorno == "Giovedì") newData[i].giorno_numerico = 4;
    if (newData[i].giorno == "Venerdì") newData[i].giorno_numerico = 5;
    if (newData[i].giorno == "Sabato") newData[i].giorno_numerico = 6;
    if (newData[i].giorno == "Domenica") newData[i].giorno_numerico = 0;
  }

  newData.sort((a, b) => {
    return d3.ascending(a.ora_inizio, b.ora_fine);
  });

  console.log(newData);

  var arrayFasce = new Array(7 * 24 * 12); //7 giorni x 24 ore x 12 quarti d'ora
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 288; j++) {
      arrayFasce[i * 288 + j] = {};
      arrayFasce[i * 288 + j].valore = 0;

      if (j < 120) {
        if (j % 12 === 0)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":00"
          );
        else if (j % 12 === 1) {
          console.log(i * 288 + j + " ---- " + Math.ceil(j / 12));
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":05"
          );
        } else if (j % 12 === 2)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":10"
          );
        else if (j % 12 === 3)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":15"
          );
        else if (j % 12 === 4)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":20"
          );
        else if (j % 12 === 5)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":25"
          );
        else if (j % 12 === 6)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":30"
          );
        else if (j % 12 === 7)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":35"
          );
        else if (j % 12 === 8)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":40"
          );
        else if (j % 12 === 9)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":45"
          );
        else if (j % 12 === 10)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":50"
          );
        else if (j % 12 === 11)
          arrayFasce[i * 288 + j].fascia = new Date(
            "January 1, 2000 " + "0" + Math.floor(j / 12) + ":55"
          );
      }
      if (j % 12 === 0)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":00"
        );
      else if (j % 12 === 1)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":05"
        );
      else if (j % 12 === 2)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":10"
        );
      else if (j % 12 === 3)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":15"
        );
      else if (j % 12 === 4)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":20"
        );
      else if (j % 12 === 5)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":25"
        );
      else if (j % 12 === 6)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":30"
        );
      else if (j % 12 === 7)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":35"
        );
      else if (j % 12 === 8)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":40"
        );
      else if (j % 12 === 9)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":45"
        );
      else if (j % 12 === 10)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":50"
        );
      else if (j % 12 === 11)
        arrayFasce[i * 288 + j].fascia = new Date(
          "January 1, 2000 " + Math.floor(j / 12) + ":55"
        );

      if (i === 0) arrayFasce[i * 288 + j].giorno = "Domenica";
      if (i === 1) arrayFasce[i * 288 + j].giorno = "Lunedì";
      if (i === 2) arrayFasce[i * 288 + j].giorno = "Martedì";
      if (i === 3) arrayFasce[i * 288 + j].giorno = "Mercoledì";
      if (i === 4) arrayFasce[i * 288 + j].giorno = "Giovedì";
      if (i === 5) arrayFasce[i * 288 + j].giorno = "Venerdì";
      if (i === 6) arrayFasce[i * 288 + j].giorno = "Sabato";

      /*if (i === 0) arrayFasce[i * 284 + j].giorno_numerico = 0;
      if (i === 1) arrayFasce[i * 284 + j].giorno_numerico = 1;
      if (i === 2) arrayFasce[i * 284 + j].giorno_numerico = 2;
      if (i === 3) arrayFasce[i * 284 + j].giorno_numerico = 3;
      if (i === 4) arrayFasce[i * 284 + j].giorno_numerico = 4;
      if (i === 5) arrayFasce[i * 284 + j].giorno_numerico = 5;
      if (i === 6) arrayFasce[i * 284 + j].giorno_numerico = 6;*/
    }
    console.log(arrayFasce);
  }
  //Contare numero presenze per fascia oraria
  for (let i = 0; i < newData.length; i++) {
    const inizio = newData[i].inizio;
    const fine = newData[i].fine;
    const giorno = newData[i].giorno_numerico;
    const index_inizio =
      giorno * 284 + (inizio.getHours() * 12 + inizio.getMinutes() / 5);
    const index_fine =
      giorno * 284 + (fine.getHours() * 12 + fine.getMinutes() / 5);
    console.log(newData[i].giorno_numerico);
    console.log(inizio.getHours());
    console.log(inizio.getMinutes());
    console.log(index_inizio + " - " + index_fine);
    for (let j = index_inizio; j < index_fine; j++) arrayFasce[j].valore += 1;
  }

  console.log(arrayFasce);

  // Labels of row and columns -> unique identifier of the column called 'group' and 'variable'

  var myVars = [];
  myVars = [
    "Domenica",
    "Sabato",
    "Venerdì",
    "Giovedì",
    "Mercoledì",
    "Martedì",
    "Lunedì",
  ];

  // Build X scales and axis:
  var xAxis = d3.axisBottom();
  var x = d3.scaleTime();
  x.domain([
    new Date(2000, 0, 1).setHours(finestraTemporale - 4),
    new Date(2000, 0, 1).setHours(finestraTemporale),
  ]);
  x.range([0, width]);

  console.log(new Date(2000, 0, 1));

  xAxis.scale(x);
  xAxis.ticks(d3.timeMinute.every(60 * spostamento));
  xAxis.tickFormat(d3.timeFormat("%H:%M"));

  svg
    .append("g")
    .style("font-size", 12)
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis /*.tickSize(0)*/)
    .select(".domain")
    .remove();

  // Build Y scales and axis:
  const y = d3.scaleBand().range([height, 0]).domain(myVars).padding(0.05);
  svg
    .append("g")
    .style("font-size", 15)
    .call(d3.axisLeft(y).tickSize(0))
    .select(".domain")
    .remove();

  // Build color scale
  const myColor = d3
    .scaleSequential()
    .interpolator(d3.interpolateRgb("#f4f5f6", "orange"))
    .domain([0, 100]);

  // create a tooltip
  const tooltip = d3
    .select("#my_dataviz")
    .append("div")

    .attr("fill", "black")
    .style("opacity", 1)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border", "solid")
    .style("border-width", "5px")
    .style("border-radius", "5px")
    .style("padding", "5px");

  const tooltip_v2 = d3
    .select("#my_dataviz")
    .append("text")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .attr("fill", "black")
    .style("z-index", "14000000")
    .style("visibility", "hidden")
    .style("position", "absolute")
    .style("pointer-events", "none");

  const tooltip_v3 = d3
    .select("#my_dataviz")
    .append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .html(
      <>
        <p>I'm a tooltip written in HTML</p>
        <img src="https://github.com/holtzy/D3-graph-gallery/blob/master/img/section/ArcSmal.png?raw=true"></img>
        <br>Fancy</br>
        <span style="font-size: 40px;">Isn't it?</span>
      </>
    );
  // Three function that change the tooltip when user hover / move / leave a cell
  const mouseover = function (event, d) {
    const [mx, my] = d3.pointer(event);
    console.log(d);
    tooltip_v2
      .text("Valore: " + d.valore + " presenze")
      .style("font-size", 1.5 + "rem")
      .style("color", "red")
      .style("visibility", "visible")
      .attr("x", mx + 160 + "px")
      .attr("y", my + 80 + "px");
    tooltip.style("opacity", 0);
    d3.select(this)
      .style("stroke", d.colore)
      .style("stroke-opacity", "0.75")
      .style("stroke-width", "4px")
      .style("opacity", 1);
    d3.select(this).style("background-color", "black");
  };
  const mousemove = function (event, d) {
    const [mx, my] = d3.pointer(event);
    console.log(event);
    console.log(d);
    tooltip_v2
      .text("Valore: " + d.valore + " presenze")
      .style("font-size", 1.5 + "rem")
      .style("color", "red")
      .style("visibility", "visible")
      .attr("x", mx + 160 + "px")
      .attr("y", my + 80 + "px");
    tooltip_v3.style("visibility", "visible");
  };
  const mouseleave = function (event, d) {
    tooltip_v2.text("");
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none").style("opacity", 1);
  };

  console.log(xAxis.domain);

  // add the squares

  svg
    .selectAll()
    .data(arrayFasce, function (d) {
      //console.log(d.giorno + ":" + d.valore);
      return d.giorno + ":" + d.valore;
    })
    .join("rect")
    .attr("x", function (d) {
      //console.log(d);
      return x(d.fascia);
    })
    .attr("y", function (d) {
      return y(d.giorno);
    })
    .attr(
      "width",
      x(new Date(2000, 0, 1, 0, 5)) - x(new Date(2000, 0, 1, 0, 0))
    )
    .attr("height", y.bandwidth())
    .style("fill", function (d) {
      d.colore = myColor(d.valore + 30);
      return myColor(d.valore);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  /*svg
    .selectAll()
    .data(arrayFasce, function (d) {
      console.log(d.giorno + ":" + d.valore);
      return d.giorno + ":" + d.valore;
    })
    .join("rect")
    .attr("x", function (d) {
      console.log("x: " + x(d.fascia));
      return x(d.fascia);
    })
    .attr("y", function (d) {
      console.log("y: " + d.giorno);
      return y(d.giorno);
    })
    .attr("rx", 4)
    .attr("ry", 4)
    //.attr("width", xAxis.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", function (d) {
      return myColor(d.valore);
    })
    .style("stroke-width", 4)
    .style("stroke", "none")
    .style("opacity", 0.8)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);*/
}

function setFinestra(valore) {
  return (valore / 9.43) * 0.2 + 4;
}

function App2() {
  const [periodo, setPeriodo] = React.useState(0);
  const [spostamento, setSpostamento] = React.useState(1);
  const [spostamentoSlider, setSpostamentoSlider] = React.useState(100);
  const [spostamentoCopia, setSpostamentoCopia] = React.useState(0);
  const [valore, setValore] = React.useState(0);
  const [lock, setLock] = React.useState(false);
  const [previousX, setPreviousX] = React.useState(0);
  const [finestraTemporale, setFinestraTemporale] = React.useState(4); //4 ore
  const [dati_acquisiti, setDatiAcquisiti] = React.useState([]);
  const [fascia, setFascia] = React.useState([]);

  const checkTimelineAndFix = () => {
    var numero = spostamentoCopia;
    while (numero + calcola(spostamentoSlider) * 960 > 960) {
      numero--;
    }
    setSpostamentoCopia(numero);
  };

  useEffect(() => {
    setFinestraTemporale(setFinestra(spostamentoCopia));

    const mouseDrag = (e) => {
      console.log("SONO IN MOUSE DRAG");
      if (lock) {
        console.log("ATTIVO: " + lock);
        if (
          spostamentoCopia +
            calcola(spostamentoSlider) * 960 +
            e.clientX -
            previousX <=
            947 &&
          spostamentoCopia + e.clientX - previousX >= 0
        )
          setSpostamentoCopia(spostamentoCopia + e.clientX - previousX);
        console.log("Spostamento copia: " + spostamentoCopia);
      }
    };

    const mouseUp = (e) => {
      setLock(false);
      console.log("SONO IN MOUSE UP");
    };

    document.addEventListener("mousemove", mouseDrag);

    //document.addEventListener('mouseup', mouseDrag);

    if (dati_acquisiti.length !== null) {
      d3.csv(
        "https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Fascia_Oraria&format=csv"
      ).then(function (f) {
        d3.csv(
          "https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Calendario&format=csv"
        ).then(function (data) {
          setDatiAcquisiti(data);
          setFascia(f);
          d3_create_graphic(spostamento, finestraTemporale, data, f);
        });
      });
    } else {
      d3_create_graphic(spostamento, finestraTemporale, dati_acquisiti, fascia);
    }

    return function cleanup() {
      document.removeEventListener("mousemove", mouseDrag);
    };
  }, [periodo, spostamento, lock, finestraTemporale]);

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
      <svg width={1800} height={600} id="my_dataviz"></svg>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />

      <div className={styles.barra}>
        <div
          className={styles.maniglie}
          onMouseDown={(event) => {
            setValore(10);
            setPreviousX(event.clientX);
            setLock(true);
          }}
          onClick={() => {
            setLock(false);
          }}
          onMouseOver={() => {
            if (!lock) setValore(5);
          }}
          onMouseLeave={() => {
            if (!lock) setValore(0);
          }}
          onMouseUp={(event) => {
            console.log("HAHAHAHAHAH");
            setLock(false);
          }}
          style={{
            backgroundColor: "green",
            marginLeft: `${spostamentoCopia}px`,
            width: `${calcola(spostamentoSlider) * 100}%`,
            boxShadow: `0 0 0 ${valore}px rgba(76, 175, 80, 0.4)`,
          }}
        />
        <br />
        <br />
        <Slider
          aria-label="Volume"
          value={spostamentoSlider}
          onMouseUp={() => {
            checkTimelineAndFix();
            setSpostamento(calcola(spostamentoSlider));
          }}
          onChange={(event) => {
            setSpostamentoSlider(event.target.value);
          }}
        />
      </div>
    </div>
  );
}

export default App2;
