import * as d3 from "d3";
import styles from "./Grafico.module.css";
import { useEffect } from "react";
import React from "react";
import Button from "@mui/material/Button";

//Import specifici analisi grafo
const Graph = require("graphology");
const { dijkstra } = require("graphology-shortest-path");
const { connectedComponents } = require("graphology-components");

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

function getConnectivity(grafo) {
  console.log(grafo);
  const connected = connectedComponents(grafo);
  return connected;
}

function algoritmoDijkstra(graph) {
  // Mappa per salvare tutti i risultati: { 'NodoA': { 'NodoB': 5, ... }, ... }
  const allPairsDistances = {};

  graph.forEachNode((sourceNode) => {
    // Eseguiamo Dijkstra partendo da ogni nodo. Questa funzione restituisce un oggetto con le distanze verso tutti gli altri nodi
    const distances = dijkstra.singleSource(graph, sourceNode);
    allPairsDistances[sourceNode] = distances;
  });
  // Esempio: Distanza tra A e B
  return allPairsDistances;
}

const getTheoricDistance = (grafo) => {
  //Creo il grafo con graphology
  const graph = new Graph({ type: "undirected" });
  for (let i = 0; i < grafo.vertex.length; i++) graph.addNode(grafo.vertex[i].id);
  for (let i = 0; i < grafo.links.length; i++) graph.addEdge(grafo.links[i].source.id, grafo.links[i].target.id);
  const connesso = getConnectivity(graph);
  console.log(connesso);
  //Lancio Djikstra per ogni nodi. Restituisce la distanza rispetto a tutti i nodi
  var shortestPath = algoritmoDijkstra(graph);

  for (let i = 0; i < grafo.vertex.length; i++) {
    grafo.vertex[i].valore = 0;
    for (let j = 0; j < grafo.vertex.length; j++) {
      if (shortestPath[i][j] !== undefined) grafo.vertex[i].valore = grafo.vertex[i].valore + shortestPath[i][j].length - 1;
      else grafo.vertex[i].valore = grafo.vertex[i].valore + grafo.vertex.length + 1;
    }
    grafo.vertex[i].valore = Math.ceil(((grafo.vertex[i].valore / grafo.vertex.length) * 10) / grafo.vertex.length);
  }
  console.log(grafo);
  return grafo;
};

//########################################################################################
//##                                                                                    ##
//##                                            D3                                      ##
//##                                                                                    ##
//########################################################################################

const ottimizzaGrafo = (data) => {
  var grafoElaborato = getTheoricDistance(data);

  return grafoElaborato;
};

const createGraph = (data) => {
  var grafoElaborato = ottimizzaGrafo(data);

  grafoElaborato.vertex.sort(function (a, b) {
    return d3.ascending(a.valore, b.valore);
  });

  var start = grafoElaborato.vertex[0].valore;
  var ultimo_index = 0;
  var contatore = 0;
  for (let i = 0; i < grafoElaborato.vertex.length; i++) {
    if (grafoElaborato.vertex.length === i + 1) {
      for (let j = i; j >= ultimo_index; j--) {
        grafoElaborato.vertex[j].numero = contatore + 1;
        grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
      }
    } else if (grafoElaborato.vertex[i].valore > start) {
      for (let j = i - 1; j >= ultimo_index; j--) {
        grafoElaborato.vertex[j].numero = contatore;
        grafoElaborato.vertex[j].coefficiente = j - ultimo_index;
      }
      contatore = 1;
      start = grafoElaborato.vertex[i].valore;
      ultimo_index = i;
    } else {
      contatore = contatore + 1;
    }
  }

  const minLevel = grafoElaborato.vertex[0].valore;
  const maxLevel = grafoElaborato.vertex[grafoElaborato.vertex.length-1].valore;

  console.log(grafoElaborato.vertex);
  d3.select("#Prova").selectAll("*").remove(); // Clear previous content
  const svg = d3.select("#Prova").append("svg").attr("width", 1800).attr("height", 900);
  const chart = svg
    .append("g")
    .attr("id", "c")
    .attr("transform", `translate(${1800 / 2}, ${900 / 2})`);
  chart.append("path").datum(data).attr("id", "l").attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 2);

  chart.append("circle").attr("class", "axis-circle").attr("cx", 0).attr("cy", 0).attr("r", 400).attr("stroke", "steelblue").attr("stroke-width", 1).attr("fill", "#ffffff");
  chart.append("circle").attr("class", "axis-circle").attr("cx", 0).attr("cy", 0).attr("r", 300).attr("stroke", "steelblue").attr("stroke-width", 1).attr("fill", "#ffffff");
  chart.append("circle").attr("class", "axis-circle").attr("cx", 0).attr("cy", 0).attr("r", 200).attr("stroke", "steelblue").attr("stroke-width", 1).attr("fill", "#ffffff");
  chart.append("circle").attr("class", "axis-circle").attr("cx", 0).attr("cy", 0).attr("r", 100).attr("stroke", "steelblue").attr("stroke-width", 1).attr("fill", "#ffffff");

  // Etichette raggio
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -105).text("1").attr("stroke", "steelblue").attr("stroke-width", 1);
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -205).text("2").attr("stroke", "steelblue").attr("stroke-width", 1);
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -305).text("3").attr("stroke", "steelblue").attr("stroke-width", 1);
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -405).text("4").attr("stroke", "steelblue").attr("stroke-width", 1);

  // Etichette linee
  chart.append("line").attr("class", "axis-label").attr("x1", 0).attr("y1", -430).attr("x1", 0).attr("y2", 430).attr("stroke", "steelblue").attr("stroke-width", 1);
  chart.append("line").attr("class", "axis-label").attr("x1", -430).attr("y1", 0).attr("x2", 430).attr("y2", 0).attr("stroke", "steelblue").attr("stroke-width", 1);
  chart.append("line").attr("class", "axis-label").attr("x1", 300).attr("y1", 300).attr("x2", -300).attr("y2", -300).attr("stroke", "steelblue").attr("stroke-width", 1);
  chart.append("line").attr("class", "axis-label").attr("x1", 300).attr("y1", -300).attr("x2", -300).attr("y2", 300).attr("stroke", "steelblue").attr("stroke-width", 1);

  chart
    .selectAll()
    .data(grafoElaborato.vertex)
    .join("circle")
    .attr("class", "cc")
    .attr("cx", function (d) {
      //console.log(d.id);
      return Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * ((maxLevel-minLevel)/maxLevel*(d.valore - 5)) * 100;
    })
    .attr("cy", function (d) {
      return Math.sin((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * ((maxLevel-minLevel)/maxLevel*(d.valore - 5)) * 100;
    })
    .attr("r", function (d) {
      return 5;
    })
    .attr("fill", "#1f77b4");
  chart
    .selectAll()
    .data(grafoElaborato.vertex)
    .join("text")
    .text(function (d) {
      return d.id;
    })
    .attr("class", "tt")
    .attr("x", function (d) {
      return Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - 6) * 100;
    })
    .attr("y", function (d) {
      return Math.sin((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - 6) * 100;
    });
};

//########################################################################################
//##                                                                                    ##
//##                                  FRONTEND IN REACT                                 ##
//##                                                                                    ##
//########################################################################################

function App5() {
  const [periodo, setPeriodo] = React.useState(false);

  useEffect(() => {
    //Prossimante le posizioni x e y dovranno non essere randomiche ma essere calcolate tramite la graph teorethic distance (shortest path)
    const nodes = Array.from({ length: 1000 }, (_, i) => ({ id: i, x: Math.random() * 1700 + 10, y: Math.random() * 700 + 10, r: 20 }));
    const links = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.8) {
          links.push({ source: nodes[i], target: nodes[j] });
        }
      }
    }
    var pp = new Array(500);
    for (let i = 0; i < pp.length; i++) {
      pp[i] = links[i * 2];
    }

    createGraph({ vertex: nodes, links: pp });
  }, [periodo]);

  return (
    <div className={styles.container}>
      <h1>RELAZIONI TRA ISCRITTI</h1>
      <Button variant="contained" onClick={() => setPeriodo(!periodo)}>
        RIGENERA
      </Button>
      <svg id="Prova" width={1800} height={900} />
    </div>
  );
}

export default App5;
