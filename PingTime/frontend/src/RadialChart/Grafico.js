import * as d3 from "d3";
import styles from "./Grafico.module.css";
import { useEffect } from "react";
import React from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import InputLabel from "@mui/material/InputLabel";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

//Import specifici analisi grafo
const Graph = require("graphology");
const { dijkstra } = require("graphology-shortest-path");
const shortestPath = require("graphology-shortest-path");

//########################################################################################
//##                                                                                    ##
//##                                        UTILITIES                                   ##
//##                                                                                    ##
//########################################################################################

//########################################################################################
//##                                                                                    ##
//##                                THEORETIC DISTANCE                                  ##
//##                                                                                    ##
//########################################################################################

function algoritmoDijkstra(graph, pesato, grafo) {
  // Mappa per salvare tutti i risultati: { 'NodoA': { 'NodoB': 5, ... }, ... }
  const allPairsDistances = {};

  graph.forEachNode((sourceNode) => {
    // Eseguiamo Dijkstra partendo da ogni nodo. Questa funzione restituisce un oggetto con le distanze verso tutti gli altri nodi
    const distances = dijkstra.singleSource(graph, sourceNode);
    allPairsDistances[sourceNode] = distances;
    //----------------------------------------------------------------------------
    for (let i = 0; i < grafo.vertex.length; i++) {
      const path = shortestPath.dijkstra.bidirectional(graph, sourceNode, grafo.vertex[i].id, {
        weightAttribute: "weight",
      });

      if (path === null) {
        if (!pesato)
          allPairsDistances[sourceNode][grafo.vertex[i].id] = {
            path: ["Sconnesso"],
            peso: grafo.vertex.length,
          };
        if (pesato)
          allPairsDistances[sourceNode][grafo.vertex[i].id] = {
            path: ["Sconnesso"],
            peso: 0,
          };
      } else {
        // Calculate total weight of the path
        let totalWeight = 0;
        for (let j = 0; j < path.length - 1; j++) {
          const edge = graph.edge(path[j], path[j + 1]);
          const weight = graph.getEdgeAttribute(edge, "weight");
          totalWeight += weight;
        }
        if (pesato)
          allPairsDistances[sourceNode][grafo.vertex[i].id] = {
            path: allPairsDistances[sourceNode][grafo.vertex[i].id],
            peso: totalWeight,
          };
        else
          allPairsDistances[sourceNode][grafo.vertex[i].id] = {
            path: allPairsDistances[sourceNode][grafo.vertex[i].id],
            peso: totalWeight,
          };
      }
    }
  });

  return allPairsDistances;
}

function createGraphStructure(grafo, pesato) {
  var graph;
  if (pesato) {
    graph = new Graph({ type: "undirected" });
    for (let i = 0; i < grafo.vertex.length; i++) {
      graph.addNode(grafo.vertex[i].id);
    }
    for (let i = 0; i < grafo.links.length; i++) {
      graph.addEdgeWithKey(grafo.links[i].src + " - " + grafo.links[i].dst, grafo.links[i].src, grafo.links[i].dst, { weight: grafo.links[i].weight });
    }
  } else {
    graph = new Graph({ type: "undirected" });

    for (let i = 0; i < grafo.vertex.length; i++) {
      graph.addNode(grafo.vertex[i].id);
    }
    for (let i = 0; i < grafo.links.length; i++) {
      graph.addEdgeWithKey(grafo.links[i].src + " - " + grafo.links[i].dst, grafo.links[i].src, grafo.links[i].dst, { weight: 1 });
    }
  }
  return graph;
}

const getTheoricDistance = (grafo, pesato) => {
  //Creo il grafo con graphology
  const graph = createGraphStructure(grafo, pesato);
  //Lancio Djikstra per ogni nodi. Restituisce la distanza rispetto a tutti i nodi
  var shortestPath = algoritmoDijkstra(graph, pesato, grafo);

  for (let i = 0; i < grafo.vertex.length; i++) {
    grafo.vertex[i].valore = 0;
    for (let j = 0; j < grafo.vertex.length; j++) {
      if (shortestPath[grafo.vertex[i].id][j].peso === 1) {
        grafo.vertex[i].valore = grafo.vertex[i].valore + shortestPath[grafo.vertex[i].id][j].peso;
      }
    }
    //if (!pesato) grafo.vertex[i].valore = Math.round(grafo.vertex[i].valore / (grafo.vertex.length - 1)) / 1;
    if (pesato) grafo.vertex[i].valore = Math.floor(grafo.vertex[i].valore / 10) * 10;

    if (!pesato && grafo.vertex[i].valore === 0) grafo.vertex[i].valore = 38;
    else grafo.vertex[i].valore = 38 - grafo.vertex[i].valore;
  }
  return { grafo: grafo, matrice: shortestPath };
};

//########################################################################################
//##                                                                                    ##
//##                                            D3                                      ##
//##                                                                                    ##
//########################################################################################

const getRaggio = (valore, data) => {
  var count = 0;
  for (let i = 0; i < data.vertex.length; i++) {
    var x = d3.select("#b" + data.vertex[i].id)._groups[0][0].cx.animVal.value;
    var y = d3.select("#b" + data.vertex[i].id)._groups[0][0].cy.animVal.value;
    var raggio = Math.round((x ** 2 + y ** 2) ** (1 / 2));
    if (raggio === valore) {
      count = count + 1;
    }
  }
  return count;
};

const ottimizzaGrafo = (data, pesato) => {
  var grafoElaborato = getTheoricDistance(data, pesato);

  return grafoElaborato;
};

const createGraph = (data, pesato) => {
  var grafoElaborato = data; //ottimizzaGrafo(data, pesato).grafo;
  var matriceDiAdiacenza = ottimizzaGrafo(data, pesato).matrice;

  if (!pesato)
    grafoElaborato.vertex.sort(function (a, b) {
      return d3.ascending(a.valore, b.valore);
    });
  if (pesato)
    grafoElaborato.vertex.sort(function (a, b) {
      return d3.ascending(a.numeroAllenamenti, b.numeroAllenamenti);
    });
  var start;
  if (pesato) start = grafoElaborato.vertex[0].numeroAllenamenti;
  else start = grafoElaborato.vertex[0].valore;
  var ultimo_index = 0;
  var contatore = 0;

  //Per ogni vertice
  if (!pesato)
    for (let i = 0; i < grafoElaborato.vertex.length; i++) {
      //Guardo se è l'ultimo dell'array e se è maggiore dei precedenti
      if (grafoElaborato.vertex.length === i + 1 && grafoElaborato.vertex[i].valore > start) {
        for (let j = i - 1; j >= ultimo_index; j--) {
          grafoElaborato.vertex[j].numero = contatore;
          grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
        }
        grafoElaborato.vertex[i].numero = 1;
        grafoElaborato.vertex[i].coefficiente = 0;

        //Guardo se è l'ultimo elemento dell'array e non è maggiore dei precedenti
      } else if (grafoElaborato.vertex.length === i + 1) {
        for (let j = i; j >= ultimo_index; j--) {
          grafoElaborato.vertex[j].numero = contatore + 1;
          grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
        }

        //Se non è l'ultimo ma ha un valore maggiore del precedente resetto il livello
      } else if (grafoElaborato.vertex[i].valore > start) {
        for (let j = i - 1; j >= ultimo_index; j--) {
          grafoElaborato.vertex[j].numero = contatore;
          grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
        }
        contatore = 1;
        start = grafoElaborato.vertex[i].valore;
        ultimo_index = i;

        //Se non è l'ultimo e non è maggiore del precedente lo conto
      } else {
        contatore = contatore + 1;
      }
    }

  if (pesato)
    for (let i = 0; i < grafoElaborato.vertex.length; i++) {
      //Guardo se è l'ultimo dell'array e se è maggiore dei precedenti
      if (grafoElaborato.vertex.length === i + 1 && grafoElaborato.vertex[i].numeroAllenamenti > start) {
        for (let j = i - 1; j >= ultimo_index; j--) {
          grafoElaborato.vertex[j].numero = contatore;
          grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
        }
        grafoElaborato.vertex[i].numero = 1;
        grafoElaborato.vertex[i].coefficiente = 0;

        //Guardo se è l'ultimo elemento dell'array e non è maggiore dei precedenti
      } else if (grafoElaborato.vertex.length === i + 1) {
        for (let j = i; j >= ultimo_index; j--) {
          grafoElaborato.vertex[j].numero = contatore + 1;
          grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
        }

        //Se non è l'ultimo ma ha un valore maggiore del precedente resetto il livello
      } else if (grafoElaborato.vertex[i].numeroAllenamenti > start) {
        for (let j = i - 1; j >= ultimo_index; j--) {
          grafoElaborato.vertex[j].numero = contatore;
          grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
        }
        contatore = 1;
        start = grafoElaborato.vertex[i].numeroAllenamenti;
        ultimo_index = i;

        //Se non è l'ultimo e non è maggiore del precedente lo conto
      } else {
        contatore = contatore + 1;
      }
    }

  const minLevel = grafoElaborato.vertex[0].valore;
  const maxLevel = grafoElaborato.vertex[grafoElaborato.vertex.length - 1].valore;
  const minLevelAllenamenti = grafoElaborato.vertex[0].numeroAllenamenti;
  const maxLevelAllenamenti = grafoElaborato.vertex[grafoElaborato.vertex.length - 1].numeroAllenamenti;

  /* MIRKO EDIT: zoom adattabile dinamicamente in base al numero di livelli */
  // Calcola il raggio massimo in cui sono posizionati i nodi
  const maxRadius = Math.max(
    pesato ? (maxLevelAllenamenti + 3) * 50 : (maxLevel - minLevel + 3) * 50,
    100 // minimo di sicurezza
  );

  // Dimensione della viewport
  const viewportSize = window.innerHeight * 1;

  // kMax dovrebbe garantire che il grafo intero sia visibile
  // 0.9 margine di sicurezza
  const kMax = (0.9 * viewportSize) / (2 * maxRadius);
  /* MIRKO EDIT END */

  //const kMax = 0.005;
  var myColor;
  if (pesato) myColor = d3.scaleSequential([minLevelAllenamenti - 10, maxLevelAllenamenti + 10], d3.interpolateRdYlGn);
  else myColor = d3.scaleSequential([minLevel - 50, maxLevel + 10], d3.interpolateRdYlGn);

  d3.select("#Prova").selectAll("*").remove(); // Clear previous content
  const svg = d3
    .select("#Prova")
    .attr("margin-left", window.innerWidth * 0.1)
    .attr("width", window.innerHeight * 1)
    .attr("height", window.innerHeight * 1); //.append("svg").attr("width", 1800).attr("height", 900);
  const chart = svg
    .append("g")
    .attr("id", "c")
    .attr("transform", `translate(${(window.innerHeight * 1) / 2}, ${(window.innerHeight * 1) / 2})`);
  chart.append("path").datum(data).attr("id", "l").attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2);

  //##################################################################################################
  //##                                                                                              ##
  //##                                            TOOLTIP                                           ##
  //##                                                                                              ##
  //##################################################################################################
  const tooltip = d3.select("#Prova").append("g").style("display", "none");

  const tooltipRect = tooltip
    .append("rect")
    .attr("fill", "#ffffff")
    .attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("rx", 5) // Rounded corners (optional)
    .attr("ry", 5);

  const tooltipText = tooltip.append("text").attr("x", 5).attr("y", 5).style("font-size", "12px");

  //##################################################################################################
  //##                                                                                              ##
  //##                                           LEGENDA                                            ##
  //##                                                                                              ##
  //##################################################################################################

  // Create legend content group (hidden by default)
  const legend = svg.append("g").attr("id", "legend").style("display", "none");

  legend
    .append("text")
    .attr("x", 10)
    .attr("y", 20)
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .text(!pesato ? "MODALITA' 1" : "MODALITA' 2");

  // Create legend entries DA MODIFICARE!
  let legendY = 45;
  const legendEntries = pesato
    ? [
        { label: "Diverso gruppo", color: "#ff8000ff" },
        { label: "Stesso gruppo", color: "#ff770013" },
      ]
    : [
        { label: "Allenato con", color: "#004cffff" },
        { label: "Non allenato con", color: "#db0d0d1e" },
      ];

  legendEntries.forEach((entry, index) => {
    legend
      .append("rect")
      .attr("x", 10)
      .attr("y", legendY + index * 25)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", entry.color)
      .attr("stroke", "black")
      .attr("stroke-width", 2);

    legend
      .append("text")
      .attr("x", 30)
      .attr("y", legendY + index * 25 + 12)
      .style("font-size", "12px")
      .style("fill", "black")
      .text(entry.label);
  });

  // Add color scale element
  const colorScaleY = legendY + legendEntries.length * 25 + 10;
  const colorScaleWidth = 120;
  const colorScaleHeight = 15;

  // Create gradient for color scale
  const gradientId = "colorScaleGradient";
  const gradient = svg.append("defs").append("linearGradient").attr("id", gradientId).attr("x1", "0%").attr("x2", "100%");

  gradient.append("stop").attr("offset", "0%").attr("stop-color", d3.interpolateRdYlGn(0)).attr("stop-opacity", 0.5);

  gradient.append("stop").attr("offset", "100%").attr("stop-color", d3.interpolateRdYlGn(1)).attr("stop-opacity", 0.5);

  // Color scale rectangle
  legend
    .append("rect")
    .attr("x", 10)
    .attr("y", colorScaleY)
    .attr("width", colorScaleWidth)
    .attr("height", colorScaleHeight)
    .attr("fill", `url(#${gradientId})`)
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  // Label on the left
  legend
    .append("text")
    .attr("x", 10)
    .attr("y", colorScaleY + colorScaleHeight + 15)
    .style("font-size", "12px")
    .style("fill", "black")
    .text("Pessimo");

  // Label "B" on the right
  legend
    .append("text")
    .attr("x", 10 + colorScaleWidth)
    .attr("y", colorScaleY + colorScaleHeight + 15)
    .style("font-size", "12px")
    .style("fill", "black")
    .style("text-anchor", "end")
    .text("Buono");

  // Calculate legend dimensions
  const legendContent = legend.node().getBBox();
  const legendWidth = legendContent.width + 20;
  const legendHeight = legendContent.height + 20;

  // Add background rect AFTER calculating dimensions, positioned at (0,0)
  legend
    .insert("rect", ":first-child")
    .attr("fill", "#ffffff")
    .attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("rx", 5)
    .attr("ry", 5)
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", legendWidth)
    .attr("height", legendHeight);

  // Position legend at top-right corner with extra spacing for icon
  const svgWidth = window.innerHeight * 1;

  legend.attr("transform", `translate(${svgWidth - legendWidth - 60}, 20)`);

  // Create legend toggle icon (info symbol)
  const legendIcon = svg.append("g").attr("id", "legend-icon");

  const iconCircle = legendIcon
    .append("circle")
    .attr("cx", svgWidth - 30)
    .attr("cy", 30)
    .attr("r", 15)
    .attr("fill", "#ffffff")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .style("cursor", "pointer");

  legendIcon
    .append("text")
    .attr("x", svgWidth - 30)
    .attr("y", 37)
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .style("fill", "black")
    .style("text-anchor", "middle")
    .style("pointer-events", "none")
    .text("?");

  // Toggle legend visibility on hover
  legendIcon
    .on("mouseenter", function () {
      legend.style("display", null);
      iconCircle.attr("fill", "#e8e8e8");
    })
    .on("mouseleave", function () {
      legend.style("display", "none");
      iconCircle.attr("fill", "#ffffff");
    });
  //################################################################################################################
  //##                                                                                                            ##
  //##                                              CREAZIONE ASSI                                                ##
  //##                                                                                                            ##
  //################################################################################################################
  var max;
  if (pesato) max = Math.max(maxLevelAllenamenti, 20);
  else max = Math.max(maxLevel - minLevel, 20);
  for (let i = max * 100; i >= 100; i = i - 50) {
    chart
      .append("circle")
      .attr("class", "axis-circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", i)
      .attr("stroke", "steelblue")
      .attr("stroke-width", 0.5)
      .attr("fill", "#ffffff")
      .on("mousemove", function (event, d) {
        var count = getRaggio(i, data);
        d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
        tooltip.style("display", null);
        tooltip.attr("transform", `translate(${140}, ${30})`);
        const bbox = tooltipText.node().getBBox();
        tooltipText
          .text("Numero giocatori: " + count)
          .attr("x", -bbox.width)
          .attr("y", bbox.height);

        tooltipRect
          .attr("width", bbox.width + 100)
          .attr("height", bbox.height + 30)
          .attr("x", -bbox.width - 10)
          .attr("y", bbox.height - 25);
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
        tooltip.style("display", "none");
      });
  }

  //var zoom = 1;
  /* MIRKO EDIT: zoom iniziale minimo, overview first */
  //var zoom = 1;
  var zoom = kMax;

  const zoomBehavior = d3
    .zoom()
    .scaleExtent([kMax, 4])
    .on("zoom", function (event) {
      event.transform.x = window.innerHeight / 2;
      event.transform.y = window.innerHeight / 2;
      zoom = event.transform.k;
      d3.select("#c").attr("transform", event.transform);
    });

  d3.select("#c")
    .call(zoomBehavior)
    .call(zoomBehavior.transform, d3.zoomIdentity.translate(window.innerHeight / 2, window.innerHeight / 2).scale(kMax));

  d3.select("#c").call(zoomBehavior);

  d3.select("#c").attr("transform", d3.zoomIdentity.translate(window.innerHeight / 2, window.innerHeight / 2).scale(kMax));

  // Etichette linee
  chart.append("line").attr("class", "axis-label").attr("x1", 0).attr("y1", -8000).attr("x1", 0).attr("y2", 8000).attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("line").attr("class", "axis-label").attr("x1", -8000).attr("y1", 0).attr("x2", 8000).attr("y2", 0).attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("line").attr("class", "axis-label").attr("x1", 8000).attr("y1", 8000).attr("x2", -8000).attr("y2", -8000).attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("line").attr("class", "axis-label").attr("x1", 8000).attr("y1", -8000).attr("x2", -8000).attr("y2", 8000).attr("stroke", "steelblue").attr("stroke-width", 0.5);

  //##################################################################################################
  //##                                                                                              ##
  //##                                     INSERIMENTO DATI                                         ##
  //##                                                                                              ##
  //##################################################################################################

  chart
    .selectAll()
    .data(grafoElaborato.vertex)
    .join("circle")
    .attr("class", "cc")
    .attr("id", function (d) {
      return "b" + d.id;
    })
    .attr("stroke", "black")
    .attr("stroke-width", 4)
    .attr("cx", function (d) {
      var angoloGradi = Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente);
      if (!pesato) {
        return angoloGradi * (d.valore - minLevel + 3) * 50;
      } else {
        return angoloGradi * (d.numeroAllenamenti + 3) * 50;
      }
      //return Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100;
    })
    .attr("cy", function (d) {
      var angoloGradi = Math.sin((((360 / d.numero) * Math.PI) / 180) * d.coefficiente);
      if (!pesato) {
        return angoloGradi * (d.valore - minLevel + 3) * 50;
      } else {
        return angoloGradi * (d.numeroAllenamenti + 3) * 50;
      }

      //return Math.sin((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100;
    })
    .attr("r", function (d) {
      if (d.selezionato) return 40;
      else return 15;
    })
    .attr("fill", function (d) {
      if (pesato) return myColor(d.numeroAllenamenti);
      else return myColor(maxLevel - d.valore);
    })
    .text(function (d) {
      return d.id;
    })
    .on("mouseover", function (event, d) {
      var x = d3.select(this)._groups[0][0].cx.animVal.value + 30;
      var y = d3.select(this)._groups[0][0].cy.animVal.value + 30;
      //d3.select(this).style("r", 25);
      d3.select(this).attr("stroke", "orange");
      tooltip.style("display", null);
      var bbox = tooltipText.node().getBBox();
      if (x < window.innerHeight / 2 - x * zoom - 25 && y < window.innerHeight / 2 - y * zoom - 25) {
        tooltip.attr("transform", `translate(${window.innerHeight / 2 + x * zoom + 25}, ${window.innerHeight / 2 + y * zoom + 25})`);
      }
      if (x < window.innerHeight / 2 - x * zoom - 25 && y >= window.innerHeight / 2 - y * zoom - 25) {
        tooltip.attr("transform", `translate(${window.innerHeight / 2 + x * zoom + 25}, ${window.innerHeight / 2 + y * zoom - 50})`);
      }
      if (x >= window.innerHeight / 2 - x * zoom - 25 && y < window.innerHeight / 2 - y * zoom - 25) {
        tooltip.attr("transform", `translate(${window.innerHeight / 2 + x * zoom - 50}, ${window.innerHeight / 2 + y * zoom + 25})`);
      }
      if (x >= window.innerHeight / 2 - x * zoom - 25 && y >= window.innerHeight / 2 - y * zoom - 25) {
        tooltip.attr("transform", `translate(${window.innerHeight / 2 + x * zoom - 50}, ${window.innerHeight / 2 + y * zoom - 50})`);
      }

      tooltipText.text(d.nome).attr("x", 0).attr("y", 0);

      bbox = tooltipText.node().getBBox();
      tooltipRect
        .attr("width", bbox.width + 20)
        .attr("height", 30)
        .attr("x", -10)
        .attr("y", -20);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "black");
      tooltip.style("display", "none");
      //d3.select(this).style("r", 12.5); // Log data value
    });

  d3.selectAll(".cc").on("click", function (event) {
    for (let i = 0; i < data.vertex.length; i++) {
      data.vertex[i].selezionato = false;
      d3.select("#b" + data.vertex[i].id)
        .attr("stroke", "black")
        .attr("stroke-width", 4);
      if (this.id.replace("b", "") === data.vertex[i].id + "") data.vertex[i].selezionato = true;
      d3.select("#b" + data.vertex[i].id).attr("r", 15);
    }
    if (!pesato) {
      for (let i = 0; i < data.vertex.length; i++) {
        d3.select("#b" + data.vertex[i].id).attr("fill", "orange");
      }
      for (let i = 0; i < data.vertex.length; i++) {
        if (matriceDiAdiacenza[this.id.replace("b", "")][data.vertex[i].id].peso === 1) {
          d3.select("#b" + data.vertex[i].id).attr("fill", "#0077e7ff");
          d3.select("#b" + data.vertex[i].id).attr("r", 20);
        }
        if (matriceDiAdiacenza[this.id.replace("b", "")][data.vertex[i].id].peso !== 1) {
          d3.select("#b" + data.vertex[i].id).attr("fill", "#7a000031");
        }
      }
    }
    if (pesato) {
      for (let i = 0; i < data.vertex.length; i++) {
        d3.select("#b" + data.vertex[i].id).attr("fill", "orange");
      }
      for (let i = 0; i < data.vertex.length; i++) {
        if (matriceDiAdiacenza[this.id.replace("b", "")][data.vertex[i].id].peso === 0) {
          d3.select("#b" + data.vertex[i].id).attr("fill", "#ff8800ff");
        }
        if (matriceDiAdiacenza[this.id.replace("b", "")][data.vertex[i].id].peso !== 0) {
          d3.select("#b" + data.vertex[i].id).attr("fill", "#ff880017");
        }
      }
    }
    d3.select(this).attr("fill", "#0077e7ff");
    d3.select(this).attr("r", 40);
    event.stopPropagation();
  });
  chart.on("click", function () {
    for (let i = 0; i < data.vertex.length; i++) {
      if (pesato)
        d3.select("#b" + data.vertex[i].id)
          .attr("fill", myColor(data.vertex[i].numeroAllenamenti))
          .attr("r", 15)
          .attr("stroke", "black")
          .attr("stroke-width", 4);
      else
        d3.select("#b" + data.vertex[i].id)
          .attr("fill", myColor(maxLevel - data.vertex[i].valore))
          .attr("r", 15)
          .attr("stroke", "black")
          .attr("stroke-width", 4);
      data.vertex[i].selezionato = false;
    }
  });
  return grafoElaborato.vertex;
};

//########################################################################################
//##                                                                                    ##
//##                                  FRONTEND IN REACT                                 ##
//##                                                                                    ##
//########################################################################################

function RadialCharts() {
  const [pesato, setPesato] = React.useState(false);
  const [settimane, setSettimane] = React.useState(2);
  const [anno, setAnno] = React.useState(2026);
  const [data, setData] = React.useState(dayjs());
  const [start, setStart] = React.useState(true);
  const [nodes, setNodes] = React.useState();
  const [links, setLinks] = React.useState();
  var weekYear = require("dayjs/plugin/weekYear");
  var weekOfYear = require("dayjs/plugin/weekOfYear");
  dayjs.extend(weekYear);
  dayjs.extend(weekOfYear);

  dayjs().weekYear();

  useEffect(() => {
    const stringa = process.env.REACT_APP_ADJMATRIX + "?interval=W&index=" + settimane + "&year=" + anno;
    if (start) {
      //Prossimante le posizioni x e y dovranno non essere randomiche ma essere calcolate tramite la graph teorethic distance (shortest path)
      d3.json(process.env.REACT_APP_PLAYER_LIST).then((vertici) => {
        for (let i = 0; i < vertici.length; i++) {
          vertici[i] = {
            id: i,
            nome: vertici[i].alias,
            valore: 0,
            numeroAllenamenti: 0,
          };
        }

        setNodes(vertici);
        d3.json(stringa).then((archi) => {
          var archiElaborato = archi.filter((d) => {
            var lock1 = false;
            var lock2 = false;
            for (let i = 0; i < vertici.length; i++) {
              if (d.src === vertici[i].nome) {
                d.src = vertici[i].id;
                lock1 = true;
              }
              if (d.dst === vertici[i].nome) {
                d.dst = vertici[i].id;
                lock2 = true;
              }
              if (lock1 && lock2) return d;
            }
            return false;
          });
          for (let i = 0; i < vertici.length; i++) {
            for (let j = 0; j < archi.length; j++) {
              if (vertici[i].id === archi[j].src || vertici[i].id === archi[j].dst) {
                vertici[i].valore = vertici[i].valore + 1;
                vertici[i].numeroAllenamenti = vertici[i].numeroAllenamenti + archi[j].weight;
              }
            }
            vertici[i].numeroAllenamenti = Math.floor(vertici[i].numeroAllenamenti / 5) * 5;
            vertici[i].selezionato = false;
          }
          setLinks(archiElaborato);
          setStart(false);

          setNodes(createGraph({ vertex: vertici, links: archiElaborato }, pesato));
        });
      });
    }
    if (!start) {
      setNodes(createGraph({ vertex: nodes, links: links }, pesato));
    }
  }, [pesato, data, anno, settimane, start, links, nodes]);

  return (
    <div className={styles.container}>
      <h1>RELAZIONI TRA ISCRITTI</h1>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          sx={{ width: "300px" }}
          value={data}
          onChange={(value) => {
            setData(value);
            if (value.year() > 2000) {
              setAnno(value.year());
              setSettimane(value.week());
            }
            setStart(true);
          }}
          label="Seleziona settimana"
        />
      </LocalizationProvider>
      <br />
      <br />
      <InputLabel>
        Selezionare il metodo di visualizzazione tramite il <b>pulsante toggle</b>.
      </InputLabel>
      <InputLabel>
        Selezionare tramite <b>calendario</b> la settimana che si vuole monitorare
      </InputLabel>
      {pesato && (
        <InputLabel>
          In questa modalità <b>cliccando su un giocatore</b> si può monitorare quali giocatori nè il suddetto nè tutti i suoi compagni di allenamento non hanno mai giocato (è possibile valutare
          gruppi statici).
        </InputLabel>
      )}
      {!pesato && (
        <InputLabel>
          In questa modalità <b>cliccando su un giocatore</b> si può monitorare con quali altri giocatori ha effettuato allenamenti insieme (colore blu) e con quali non ha mai giocato (in
          trasparenza).
        </InputLabel>
      )}
      <InputLabel>
        <b>Cliccando su un giocatore</b> viene mantenuto il riferimento allo stesso tra le varie modalità.
      </InputLabel>
      <InputLabel>
        <b>Cliccando sullo spazio vuoto</b> si deseleziona il giocatore scelto.
      </InputLabel>
      <InputLabel>
        <b>Passando con il mouse</b> su una circonferenza è possibile vedere facilmente quanti giocatori ci sono.
      </InputLabel>
      <InputLabel>
        Tramite <b>rotella del mouse</b> è possibile effettuare lo zoom in e out sul grafico.
      </InputLabel>
      <br />
      <br />
      <div className={styles.container_flex}>
        <div className={styles.flex}>
          <h5>Persone che hanno giocato con più giocatori al centro</h5>
          <FormControlLabel
            control={
              <Switch
                onChange={() => {
                  setPesato(!pesato);
                }}
              />
            }
          />
          <h5>Persone con meno allenamenti al centro</h5>
        </div>
      </div>
      <br />
      <svg id="Prova" className={styles.area_disegno} />
      <br />
    </div>
  );
}

export default RadialCharts;
