import * as d3 from "d3";
import styles from "./Grafico.module.css";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { useEffect } from "react";
import React from "react";
import Slider from "@mui/material/Slider";
import { data_formatting } from "./Data_Formatting";
import { setFinestra, calcolaAmpiezzaTemporale, calcola } from "./SliderObject_utility";
import { arrayX, getIntervalloAnnuale, getIntervalloMensile, getIntervalloSettimanale, getScorrimentoX, getZoomX, getZoomY } from "./Utility";

function setDataInChart(scatter, x, y, height, myColor, mouseover, mousemove, mouseleave, tipologiaY, arrayFasce) {
  console.log(scatter.selectAll());
  console.log(d3.select("#area").selectAll("*"));
  console.log(d3.select("#area").selectAll());
  console.log(scatter.select("#area").selectAll());

  d3.select("#dati")
    .selectAll()
    //.selectAll()
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
      //console.log(d);
      if (d.giorno !== undefined) return y(d.giorno);
      if (d.settimana !== undefined) return y(d.settimana);
      if (d.mese !== undefined) return y(d.mese);
    })
    .attr("width", function (d) {
      return x(x.domain()[1]) - x(x.domain()[0]) - 2;
    })
    .attr("height", function (d) {
      //console.log(d.settimana);
      var mese = new Date(d.mese).getMonth();
      var anno = new Date(d.mese).getFullYear();

      var inizioRange = new Date(anno, mese, 1);
      var fineRange = new Date(anno, mese + 1, 0);
      //console.log(inizioRange);
      var valore = y(fineRange) - y(inizioRange);

      if (tipologiaY === 1) return height / 7 - 2;
      if (tipologiaY === 2) return height / 5 - 2;
      if (tipologiaY === 3) return valore;
    })
    .attr("clip-path", "url(#clip-area)")
    .style("fill", function (d) {
      d.colore = myColor(d.valore + 15);
      return myColor(d.valore);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
}

function updateDataInChart(scatter, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasce) {
  scatter.selectAll(".dato").remove();
  console.log(arrayFasce);
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
      var mese = new Date(d.mese).getMonth();
      var anno = new Date(d.mese).getFullYear();

      var inizioRange = new Date(anno, mese, 1);
      var fineRange = new Date(anno, mese + 1, 0);
      //console.log(inizioRange);
      var valore = y(fineRange) - y(inizioRange);

      if (tipologiaY === 1) return height / 7 - 2;
      if (tipologiaY === 2) return height / 5 - 2;
      if (tipologiaY === 3) return valore;
    })
    .attr("clip-path", "url(#clip)")
    .style("fill", function (d) {
      d.colore = myColor(d.valore + 15);
      return myColor(d.valore);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
}

function d3_create_graphic(db_data, db_fascia, tipologiaY, statisticaG) {
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

  var IDTime = d3.timeFormatDefaultLocale(ID_Time);
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
  /*.append("svg")

    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)*/
  //.append("g")
  //.attr("width", window.innerWidth * 0.9 - margin.left - margin.right)
  //.attr("height", window.innerHeight * 0.8 - margin.left - margin.right)

  //######################################################################################
  //##                                                                                  ##
  //##                       ETICHETTE DELLE RIGHE E DELLE COLONNE                      ##
  //##                                                                                  ##
  //######################################################################################

  var dominio;
  if (tipologiaY === 1) dominio = [new Date(getIntervalloSettimanale(new Date()).inizio.setHours(0)), new Date(getIntervalloSettimanale(new Date()).fine.setHours(24))];
  if (tipologiaY === 2) dominio = [new Date(getIntervalloMensile(new Date()).inizio), new Date(getIntervalloMensile(new Date()).fine)];
  if (tipologiaY === 3) dominio = [new Date(getIntervalloAnnuale(new Date()).inizio), new Date(getIntervalloAnnuale(new Date()).fine)];

  var arrayFasce = data_formatting(db_fascia, db_data, dominio, tipologiaY, statisticaG);
  //console.log(dominio);

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
  //console.log(arrayX_filtered1);

  var x = d3.scaleBand([0, width]).domain(arrayX_filtered1.slice(inizioFinestra, fineFinestra)).paddingOuter(0).paddingInner(1);

  var x_settings = d3.axisBottom(x);

  //######################################################################################
  //##                                                                                  ##
  //##                       CREAZIONE DELLA SCALA E DELL'ASSE Y                        ##
  //##                                                                                  ##
  //######################################################################################

  var y_settings;
  if (tipologiaY === 1) {
    var y = d3
      .scaleTime()
      .domain([getIntervalloSettimanale(new Date()).inizio.setHours(0), getIntervalloSettimanale(new Date()).fine.setHours(24)])
      .range([0, height]);
    y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%a %d %b %Y"));
  } else if (tipologiaY === 2) {
    var y = d3
      .scaleTime()
      .domain([getIntervalloMensile(new Date()).inizio.setHours(0), getIntervalloMensile(new Date()).fine])
      .range([0, height]);
    y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat("%B  %V %d"));
  } else {
    var y = d3
      .scaleTime()
      .domain([getIntervalloAnnuale(new Date()).inizio.setHours(0), getIntervalloAnnuale(new Date()).fine.setHours(24)])
      .range([0, height]);
    y_settings = d3.axisLeft(y).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%B %Y"));
  }
  //console.log(y.domain());

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
    .attr("height", 900);
  var scatter = svg.append("g").attr("id", "area").attr("transform", `translate(${margin.left}, ${margin.top})`).attr("clip-path", "url(#clip-area)").append("g").attr("id", "dati");

  //######################################################################################
  //##                                                                                  ##
  //##                          CREAZIONE DELLA SCALA DEI COLORI                        ##
  //##                                                                                  ##
  //######################################################################################

  var myColor;
  if (tipologiaY === 1) myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 10]);
  if (tipologiaY === 2) myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 50]);
  if (statisticaG === 1 && tipologiaY === 3) myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 100]);
  if (statisticaG === 2 && tipologiaY === 3) myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 10]);
  if (statisticaG === 3 && tipologiaY === 3) myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 50]);
  if (statisticaG === 4 && tipologiaY === 3) myColor = d3.scaleSequential().interpolator(d3.interpolateRgb("#f4f5f6", "orange")).domain([0, 50]);
  console.log(tipologiaY);
  console.log(statisticaG);

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

  var dragging = true;

  const mouseover = function (event, d) {
    if (dragging) {
      //console.log(event.target.__data__.fascia);
      const [mx, my] = d3.pointer(event);
      tooltip_v2
        .text("Valore: " + Math.floor(d.valore) + " presenze")
        .style("font-size", 1.5 + "rem")
        .style("color", "red")
        .style("visibility", "visible")
        .attr("x", mx + 160 + "px")
        .attr("y", my + 80 + "px");
      tooltip.style("opacity", 0);
      d3.select(this).style("stroke", "#2f6effff" /*d.colore*/).style("stroke-opacity", "0.75").style("stroke-width", "4px").style("opacity", 1);
      d3.select(this).style("background-color", "black");
    }
  };
  const mousemove = function (event, d) {
    if (dragging) {
      const [mx, my] = d3.pointer(event);
      tooltip_v2
        .text("Valore: " + Math.floor(d.valore) + " presenze")
        .style("font-size", 1.5 + "rem")
        .style("color", "red")
        .style("visibility", "visible")
        .attr("x", mx + 160 + "px")
        .attr("y", my + 80 + "px");
      tooltip_v3.style("visibility", "visible");
    }
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

  setDataInChart(scatter, x, y, height, myColor, mouseover, mousemove, mouseleave, tipologiaY, arrayFasce);

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

  const yAxis = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`).style("font-size", 15).attr("class", "yAxis").call(y_settings);

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
      arrayFasce = data_formatting(db_fascia, db_data, [y.domain()[0], y.domain()[y.domain().length - 1]], tipologiaY, statisticaG);
      x = newX;
      updateDataInChart(scatter, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasce);
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
            console.log(fineFinestra);
            console.log(arrayX_filtered2);
            console.log(arrayX_filtered2.slice(inizioFinestra, fineFinestra));
            console.log(arrayX_filtered3.slice(inizioFinestra, fineFinestra));
            console.log(arrayX_filtered4.slice(inizioFinestra, fineFinestra));
            console.log(arrayX_filtered5.slice(inizioFinestra, fineFinestra));
            arrayFasce = data_formatting(db_fascia, db_data, dominio, tipologiaY, statisticaG);
            const arrayFasceRanged = arrayFasce.filter(function (d) {
              if (new Set(x.domain()).has(d.fascia)) {
                return d;
              }
            });
            updateDataInChart(scatter, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasceRanged);
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

  yAxis.on("wheel", function (event) {
    console.log(event);
    event.preventDefault();
    const oggi = new Date();
    const primo_giorno_mese_rispetto_oggi = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

    //Scorri avanti nel tempo
    if (event.deltaY > 0) {
      anno_corrente = anno_corrente + 1;
      offset_settimana = offset_settimana + 7;
      offset_mese = offset_mese + 1;
      var primo_giorno_mese_offset = new Date(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1);
      if (tipologiaY === 1) {
        y = d3
          .scaleTime()
          .domain([
            getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio.setHours(0),
            getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine.setHours(24),
          ])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%a %d %b %y"));
      } else if (tipologiaY === 2) {
        y = d3
          .scaleTime()
          .domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat("%B %V %d"));
        //console.log(y.domain());
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
      var primo_giorno_mese_offset = new Date(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1);
      //console.log("J" + primo_giorno_mese_offset);
      if (tipologiaY === 1) {
        y = d3
          .scaleTime()
          .domain([
            getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio.setHours(0),
            getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine.setHours(24),
          ])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%a %d %b %y"));
      } else if (tipologiaY === 2) {
        y = d3
          .scaleTime()
          .domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine])
          .range([0, height]);
        y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat("%B %V %d"));
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
        new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio.setHours(0)),
        new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine.setHours(24)),
      ];
    if (tipologiaY === 2) dominio = [new Date(getIntervalloMensile(primo_giorno_mese_offset).inizio), new Date(getIntervalloMensile(primo_giorno_mese_offset).fine)];
    if (tipologiaY === 3) dominio = [new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio), new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine)];

    arrayFasce = data_formatting(db_fascia, db_data, dominio, tipologiaY);

    updateDataInChart(scatter, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasce);
  });

  yAxis.call(
    d3
      .drag()
      .on("start", function (event) {
        console.log(posizioneY);
        posizioneY = event.y;
      })
      .on("end", function (event) {
        console.log("SU");
        console.log(vista);

        //console.log(event.y + " - " + posizioneY);
        const oggi = new Date();
        const primo_giorno_mese_rispetto_oggi = new Date(oggi.getFullYear(), oggi.getMonth(), 1);

        //Scorri avanti nel tempo
        if (event.y + 50 < posizioneY) {
          anno_corrente = anno_corrente + 1;
          offset_settimana = offset_settimana + 7;
          offset_mese = offset_mese + 1;
          var primo_giorno_mese_offset = new Date(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1);
          if (tipologiaY === 1) {
            y = d3
              .scaleTime()
              .domain([
                getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio.setHours(0),
                getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine.setHours(24),
              ])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%a %d %b %y"));
          } else if (tipologiaY === 2) {
            y = d3
              .scaleTime()
              .domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat("%B %V %d"));
            //console.log(y.domain());
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
          var primo_giorno_mese_offset = new Date(primo_giorno_mese_rispetto_oggi.getFullYear(), primo_giorno_mese_rispetto_oggi.getMonth() + offset_mese, 1);
          //console.log("J" + primo_giorno_mese_offset);
          if (tipologiaY === 1) {
            y = d3
              .scaleTime()
              .domain([
                getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio.setHours(0),
                getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine.setHours(24),
              ])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat("%a %d %b %y"));
          } else if (tipologiaY === 2) {
            y = d3
              .scaleTime()
              .domain([getIntervalloMensile(primo_giorno_mese_offset).inizio, getIntervalloMensile(primo_giorno_mese_offset).fine])
              .range([0, height]);
            y_settings = d3.axisLeft(y).ticks(d3.timeDay.every(7)).tickFormat(d3.timeFormat("%B %V %d"));
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
            new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).inizio.setHours(0)),
            new Date(getIntervalloSettimanale(d3.utcDay.offset(new Date(), offset_settimana)).fine.setHours(24)),
          ];
        if (tipologiaY === 2) dominio = [new Date(getIntervalloMensile(primo_giorno_mese_offset).inizio), new Date(getIntervalloMensile(primo_giorno_mese_offset).fine)];
        if (tipologiaY === 3) dominio = [new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).inizio), new Date(getIntervalloAnnuale(new Date(anno_corrente, 0, 1)).fine)];

        arrayFasce = data_formatting(db_fascia, db_data, dominio, tipologiaY);

        updateDataInChart(scatter, x, y, height, myColor, tipologiaY, mouseover, mousemove, mouseleave, arrayFasce);
      })
  );
}

function App2() {
  const [periodo, setPeriodo] = React.useState(1);
  const [statistica, setStatistica] = React.useState(1);
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

    document.addEventListener("mousemove", mouseDrag);

    //document.addEventListener('mouseup', mouseDrag);

    if (dati_acquisiti.length !== null) {
      d3.csv("https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Fascia_Oraria&format=csv").then(function (f) {
        d3.csv("https://mrkprojects.altervista.org/dataVis/api.php?table=pingtime_Calendario&format=csv").then(function (data) {
          setDatiAcquisiti(data);
          setFascia(f);
          d3_create_graphic(data, f, periodo, statistica);
        });
      });
    } else {
      d3_create_graphic(dati_acquisiti, fascia, periodo, statistica);
    }

    console.log("we");
    console.log(window.innerWidth);
    console.log(window.innerHeight);
  }, [periodo, spostamento, lock, finestraTemporale, statistica]);

  return (
    <div className={styles.container}>
      <br />
      <br />
      <h1> PRESENZE STAGIONALI </h1>
      <br />
      <br />
      <Select sx={{ minWidth: "200px", marginRight: "20px" }} id="demo-simple-select" value={periodo} label="Periodo" onChange={(event) => setPeriodo(event.target.value)}>
        <MenuItem value={1}>Settimana</MenuItem>
        <MenuItem value={2}>Mese</MenuItem>
        <MenuItem value={3}>Anno</MenuItem>
      </Select>

      {periodo === 3 && (
        <Select sx={{ minWidth: "200px" }} id="demo-simple-selectt" value={statistica} label="Statistica" onChange={(event) => setStatistica(event.target.value)}>
          <MenuItem value={1}>Somma</MenuItem>
          <MenuItem value={2}>Media</MenuItem>
          <MenuItem value={3}>Minimo</MenuItem>
          <MenuItem value={4}>Massimo</MenuItem>
        </Select>
      )}
      <br />
      <br />
      <svg id="my_dataviz" style={{ marginLeft: "0.25vw" }}></svg>
      <br />
    </div>
  );
}

export default App2;
