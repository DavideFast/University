import * as d3 from "d3";
import styles from "./Grafico.module.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import React from "react";
import Slider from "@mui/material/Slider";
import { data_formatting } from "./Data_Formatting";
import { setFinestra, calcolaAmpiezzaTemporale, calcola } from "./SliderObject_utility";
import { arrayX, getIntervalloSettimanale, getScorrimentoX, getZoomX, getZoomY } from "./Utility";

function d3_create_graphic(spostamento, finestraTemporale, ampiezzaFinestraTemporale, db_data, db_fascia) {
  //######################################################################################
  //##                                                                                  ##
  //##                  IMPOSTA LE DIMENSIONI E I MARGINI DELLA HEATMAP                 ##
  //##                                                                                  ##
  //######################################################################################

  const margin = { top: 80, right: 25, bottom: 50, left: 120 },
    width = 1800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  //######################################################################################
  //##                                                                                  ##
  //##                        APPENDERE L'SVG AL BODY DELLA PAGINA                      ##
  //##                                                                                  ##
  //######################################################################################

  d3.select("#my_dataviz").selectAll("*").remove(); // Clear previous content
  const svg = d3
    .select("#my_dataviz")
    .append("svg")

    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  //######################################################################################
  //##                                                                                  ##
  //##                       ETICHETTE DELLE RIGHE E DELLE COLONNE                      ##
  //##                                                                                  ##
  //######################################################################################

  var dominio = [new Date(getIntervalloSettimanale(new Date()).inizio.setHours(0)), new Date(getIntervalloSettimanale(new Date()).fine.setHours(24))];

  var arrayFasce = data_formatting(db_fascia, db_data, dominio);

  //######################################################################################
  //##                                                                                  ##
  //##                       CREAZIONE DELLA SCALA E DELL'ASSE X                        ##
  //##                                                                                  ##
  //######################################################################################

  var inizioFinestra = 0;
  var fineFinestra = 24;

  const arrayX_filtered1 = arrayX.filter((item) => item.endsWith("00"));
  const arrayX_filtered2 = arrayX.filter((item) => item.endsWith("00") || item.endsWith("30"));
  const arrayX_filtered3 = arrayX.filter((item) => item.endsWith("00") || item.endsWith("15") || item.endsWith("30") || item.endsWith("45"));
  const arrayX_filtered4 = arrayX.filter((item) => item.endsWith("0"));
  const arrayX_filtered5 = arrayX;

  var x = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra));

  var x_settings = d3.axisBottom(x);

  //######################################################################################
  //##                                                                                  ##
  //##                       CREAZIONE DELLA SCALA E DELL'ASSE Y                        ##
  //##                                                                                  ##
  //######################################################################################

  var y = d3
    .scaleTime()
    .domain([getIntervalloSettimanale(new Date()).inizio.setHours(0), getIntervalloSettimanale(new Date()).fine.setHours(24)])
    .range([0, height]);

  const y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1));

  //######################################################################################
  //##                                                                                  ##
  //##                              CREAZIONE DELLA CLIP-PATH                           ##
  //##                                                                                  ##
  //######################################################################################

  var clip = svg.append("defs").append("SVG:clipPath").attr("id", "clip").append("SVG:rect").attr("width", width).attr("height", height).attr("x", 0).attr("y", 0);

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DELLA VARIABILE SCATTER                       ##
  //##                                                                                  ##
  //######################################################################################

  var scatter = svg.append("g");

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DELLA SCALA DEI COLORI                        ##
  //##                                                                                  ##
  //######################################################################################

  const myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 100]);

  //######################################################################################
  //##                                                                                  ##
  //##                               CREAZIONE DELLE TOOLTIPS                           ##
  //##                                                                                  ##
  //######################################################################################

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
    .style("pointer-events", "all");

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

  //######################################################################################
  //##                                                                                  ##
  //##                   FUNZIONI CHE GESTISCONO GLI INPUT DEL MOUSE                    ##
  //##                                                                                  ##
  //######################################################################################

  const mouseover = function (event, d) {
    const [mx, my] = d3.pointer(event);
    tooltip_v2
      .text("Valore: " + d.valore + " presenze")
      .style("font-size", 1.5 + "rem")
      .style("color", "red")
      .style("visibility", "visible")
      .attr("x", mx + 160 + "px")
      .attr("y", my + 80 + "px");
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", d.colore).style("stroke-opacity", "0.75").style("stroke-width", "4px").style("opacity", 1);
    d3.select(this).style("background-color", "black");
  };
  const mousemove = function (event, d) {
    const [mx, my] = d3.pointer(event);
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

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DEI RETTANGOLI DEI DATI                       ##
  //##                                                                                  ##
  //######################################################################################

  var count = 0;

  scatter
    .selectAll()
    .data(arrayFasce, function (d) {
      return d.giorno + ":" + d.valore;
    })
    .join("rect")
    .attr("class", "dato")
    .attr("x", function (d) {
      if (x(d.fascia) !== undefined && y(d.giorno) !== undefined) {
      }
      return x(d.fascia);
    })
    .attr("y", function (d) {
      return y(d.giorno);
    })
    .attr("width", function (d) {
      return x(x.domain()[1]) - x(x.domain()[0]);
    })

    .attr("height", function (d) {
      const ticks = y.ticks();
      const filteredTicks = ticks.filter((tick) => {
        const hours = tick.getHours();
        const minutes = tick.getMinutes();
        return hours === 0 && minutes === 0;
      });

      return height / (filteredTicks.length - 1);
    })
    .attr("clip-path", "url(#clip)")
    .style("fill", function (d) {
      d.colore = myColor(d.valore + 15);
      return myColor(d.valore);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);

  //######################################################################################
  //##                                                                                  ##
  //##                                AGGIUNTA DEGLI ASSI                               ##
  //##                                                                                  ##
  //######################################################################################

  var xAxis = svg
    .append("g")
    .style("font-size", 12)

    .attr("class", "xAxis")
    .attr("transform", `translate(0, ${height})`)
    .call(x_settings);

  const yAxis = svg.append("g").attr("transform", `translate(0,0)`).style("font-size", 15).attr("class", "yAxis").call(y_settings);

  var zoomPrecedente = -1;
  var vista = 1;

  const zoomX = d3
    .zoom()
    .scaleExtent([-Infinity, Infinity]) // limita lo zoom tra 1x e 10x
    .on("zoom", (event) => {
      var newX;
      newX = getZoomX(event, inizioFinestra, fineFinestra, vista, zoomPrecedente, width, arrayX_filtered1, arrayX_filtered2, arrayX_filtered3, arrayX_filtered4, arrayX_filtered5, x).newX;
      vista = getZoomX(event, inizioFinestra, fineFinestra, vista, zoomPrecedente, width, arrayX_filtered1, arrayX_filtered2, arrayX_filtered3, arrayX_filtered4, arrayX_filtered5, x).vista;
      zoomPrecedente = event.transform.k;
      arrayFasce = data_formatting(db_fascia, db_data, [y.domain()[0], y.domain()[y.domain().length - 1]]);
      x = newX;
      scatter.selectAll(".dato").remove();
      scatter
        .selectAll()
        .data(arrayFasce, function (d) {
          return d.giorno + ":" + d.valore;
        })
        .join("rect")
        .attr("x", function (d) {
          return x(d.fascia);
        })
        .attr("y", function (d) {
          return y(d.giorno);
        })
        .attr("width", function (d) {
          return x(x.domain()[1]) - x(x.domain()[0]);
        })

        .attr("height", function (d) {
          const ticks = y.ticks();
          const filteredTicks = ticks.filter((tick) => {
            const hours = tick.getHours();
            const minutes = tick.getMinutes();
            return hours === 0 && minutes === 0;
          });
          return height / (filteredTicks.length - 1);
        })
        .attr("clip-path", "url(#clip)")
        .style("fill", function (d) {
          d.colore = myColor(d.valore + 15);
          return myColor(d.valore);
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

      svg.select(".xAxis").call(d3.axisBottom(newX));
    });
  xAxis.call(
    d3.drag().on("end", function (event) {
      console.log(event.x);
      console.log(event.subject.x);
      inizioFinestra = getScorrimentoX(event, inizioFinestra, fineFinestra, vista).inizio;
      fineFinestra = getScorrimentoX(event, inizioFinestra, fineFinestra, vista).fine;
      if (vista === 1) {
        x = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra));
      } else if (vista === 2) {
        x = d3.scaleBand([0, width]).domain(arrayX_filtered2.slice(inizioFinestra, fineFinestra));
      } else if (vista === 3) {
        x = d3.scaleBand([0, width]).domain(arrayX_filtered3.slice(inizioFinestra, fineFinestra));
      } else if (vista === 4) {
        x = d3.scaleBand([0, width]).domain(arrayX_filtered4.slice(inizioFinestra, fineFinestra));
      } else {
        x = d3.scaleBand([0, width]).domain(arrayX_filtered5.slice(inizioFinestra, fineFinestra));
      }
      x_settings = d3.axisBottom(x);
      xAxis.transition().duration(750).call(x_settings);

      scatter.selectAll(".dato").remove();
      scatter
        .selectAll()
        .data(arrayFasce, function (d) {
          return d.giorno + ":" + d.valore;
        })
        .join("rect")
        .attr("x", function (d) {
          return x(d.fascia);
        })
        .attr("y", function (d) {
          return y(d.giorno);
        })
        .attr("width", function (d) {
          return x(x.domain()[1]) - x(x.domain()[0]);
        })

        .attr("height", function (d) {
          const ticks = y.ticks();
          const filteredTicks = ticks.filter((tick) => {
            const hours = tick.getHours();
            const minutes = tick.getMinutes();
            return hours === 0 && minutes === 0;
          });
          return height / (filteredTicks.length - 1);
        })
        .attr("clip-path", "url(#clip)")
        .style("fill", function (d) {
          d.colore = myColor(d.valore + 15);
          return myColor(d.valore);
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
    })
  );
  xAxis.call(zoomX);

  const zoomY = d3
    .zoom()
    .scaleExtent([0.025, 1]) // limita lo zoom tra 1x e 10x
    .on("zoom", (event) => {
      console.log(event);
      y = event.transform.rescaleY(y).nice();

      arrayFasce = data_formatting(db_fascia, db_data, [y.domain()[0], y.domain()[y.domain().length - 1]]);

      scatter.selectAll(".dato").remove();
      scatter
        .selectAll()
        .data(arrayFasce, function (d) {
          return d.giorno + ":" + d.valore;
        })
        .join("rect")
        .attr("x", function (d) {
          return x(d.fascia);
        })
        .attr("y", function (d) {
          return y(d.giorno);
        })
        .attr("width", function (d) {
          return x(x.domain()[1]) - x(x.domain()[0]);
        })

        .attr("height", function (d) {
          const ticks = y.ticks();
          const filteredTicks = ticks.filter((tick) => {
            const hours = tick.getHours();
            const minutes = tick.getMinutes();
            return hours === 0 && minutes === 0;
          });
          return height / (filteredTicks.length - 1);
        })
        .attr("clip-path", "url(#clip)")
        .style("fill", function (d) {
          d.colore = myColor(d.valore + 15);
          return myColor(d.valore);
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
      svg.select(".yAxis").transition().duration(750).call(d3.axisLeft(y).ticks(7));
    });
  yAxis.call(zoomY);
}

function App2() {
  const [periodo, setPeriodo] = React.useState(0);
  const [spostamento, setSpostamento] = React.useState(1);
  const [spostamentoSlider, setSpostamentoSlider] = React.useState(100);
  const [spostamentoCopia, setSpostamentoCopia] = React.useState(0);
  const [valore, setValore] = React.useState(0);
  const [lock, setLock] = React.useState(false);
  const [previousX, setPreviousX] = React.useState(0);
  const [finestraTemporale, setFinestraTemporale] = React.useState(0); //4 ore
  const [ampiezzaFinestraTemporale, setAmpiezzaFinestraTemporale] = React.useState(24); //4 ore
  const [dati_acquisiti, setDatiAcquisiti] = React.useState([]);
  const [fascia, setFascia] = React.useState([]);

  const checkTimelineAndFix = () => {
    var numero = spostamentoCopia;
    while (numero + calcola(spostamentoSlider) * 960 > 960) {
      numero = numero - 1;
    }
    setSpostamentoCopia(numero);
  };

  useEffect(() => {
    setFinestraTemporale(setFinestra(spostamentoCopia));

    const mouseDrag = (e) => {
      if (lock) {
        if (spostamentoCopia + calcola(spostamentoSlider) * 960 + e.clientX - previousX <= 960 && spostamentoCopia + e.clientX - previousX >= 0)
          setSpostamentoCopia(spostamentoCopia + e.clientX - previousX);
      }
    };

    const mouseUp = (e) => {
      setLock(false);
    };

    document.addEventListener("mousemove", mouseDrag);

    //document.addEventListener('mouseup', mouseDrag);

    if (dati_acquisiti.length !== null) {
      d3.csv("https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Fascia_Oraria&format=csv").then(function (f) {
        d3.csv("https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Calendario&format=csv").then(function (data) {
          setDatiAcquisiti(data);
          setFascia(f);
          d3_create_graphic(spostamento, finestraTemporale, ampiezzaFinestraTemporale, data, f);
        });
      });
    } else {
      d3_create_graphic(spostamento, finestraTemporale, ampiezzaFinestraTemporale, dati_acquisiti, fascia);
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
      <Select sx={{ minWidth: "150px" }} labelId="demo-simple-select-label" id="demo-simple-select" value={periodo} label="Age" onChange={(event) => setPeriodo(event.target.value)}>
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
            setAmpiezzaFinestraTemporale(calcolaAmpiezzaTemporale(spostamentoSlider));
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
