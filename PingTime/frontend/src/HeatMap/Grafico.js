import * as d3 from "d3";
import styles from "./Grafico.module.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import React from "react";
import { data_formatting } from "./Data_Formatting";
import { arrayX, getIntervalloAnnuale, getIntervalloMensile, getIntervalloSettimanale, getScorrimentoX, getZoomX } from "./Utility";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

function setDataInChart(vista, x, y, height, myColor, mouseover, mousemove, mouseleave, tipologiaY, arrayFasce) {
  d3.select("#dati")
    .selectAll()
    .data(arrayFasce, function (d) {
      return d.giorno + ":" + d.valore;
    })
    .join("rect")
    .attr("class", "dato")
    .attr("x", function (d) {
      return x(d.fascia);
    })
    .attr("y", function (d) {
      if (d.giorno !== undefined) return y(d.giorno);
      if (d.settimana !== undefined) return y(d.settimana);
      if (d.mese !== undefined) return y(d.mese);
    })
    .attr("width", function (d) {
      return x(x.domain()[1]) - x(x.domain()[0]) - 2;
    })
    .attr("height", function (d) {
      var mese = new Date(d.mese).getMonth();
      var anno = new Date(d.mese).getFullYear();

      var inizioRange = new Date(Date.UTC(anno, mese, 1));
      var fineRange = new Date(Date.UTC(anno, mese + 1, 0));
      var valore = y(fineRange) - y(inizioRange);

      if (tipologiaY === 1) return height / 7 - 2;
      if (tipologiaY === 2) return height / d.numero_settimane - 2;
      if (tipologiaY === 3) return valore;
    })
    .attr("clip-path", "url(#clip-area)")
    .style("fill", function (d) {
      var previsione;
      if (vista === 1 && tipologiaY === 1 && d.fascia.split(":")[1] === "00" && d.valore === 0) {
        for (let i = 0; i < arrayFasce.length; i++)
          if (arrayFasce[i].fascia === d.fascia && arrayFasce[i].giorno === d.giorno) {
            previsione = i;
            break;
          }
        if (previsione + 10 < arrayFasce.length && arrayFasce[previsione + 10] !== 0) {
          return myColor(arrayFasce[previsione + 10].valore);
        }
      }
      d.colore = myColor(d.valore + 15);
      return myColor(Math.floor(d.valore));
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
}

function updateDataInChart(scatter, vista, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasce) {
  // Recalculate color scale based on current data
  const valori = arrayFasce.map((d) => d.valore);
  const minValue = d3.min(valori) || 0;
  const maxValue = d3.max(valori) || 10;
  myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([minValue, maxValue]);

  scatter.selectAll(".dato").remove();
  scatter
    .selectAll("rect")
    .data(arrayFasce, function (d) {
      return d.giorno + ":" + d.valore;
    })
    .join("rect")
    .attr("x", function (d) {
      return x(d.fascia);
    })
    .attr("y", function (d) {
      if (d.giorno !== undefined) return y(d.giorno);
      if (d.settimana !== undefined) return y(d.settimana);
      if (d.mese !== undefined) return y(d.mese);
    })
    .attr("width", function (d) {
      return x(x.domain()[1]) - x(x.domain()[0]) - 2;
    })
    .attr("height", function (d) {
      //Calcolo le dimensioni per l'anno
      var mese = new Date(d.mese).getMonth();
      var anno = new Date(d.mese).getFullYear();

      var inizioRange = new Date(anno, mese, 1);
      var fineRange = new Date(anno, mese + 1, 0);
      var valore = y(fineRange) - y(inizioRange);

      //Calcolo le dimensioni del mese
      if (tipologiaY === 1) return height / 7 - 2;
      if (tipologiaY === 2) return height / d.numero_settimane - 2;
      if (tipologiaY === 3) return valore;
    })
    .attr("clip-path", "url(#clip)")
    .style("fill", function (d) {
      var previsione;
      if (vista === 1 && tipologiaY === 1 && d.fascia.split(":")[1] === "00" && d.valore === 0) {
        for (let i = 0; i < arrayFasce.length; i++)
          if (arrayFasce[i].fascia === d.fascia && arrayFasce[i].giorno === d.giorno) {
            previsione = i;
            break;
          }
        if (previsione + 10 < arrayFasce.length && arrayFasce[previsione + 10] !== 0) {
          return myColor(arrayFasce[previsione + 10].valore);
        }
      }
      d.colore = myColor(d.valore + 15);
      return myColor(d.valore);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
}

async function d3_create_graphic(tipologiaY, statisticaG) {
  var ID_Time = {
    dateTime: "%d %B %Y",
    date: "%d.%m.%Y",
    time: "%H:%M:%S",
    periods: ["AM", "PM"],
    days: ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"],
    shortDays: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
    months: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    shortMonths: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
  };

  d3.timeFormatDefaultLocale(ID_Time);
  //######################################################################################
  //##                                                                                  ##
  //##                  IMPOSTA LE DIMENSIONI E I MARGINI DELLA HEATMAP                 ##
  //##                                                                                  ##
  //######################################################################################

  const margin = { top: 80, right: 50, bottom: 50, left: 150 },
    width = window.innerWidth * 0.9 - margin.right - margin.left,
    height = window.innerHeight * 0.7 - margin.top - margin.bottom;

  //######################################################################################
  //##                                                                                  ##
  //##                        APPENDERE L'SVG AL BODY DELLA PAGINA                      ##
  //##                                                                                  ##
  //######################################################################################

  d3.select("#my_dataviz").selectAll("*").remove(); // Clear previous content
  const svg = d3
    .select("#my_dataviz")
    .attr("width", window.innerWidth * 0.9)
    .attr("height", window.innerHeight * 0.7);
  //######################################################################################
  //##                                                                                  ##
  //##                       ETICHETTE DELLE RIGHE E DELLE COLONNE                      ##
  //##                                                                                  ##
  //######################################################################################

  var dominio;
  if (tipologiaY === 1) dominio = [new Date(getIntervalloSettimanale(new Date()).inizio), new Date(getIntervalloSettimanale(new Date()).fine)];
  if (tipologiaY === 2) dominio = [getIntervalloMensile(new Date()).inizio, getIntervalloMensile(new Date()).fine];
  if (tipologiaY === 3) dominio = [getIntervalloAnnuale(new Date()).inizio, getIntervalloAnnuale(new Date()).fine];

  getIntervalloMensile(new Date()).ticks.forEach((d) => {});

  //######################################################################################
  //##                                                                                  ##
  //##                       CREAZIONE DELLA SCALA E DELL'ASSE X                        ##
  //##                                                                                  ##
  //######################################################################################

  var inizioFinestra = 0;
  var fineFinestra = 25;

  const arrayX_filtered1 = arrayX.filter((item) => item.endsWith("00"));
  const arrayX_filtered2 = arrayX.filter((item) => item.endsWith("00") || item.endsWith("30"));
  const arrayX_filtered3 = arrayX.filter((item) => item.endsWith("00") || item.endsWith("15") || item.endsWith("30") || item.endsWith("45"));
  const arrayX_filtered4 = arrayX.filter((item) => item.endsWith("0"));
  const arrayX_filtered5 = arrayX;

  var x = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);

  var x_settings = d3.axisBottom(x);

  //######################################################################################
  //##                                                                                  ##
  //##                       CREAZIONE DELLA SCALA E DELL'ASSE Y                        ##
  //##                                                                                  ##
  //######################################################################################

  var y_settings;
  var y;
  if (tipologiaY === 1) {
    y = d3
      .scaleTime()
      .domain([getIntervalloSettimanale(new Date()).inizio, getIntervalloSettimanale(new Date()).fine])
      .range([0, height]);
    y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%A %d %b %Y"));
  } else if (tipologiaY === 2) {
    y = d3
      .scaleTime()
      .domain([getIntervalloMensile(new Date()).inizio, getIntervalloMensile(new Date()).fine])
      .range([0, height]);
    y_settings = d3.axisLeft(y).tickValues(getIntervalloMensile(new Date()).ticks).tickFormat(d3.utcFormat("%b  %d  Sett. n° %V %Y"));
  } else {
    y = d3
      .scaleTime()
      .domain([getIntervalloAnnuale(new Date()).inizio.setHours(0), getIntervalloAnnuale(new Date()).fine.setHours(24)])
      .range([0, height]);
    y_settings = d3.axisLeft(y).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B %Y"));
  }

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DELLA VARIABILE SCATTER                       ##
  //##                                                                                  ##
  //######################################################################################
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "clip-area")
    .append("rect")
    .attr("x", -200)
    .attr("y", -50)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
  var scatter = svg.append("g").attr("id", "area").attr("transform", `translate(${margin.left}, ${margin.top})`).attr("clip-path", "url(#clip-area)").append("g").attr("id", "dati");

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DELLA SCALA DEI COLORI                        ##
  //##                                                                                  ##
  //######################################################################################

  var myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 20]);

  //######################################################################################
  //##                                                                                  ##
  //##                               CREAZIONE DELLE TOOLTIPS                           ##
  //##                                                                                  ##
  //######################################################################################

  const tooltip = d3
    .select("#my_dataviz")
    .append("rect")
    .attr("width", 20)
    .attr("height", 35)
    .attr("class", "tooltip-group")
    .attr("rx", 15)
    .attr("rx", 15)
    .attr("stroke", "purple")
    .attr("stroke-width", 5)
    .attr("fill", "white")
    .style("opacity", 0)
    .attr("class", "tooltip");

  const tooltip_v2 = d3
    .select("#my_dataviz")
    .append("text")
    .attr("class", "tooltip-group")
    .style("position", "absolute")
    .attr("fill", "black")
    .style("z-index", "14000000")
    .style("visibility", "hidden")
    .style("position", "absolute")
    .style("pointer-events", "all");

  const tooltip_v3 = d3
    .select("#my_dataviz")
    .append("div")
    .attr("class", "tooltip-group")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  //######################################################################################
  //##                                                                                  ##
  //##                   FUNZIONI CHE GESTISCONO GLI INPUT DEL MOUSE                    ##
  //##                                                                                  ##
  //######################################################################################

  var dragging = true;

  const mouseover = function (event, d) {
    if (dragging) {
      d3.select(this).style("stroke", "#2f6effff" /*d.colore*/).style("stroke-opacity", "0.75").style("stroke-width", "4px").style("opacity", 1);
      d3.select(this).style("background-color", "black");
    }
  };
  const mousemove = function (event, d) {
    var previsione;
    var testo;
    if (dragging) {
      const [mx, my] = d3.pointer(event);
      //Se ci sono persone
      if (event.target.__data__.persone !== undefined) {
        previsione = event.target.__data__;

        testo = previsione.persone;
        tooltip_v2
          .text("N° persone: " + Math.floor(previsione.valore))
          .style("font-size", 0.03 * height + "px")
          .style("stroke", "red")
          .style("stroke-width", 0.5)
          .style("visibility", "visible")
          .attr("x", mx + 165 + "px");

        tooltip
          .style("opacity", 1)
          .attr("height", 50 + Math.floor(previsione.valore) * 0.04 * height)
          .attr("width", 300)
          .attr("x", mx + 160 + "px");

        tooltip_v3.style("visibility", "visible");

        if (my > (height - margin.top - margin.bottom) / 2 && previsione.valore > 2) {
          tooltip.attr("y", my - (Math.floor(previsione.valore) * 0.04 * height + 50) / 2 + "px");
          tooltip_v2.attr("y", my - (Math.floor(previsione.valore) * 0.04 * height + 50) / 2 + 30 + "px");
        }
        if (my <= (height - margin.top - margin.bottom) / 2 || previsione.valore < 3) {
          tooltip.attr("y", my + 80 + "px");
          tooltip_v2.attr("y", my + 110 + "px");
        }
        if (mx > width / 2) {
          testo.split(",").forEach((line, i) => {
            tooltip_v2
              .append("tspan")
              .style("stroke", "black")
              .style("stroke-width", 0.25)
              .style("font-size", 0.021 * height + "px")
              .attr("x", mx - 145 + "px") // reset x for each line
              .attr("dy", 0.0365 * height + "px") // vertical offset
              .text(line);
          });
          tooltip.attr("x", mx - 160 + "px");
          tooltip_v2.attr("x", mx - 145 + "px");
        }
        if (mx <= width / 2) {
          testo.split(",").forEach((line, i) => {
            tooltip_v2
              .append("tspan")
              .style("stroke", "black")
              .style("stroke-width", 0.25)
              .style("font-size", 0.021 * height + "px")
              .attr("x", mx + 185 + "px") // reset x for each line
              .attr("dy", 0.0365 * height + "px") // vertical offset
              .text(line);
          });
          tooltip.attr("x", mx + 170 + "px");
          tooltip_v2.attr("x", mx + 185 + "px");
        }
      }
      //Se non ci sono persone
      else {
        previsione = event.target.__data__;
        //Vedo se nella mezz'ora successiva ci sono persone
        if (vista === 1 && tipologiaY === 1 && event.target.__data__.fascia.split(":")[1] === "00" && event.target.__data__.valore === 0) {
          for (let i = 0; i < arrayFasce.length; i++)
            if (arrayFasce[i].fascia === previsione.fascia && arrayFasce[i].giorno === previsione.giorno) {
              previsione = i;
              break;
            }
          if (previsione + 10 < arrayFasce.length && arrayFasce[previsione + 10] !== 0) {
            previsione = arrayFasce[previsione + 10];
          }
        }
        testo = previsione.persone;
        if (previsione.persone !== undefined) {
          tooltip_v2
            //.text("Valore: " + Math.floor(d.valore) + " presenze")
            .text("N° persone: " + Math.floor(previsione.valore))
            .style("font-size", 0.03 * height + "px")
            .style("stroke", "red")
            .style("stroke-width", 0.5)
            .style("visibility", "visible")
            .attr("x", mx + 165 + "px");

          tooltip
            .style("opacity", 1)
            .attr("height", 50 + Math.floor(previsione.valore) * 0.04 * height)
            .attr("x", mx + 160 + "px")
            .attr("width", 300);

          tooltip_v3.style("visibility", "visible");

          if (my > (height - margin.top - margin.bottom) / 2 && previsione.valore > 2) {
            tooltip.attr("y", my - (Math.floor(previsione.valore) * height * 0.04 + 50) / 2 + "px");
            tooltip_v2.attr("y", my - (Math.floor(previsione.valore) * height * 0.04 + 50) / 2 + 30 + "px");
          }
          if (my <= (height - margin.top - margin.bottom) / 2 || previsione.valore < 3) {
            tooltip.attr("y", my + 80 + "px");
            tooltip_v2.attr("y", my + 110 + "px");
          }
          if (mx > width / 2) {
            testo.split(",").forEach((line, i) => {
              tooltip_v2
                .append("tspan")
                .style("stroke", "black")
                .style("stroke-width", 0.25)
                .style("font-size", 0.021 * height + "px")
                .attr("x", mx - 145 + "px") // reset x for each line
                .attr("dy", 0.0365 * height + "px") // vertical offset
                .text(line);
            });
            tooltip.attr("x", mx - 160 + "px");
            tooltip_v2.attr("x", mx - 145 + "px");
          }
          if (mx <= width / 2) {
            testo.split(",").forEach((line, i) => {
              tooltip_v2
                .append("tspan")
                .style("stroke", "black")
                .style("stroke-width", 0.25)
                .style("font-size", 0.021 * height + "px")
                .attr("x", mx + 185 + "px") // reset x for each line
                .attr("dy", 0.0365 * height + "px") // vertical offset
                .text(line);
            });
            tooltip.attr("x", mx + 170 + "px");
            tooltip_v2.attr("x", mx + 185 + "px");
          }
        }
        //Altrimenti se nella mezz'ora successiva non ci sono persone
        else {
          tooltip
            .style("opacity", 1)
            .attr("height", 50)
            .attr("width", 150)
            .attr("x", mx + 160 + "px")
            .attr("y", my + 80 + "px");
          tooltip_v2
            //.text("Valore: " + Math.floor(d.valore) + " presenze")
            .text("N° persone: " + Math.floor(previsione.valore))
            .style("font-size", 0.03 * height + "px")
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .style("visibility", "visible")
            .attr("x", mx + 165 + "px")
            .attr("y", my + 110 + "px");
          if (my > (height - margin.top - margin.bottom) / 2) {
            tooltip.attr("y", my + 20 + "px");
            tooltip_v2.attr("y", my + 50 + "px");
          }
          if (my <= (height - margin.top - margin.bottom) / 2) {
            tooltip.attr("y", my + 80 + "px");
            tooltip_v2.attr("y", my + 110 + "px");
          }
          if (mx > (width - margin.left - margin.right) / 2) {
            tooltip.attr("x", mx + "px");
            tooltip_v2.attr("x", mx + 15 + "px");
          }
          if (mx <= (width - margin.left - margin.right) / 2) {
            tooltip.attr("x", mx + 170 + "px");
            tooltip_v2.attr("x", mx + 185 + "px");
          }
        }
        //In caso di periodo temporale selezionato mese o anno
        if (tipologiaY !== 1) {
          tooltip
            .style("opacity", 1)
            .attr("height", 50)
            .attr("width", 180)
            .attr("y", my + 80 + "px");
          tooltip_v2
            //.text("Valore: " + Math.floor(d.valore) + " presenze")
            .text("N° persone: " + Math.floor(previsione.valore))
            .style("font-size", 0.03 * height + "px")
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .style("visibility", "visible")
            .attr("y", my + 110 + "px");

          if (my > (height - margin.top - margin.bottom) / 2) {
            tooltip.attr("y", my + 20 + "px");
            tooltip_v2.attr("y", my + 50 + "px");
          }
          if (my <= (height - margin.top - margin.bottom) / 2) {
            tooltip.attr("y", my + 90 + "px");
            tooltip_v2.attr("y", my + 120 + "px");
          }
          if (mx > (width - margin.left - margin.right) / 2) {
            tooltip.attr("x", mx + "px");
            tooltip_v2.attr("x", mx + 15 + "px");
          }
          if (mx <= (width - margin.left - margin.right) / 2) {
            tooltip.attr("x", mx + 170 + "px");
            tooltip_v2.attr("x", mx + 185 + "px");
          }
        }
      }
    }
  };
  const mouseleave = function (event, d) {
    tooltip_v2.text("");
    tooltip.attr("x", -100 + "px").attr("y", -100 + "px");
    tooltip.style("opacity", 0);
    d3.select(this).style("stroke", "none").style("opacity", 1);
  };

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DEI RETTANGOLI DEI DATI                       ##
  //##                                                                                  ##
  //######################################################################################
  var arrayFasce = []; //data_formatting(new Date(), dominio, tipologiaY, statisticaG);
  arrayFasce = data_formatting(dominio, tipologiaY, statisticaG).then((data) => {
    setDataInChart(vista, x, y, height, myColor, mouseover, mousemove, mouseleave, tipologiaY, data);
  });

  //######################################################################################
  //##                                                                                  ##
  //##                                AGGIUNTA DEGLI ASSI                               ##
  //##                                                                                  ##
  //######################################################################################

  var xAxis = svg
    .append("g")
    .style("font-size", 12)
    .attr("class", "xAxis")
    .attr("transform", `translate(${margin.left}, ${margin.top + height})`)
    .call(x_settings);

  const yAxis = svg
    .append("g")
    .attr("class", "yAxis")
    .attr("transform", `translate(${margin.left},${margin.top + 0})`)
    .style("font-size", 12)
    .call(y_settings);
  svg
    .append("rect")
    .attr("transform", `translate(${margin.left},${margin.top + 0})`)
    .attr("fill", "#d5191900")
    .attr("class", "yAxisRect")
    .attr("x", -margin.left)
    .attr("y", 0)
    .attr("width", margin.left)
    .attr("height", height);
  svg
    .append("rect")
    .attr("transform", `translate(${margin.left}, ${margin.top + height})`)
    .attr("fill", "rgba(213, 25, 25, 0)")
    .attr("class", "xAxisRect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", width)
    .attr("height", margin.bottom);

  //######################################################################################
  //##                                                                                  ##
  //##                              ZOOM E DRAG DELL'ASSE X                             ##
  //##                                                                                  ##
  //######################################################################################

  var zoomPrecedente = -1;
  var posizionePrecedente = 0;
  var vista = 1;

  const zoomX = d3
    .zoom()
    .scaleExtent([-Infinity, Infinity]) // limita lo zoom tra 1x e 10x
    .on("zoom", (event) => {
      var newX;
      var appoggio = getZoomX(event, inizioFinestra, fineFinestra, vista, zoomPrecedente, width, arrayX_filtered1, arrayX_filtered2, arrayX_filtered3, arrayX_filtered4, arrayX_filtered5, x);
      newX = appoggio.newX;
      vista = appoggio.vista;
      inizioFinestra = appoggio.inizioFinestra;
      fineFinestra = appoggio.fineFinestra;
      zoomPrecedente = event.transform.k;
      //arrayFasce = data_formatting(new Date(), [y.domain()[0], y.domain()[y.domain().length - 1]], tipologiaY, statisticaG);
      x = newX;
      arrayFasce = data_formatting([y.domain()[0], y.domain()[y.domain().length - 1]], tipologiaY, statisticaG).then((data) => {
        updateDataInChart(scatter, vista, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, data);
      });
      svg.select(".yAxis").transition().duration(200).call(y_settings);
      svg.select(".xAxis").transition().duration(200).call(d3.axisBottom(newX));
    });
  scatter.call(
    d3
      .drag()
      .on("end", function () {
        dragging = true;
      })
      .on("drag", function (event) {
        if (vista !== 1) {
          dragging = false;
          if (event.x + 50 < posizionePrecedente || posizionePrecedente + 50 < event.x) {
            const valoriAggiornati = getScorrimentoX(event, posizionePrecedente, inizioFinestra, fineFinestra, vista);
            inizioFinestra = valoriAggiornati.inizio;
            fineFinestra = valoriAggiornati.fine;
            posizionePrecedente = event.x;
            if (vista === 1) {
              x = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);
            } else if (vista === 2) {
              x = d3.scaleBand([0, width]).domain(arrayX_filtered2.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);
            } else if (vista === 3) {
              x = d3.scaleBand([0, width]).domain(arrayX_filtered3.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);
            } else if (vista === 4) {
              x = d3.scaleBand([0, width]).domain(arrayX_filtered4.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);
            } else {
              x = d3.scaleBand([0, width]).domain(arrayX_filtered5.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);
            }
            x_settings = d3.axisBottom(x);
            xAxis.call(x_settings);
            arrayFasce = data_formatting(dominio, tipologiaY, statisticaG).then((data) => {
              const arrayFasceRanged = data.filter(function (d) {
                if (new Set(x.domain()).has(d.fascia)) {
                  return d;
                } else return null;
              });
              updateDataInChart(scatter, vista, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasceRanged);
            });
          }
        }
      })
  );
  scatter.call(zoomX);

  //######################################################################################
  //##                                                                                  ##
  //##                               ZOOM E DRAG DELL'ASSE Y                            ##
  //##                                                                                  ##
  //######################################################################################

  var anno_corrente = y.domain()[0].getFullYear();
  var offset_settimana = 0;
  var offset_mese = 0;

  var posizioneY = 0;

  d3.select(".yAxisRect").on("wheel", function (event) {
    event.preventDefault();
    const oggi = new Date();
    const primo_giorno_mese_rispetto_oggi = new Date(Date.UTC(oggi.getFullYear(), oggi.getMonth(), 1));
    var primo_giorno_mese_offset;
    //Scorri avanti nel tempo
    if (event.deltaY > 0) {
      anno_corrente = anno_corrente + 1;
      offset_settimana = offset_settimana + 7;
      offset_mese = offset_mese + 1;
      primo_giorno_mese_offset = new Date(Date.UTC(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1));
      if (tipologiaY === 1) {
        y = d3
          .scaleTime()
          .domain([getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio, getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%A %d %b %y"));
      } else if (tipologiaY === 2) {
        y.domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine]);
        y_settings.tickValues(getIntervalloMensile(primo_giorno_mese_offset).ticks);
      } else {
        y = d3
          .scaleTime()
          .domain([getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio, getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B %Y"));
      }
    }
    //Scorri indietro nel tempo
    if (event.deltaY < 0) {
      anno_corrente = anno_corrente - 1;
      offset_settimana = offset_settimana - 7;
      offset_mese = offset_mese - 1;
      primo_giorno_mese_offset = new Date(Date.UTC(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1));
      if (tipologiaY === 1) {
        y = d3
          .scaleTime()
          .domain([getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio, getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%A %d %b %y"));
      } else if (tipologiaY === 2) {
        y.domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine]);
        y_settings.tickValues(getIntervalloMensile(primo_giorno_mese_offset).ticks);
      } else {
        y = d3
          .scaleTime()
          .domain([getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio, getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B %Y"));
      }
    }
    d3.select(".yAxis").call(y_settings);
    if (tipologiaY === 1)
      dominio = [new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio), new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine)];
    if (tipologiaY === 2) dominio = [getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine];
    if (tipologiaY === 3) dominio = [new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio), new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine)];

    arrayFasce = data_formatting(dominio, tipologiaY, statisticaG).then((data) => {
      updateDataInChart(scatter, vista, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, data);
    });
  });

  d3.select(".yAxisRect").call(
    d3
      .drag()
      .on("start", function (event) {
        posizioneY = event.y;
      })
      .on("end", function (event) {
        const oggi = new Date();
        const primo_giorno_mese_rispetto_oggi = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
        var primo_giorno_mese_offset;
        //Scorri avanti nel tempo
        if (event.y + 50 < posizioneY) {
          anno_corrente = anno_corrente + 1;
          offset_settimana = offset_settimana + 7;
          offset_mese = offset_mese + 1;
          primo_giorno_mese_offset = new Date(Date.UTC(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1));
          if (tipologiaY === 1) {
            y = d3
              .scaleTime()
              .domain([getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio, getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%A %d %b %y"));
          } else if (tipologiaY === 2) {
            y = d3
              .scaleTime()
              .domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).tickValues(getIntervalloMensile(new Date()).ticks).tickFormat(d3.timeFormat("%b  %d  Sett. n° %V %Y"));
          } else {
            y = d3
              .scaleTime()
              .domain([getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio, getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B %Y"));
          }
        }
        //Scorri indietro nel tempo
        if (posizioneY + 50 < event.y) {
          anno_corrente = anno_corrente - 1;
          offset_settimana = offset_settimana - 7;
          offset_mese = offset_mese - 1;
          primo_giorno_mese_offset = new Date(Date.UTC(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1));
          if (tipologiaY === 1) {
            y = d3
              .scaleTime()
              .domain([getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio, getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%A %d %b %y"));
          } else if (tipologiaY === 2) {
            y = d3
              .scaleTime()
              .domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).tickValues(getIntervalloMensile(new Date()).ticks).tickFormat(d3.timeFormat("%b  %d  Sett. n° %V %Y"));
          } else {
            y = d3
              .scaleTime()
              .domain([getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio, getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B %Y"));
          }
        }
        yAxis.call(y_settings);
        if (tipologiaY === 1)
          dominio = [
            new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio),
            new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine),
          ];
        if (tipologiaY === 2) dominio = [getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine];
        if (tipologiaY === 3) dominio = [new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio), new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine)];

        arrayFasce = data_formatting(dominio, tipologiaY, statisticaG).then((data) => {
          updateDataInChart(scatter, vista, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, data);
        });
      })
  );
}

function HeatMap() {
  const [periodo, setPeriodo] = React.useState(1);
  const [statistica, setStatistica] = React.useState(1);

  useEffect(() => {
    d3_create_graphic(periodo, statistica);
  }, [periodo, statistica]);

  return (
    <div className={styles.container}>
      <br />
      <br />
      <h1> PRESENZE STAGIONALI </h1>
      <br />
      <br />
      <FormControl>
        <InputLabel id="demo-simple-select-label">Periodo temporale</InputLabel>
        <Select sx={{ minWidth: "200px", marginRight: "20px" }} id="demo-simple-select" value={periodo} label="Periodo temporale" onChange={(event) => setPeriodo(event.target.value)}>
          <MenuItem value={1}>Settimana</MenuItem>
          <MenuItem value={2}>Mese</MenuItem>
          <MenuItem value={3}>Anno</MenuItem>
        </Select>
      </FormControl>
      {(periodo === 3 || periodo === 2) && (
        <FormControl>
          <InputLabel>Tipo statistica</InputLabel>
          <Select sx={{ minWidth: "200px" }} id="demo-simple-selectt" value={statistica} label="Tipo statistica" onChange={(event) => setStatistica(event.target.value)}>
            <MenuItem value={1}>Somma</MenuItem>
            <MenuItem value={2}>Media</MenuItem>
            <MenuItem value={3}>Minimo</MenuItem>
            <MenuItem value={4}>Massimo</MenuItem>
          </Select>
        </FormControl>
      )}
      <br />
      <br />
      <InputLabel>
        Interagire con <b>l'asse verticale</b> (trascinamento o rotella) per spostarsi avanti e dietro nel tempo.
      </InputLabel>
      <InputLabel>
        Per avere maggiore risoluzione lungo <b>l'asse orizzontale</b> a livello di ore e minuti zoommare tramite rotella del mouse all'interno dello spazio dei dati
      </InputLabel>
      <InputLabel>
        Per spostarsi lungo <b>l'asse orizzontale</b> trascinare il grafico generato
      </InputLabel>
      <br />
      <br />
      <svg id="my_dataviz" style={{ marginLeft: "0.25vw" }}></svg>
      <br />
    </div>
  );
}

export default HeatMap;
