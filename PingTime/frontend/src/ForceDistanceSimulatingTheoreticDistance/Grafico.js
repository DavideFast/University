import * as d3 from "d3";
import styles from "./Grafico.module.css";
import { useEffect } from "react";
import React from "react";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

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

function createGraphStructure(grafo, pesato) {
  var graph;
  if (pesato) {
    graph = new Graph({ type: "undirected" });
    for (let i = 0; i < grafo.vertex.length; i++) {
      graph.addNode(grafo.vertex[i].id);
      console.log(grafo.vertex[i].id);
    }
    for (let i = 0; i < grafo.links.length; i++) graph.addEdgeWithKey(grafo.links[i].src + " - " + grafo.links[i].dst, grafo.links[i].src, grafo.links[i].dst, { weight: grafo.links[i].weight });
  } else {
    graph = new Graph({ type: "undirected" });

    for (let i = 0; i < grafo.vertex.length; i++) {
      graph.addNode(grafo.vertex[i].id);
      console.log("         " + grafo.vertex[i]);
    }
    for (let i = 0; i < grafo.links.length; i++) {
      console.log(grafo.links[i].src);
      graph.addEdge(grafo.links[i].src, grafo.links[i].dst);
    }
  }
  console.log(graph);
  return graph;
}

const getTheoricDistance = (grafo, pesato) => {
  //Creo il grafo con graphology
  const graph = createGraphStructure(grafo, pesato);
  const connesso = getConnectivity(graph);
  console.log(connesso);
  //Lancio Djikstra per ogni nodi. Restituisce la distanza rispetto a tutti i nodi
  var shortestPath = algoritmoDijkstra(graph);
  console.log(shortestPath);

  for (let i = 0; i < grafo.vertex.length; i++) {
    grafo.vertex[i] = { id: grafo.vertex[i], valore: 0 };
    console.log(grafo.vertex[i]);
    for (let j = 0; j < grafo.vertex.length; j++) {
      if (shortestPath[i][j] !== undefined) {
        console.log(i + " - " + j);
        grafo.vertex[i].valore = grafo.vertex[i].valore + shortestPath[i][j].length - 1;
      } else grafo.vertex[i].valore = grafo.vertex[i].valore + grafo.vertex.length + 1;
    }
    grafo.vertex[i].valore = Math.trunc((((grafo.vertex[i].valore / grafo.vertex.length) * 100) / grafo.vertex.length) * 2) / 2;
  }
  console.log(grafo);
  return grafo;
};

//########################################################################################
//##                                                                                    ##
//##                                            D3                                      ##
//##                                                                                    ##
//########################################################################################

const ottimizzaGrafo = (data, pesato) => {
  var grafoElaborato = getTheoricDistance(data, pesato);

  return grafoElaborato;
};

const createGraph = (data, pesato) => {
  var grafoElaborato = ottimizzaGrafo(data, pesato);

  grafoElaborato.vertex.sort(function (a, b) {
    return d3.ascending(a.valore, b.valore);
  });

  var start = grafoElaborato.vertex[0].valore;
  var ultimo_index = 0;
  var contatore = 0;
  //Per ogni vertice
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
      console.log("Entrato " + i);
      contatore = 1;
      start = grafoElaborato.vertex[i].valore;
      ultimo_index = i;

      //Se non è l'ultimo e non è maggiore del precedente lo conto
    } else {
      console.log("Entrato " + i);
      contatore = contatore + 1;
    }
  }

  const minLevel = grafoElaborato.vertex[0].valore;
  const maxLevel = grafoElaborato.vertex[grafoElaborato.vertex.length - 1].valore;

  if (pesato) var myColor = d3.scaleSequential([1, 20], d3.interpolateTurbo);
  else var myColor = d3.scaleSequential([1, 10], d3.interpolateTurbo);
  console.log(window);

  d3.select("#Prova").selectAll("*").remove(); // Clear previous content
  const svg = d3
    .select("#Prova")
    .attr("margin-left", window.innerWidth * 0.1)
    .attr("width", window.innerHeight * 0.75)
    .attr("height", window.innerHeight * 0.75); //.append("svg").attr("width", 1800).attr("height", 900);
  const chart = svg
    .append("g")
    .attr("id", "c")
    .attr("transform", `translate(${(window.innerHeight * 0.75) / 2}, ${(window.innerHeight * 0.75) / 2})`);
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
    .attr("rx", 5) // Rounded corners (optional)
    .attr("ry", 5)
    .append("text")
    .text("PRova");

  const tooltipText = tooltip.append("text").attr("fill", "white").attr("x", 5).attr("y", -5).style("font-size", "12px");
  //################################################################################################################
  //##                                                                                                            ##
  //##                                              CREAZIONE ASSI                                                ##
  //##                                                                                                            ##
  //################################################################################################################

  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 750)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 700)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 650)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 600)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 550)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 500)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 450)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 400)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 350)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 300)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 250)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 200)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 150)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
    });
  chart
    .append("circle")
    .attr("class", "axis-circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 100)
    .attr("stroke", "steelblue")
    .attr("stroke-width", 0.5)
    .attr("fill", "#ffffff")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "orange").attr("stroke-width", 2.5);
      tooltip.style("display", null);
      tooltip.attr("transform", `translate(${event.clientX}, ${event.clientY}`);
      tooltipText.text("Prova");
      const bbox = tooltipText.node().getBBox();
      tooltipRect
        .attr("width", bbox.width + 100)
        .attr("height", bbox.height + 100)
        .attr("x", 100)
        .attr("y", -bbox.height + 100);
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).attr("stroke", "steelblue").attr("stroke-width", 0.5);
      tooltip.style("display", "none");
    });

  // Etichette raggio
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -105).text("1").attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -205).text("2").attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -305).text("3").attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("text").attr("class", "axis-label").attr("x", 10).attr("y", -405).text("4").attr("stroke", "steelblue").attr("stroke-width", 0.5);

  // Etichette linee
  chart.append("line").attr("class", "axis-label").attr("x1", 0).attr("y1", -1000).attr("x1", 0).attr("y2", 1000).attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("line").attr("class", "axis-label").attr("x1", -1000).attr("y1", 0).attr("x2", 1000).attr("y2", 0).attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("line").attr("class", "axis-label").attr("x1", 1000).attr("y1", 1000).attr("x2", -1000).attr("y2", -1000).attr("stroke", "steelblue").attr("stroke-width", 0.5);
  chart.append("line").attr("class", "axis-label").attr("x1", 1000).attr("y1", -1000).attr("x2", -1000).attr("y2", 1000).attr("stroke", "steelblue").attr("stroke-width", 0.5);

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
    .attr("cx", function (d) {
      return Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100;
    })
    .attr("cy", function (d) {
      return Math.sin((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100;
    })
    .attr("r", function (d) {
      return 12.5;
    })
    .attr("fill", function (d) {
      return myColor(d.valore);
    })
    .text(function (d) {
      return d.id;
    })
    .on("mouseover", function (event, d) {
      d3.select(this).style("fill", "orange"); // Change color on hover
      console.log(`Mouse over: ${d}`); // Log data value
    })
    .on("mouseleave", function (event, d) {
      d3.select(this).style("fill", function (d) {
        return myColor(d.valore);
      }); // Log data value
    });
  /*chart
    .selectAll()
    .data(grafoElaborato.vertex)
    .join("text")
    .text(function (d) {
      return d.id;
    })
    .attr("stroke", "white")
    .attr("stroke-width", "1px")
    .attr("class", "tt")
    .attr("x", function (d) {
      if (d.id > 9) return Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100 - 9;
      if (d.id <= 9) return Math.cos((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100 - 4;
    })
    .attr("y", function (d) {
      return Math.sin((((360 / d.numero) * Math.PI) / 180) * d.coefficiente) * (d.valore - minLevel + 2) * 100 + 5;
    });*/
};

//########################################################################################
//##                                                                                    ##
//##                                  FRONTEND IN REACT                                 ##
//##                                                                                    ##
//########################################################################################

function App5() {
  const [pesato, setPesato] = React.useState(false);
  const [start, setStart] = React.useState(true);
  const [nodes, setNodes] = React.useState();
  const [links, setLinks] = React.useState();

  useEffect(() => {
    if (start) {
      //Prossimante le posizioni x e y dovranno non essere randomiche ma essere calcolate tramite la graph teorethic distance (shortest path)
      d3.json("https://mrkprojects.altervista.org/dataVis/playerList.php").then((vertici) => {
        for (let i = 0; i < vertici.length; i++) vertici[i] = { id: i, nome: vertici[i] };
        setNodes(vertici);
        console.log(vertici);
        d3.json("https://mrkprojects.altervista.org/dataVis/adjMatrix.php?interval=W&index=40").then((archi) => {
          console.log(vertici);
          console.log(archi);
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
          });
          setLinks(archiElaborato);
          setStart(false);

          createGraph({ vertex: vertici, links: archiElaborato }, pesato);
        });
      });
    }
    if (!start) {
      createGraph({ vertex: nodes, links: links }, pesato);
    }
  }, [pesato]);

  return (
    <div className={styles.container}>
      <h1>RELAZIONI TRA ISCRITTI</h1>
      <FormControlLabel
        control={
          <Switch
            onChange={() => {
              setPesato(!pesato);
            }}
          />
        }
        label="Considera numero di allenamenti insieme"
      />
      <br />
      <svg id="Prova" className={styles.area_disegno} />
    </div>
  );
}

export default App5;
