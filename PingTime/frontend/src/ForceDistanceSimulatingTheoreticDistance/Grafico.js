import * as d3 from "d3";
import styles from "./Grafico.module.css";
import { useEffect } from "react";
import React from "react";
import Button from "@mui/material/Button";

//########################################################################################
//##                                                                                    ##
//##                                            D3                                      ##
//##                                                                                    ##
//########################################################################################

const createGraph = (data) => {
  d3.select("#Prova").selectAll("*").remove(); // Clear previous content
  const svg = d3.select("#Prova").append("svg").attr("width", 1800).attr("height", 800);

  const nodes = data.nodes.map((d) => ({ ...d, radius: 0 }));
  const links = data.links;

  nodes.forEach((node) => {
    const neighbors = links.filter((l) => l.source.id === node.id || l.target.id === node.id).map((l) => (l.source.id === node.id ? l.target : l.source));

    const distances = neighbors.map((n) => Math.hypot(node.x - n.x, node.y - n.y));

    node.radius = distances.length > 0 ? distances.reduce((a, b) => a + b) / distances.length : 10;
  });

  const centerX = 400;
  const centerY = 300;
  const maxRadius = 200;
  const angleSlice = (2 * Math.PI) / nodes.length;

  nodes.forEach((node, i) => {
    node.x = centerX + maxRadius * Math.cos(i * angleSlice);
    node.y = centerY + maxRadius * Math.sin(i * angleSlice);
  });

  const chart = svg.append("g").attr("id", "c").attr("transform", `translate(10,10)`);

  chart
    .selectAll("#c")
    .data(data.nodes)
    .enter()
    .append("circle")
    .attr("class", "cc")
    .attr("cx", function (d) {
      console.log("cx: " + d.x);
      return d.x;
    })
    .attr("cy", function (d) {
      console.log("cy: " + d.x);
      return d.y;
    })
    .attr("r", function (d) {
      console.log("r: " + d.x);
      return d.r;
    })
    .attr("fill", "#1f77b4");
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
    const nodes = Array.from({ length: 50 }, (_, i) => ({ id: i, x: Math.random() * 1700 + 10, y: Math.random() * 700 + 10, r: 20 }));
    const links = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.8) {
          links.push({ source: nodes[i], target: nodes[j] });
        }
      }
    }

    createGraph({ nodes, links });
  }, [periodo]);

  return (
    <div className={styles.container}>
      <h1>RELAZIONI TRA ISCRITTI</h1>
      <Button variant="contained" onClick={() => setPeriodo(!periodo)}>
        RIGENERA
      </Button>
      <svg id="Prova" width={1800} height={800} />
    </div>
  );
}

export default App5;
