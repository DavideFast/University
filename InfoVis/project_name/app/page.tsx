import Image from "next/image";
import styles from "./page.module.css";
import * as d3 from "d3";

export default function Home() {

  const data = {
        nodes: [
          { id: "A", group: 1 },
          { id: "B", group: 1 },
          { id: "C", group: 2 },
          { id: "D", group: 2 },
          { id: "E", group: 3 },
          { id: "F", group: 1 },
          { id: "G", group: 2 },
          { id: "H", group: 2 },
        ],
        links: [
          { source: "A", target: "B", value: 1 },
          { source: "A", target: "C", value: 2 },
          { source: "B", target: "D", value: 1 },
          { source: "C", target: "D", value: 3 },
          { source: "A", target: "C", value: 2 },
          { source: "B", target: "E", value: 1 },
          { source: "C", target: "F", value: 3 },
        ],
      };

      // Select the SVG element
      const svg = d3.select("#straight-line");
      var width = svg.attr("width");
      var height = svg.attr("height");

      width = parseInt(width);
      height = parseInt(height);
      const straightLineElem = document.getElementById("straight-line") as SVGSVGElement | null;
      if (straightLineElem) {
        width = straightLineElem.width.baseVal.value * width * 0.01;
        height = straightLineElem.height.baseVal.value * height * 0.01;
      }
      console.log(width + " " + height);
      const color = d3.scaleOrdinal(d3.schemeCategory10);

      // Create simulation
      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3.forceLink(data.links).id((d: { id: string }) => d.id)
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

      // Draw links
      const link = svg
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.links)
        .join("line")
        .attr("stroke-width", (d: { value: number }) => Math.sqrt(d.value));

      // Draw nodes
      const node = svg
        .append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(data.nodes)
        .join("circle")
        .attr("r", 10)
        .attr("fill", (d: { group: number }) => color(d.group))
        .call(
          d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

      node.append("title").text((d: { id: string }) => d.id);

      simulation.on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        node.attr("cx", (d: { x: number}) => d.x).attr("cy", (d: { y: number}) => d.y);
      });

      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, any, any>, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, any, any>, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, any, any>, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }

  return (
      <main >
        <h1>TENNIS TAVOLO 2.0</h1>
    <noscript><div w3-include-html="menu.html"></div></noscript>
    <label htmlFor="intervallo-temporale">Seleziona il periodo temporale</label>
    <select name="intervallo-temporale" id="intervallo-temporale">
      <option value="">--Seleziona--</option>
      <option value="settimana">Settimana</option>
      <option value="mese">Mese</option>
      <option value="anno">Anno</option>
    </select>
    <br />
    <br />
    <br />
    <br />
    <div className={styles.container}>
      <div className={styles.container_div}>SPAZI LIBERI</div>
        <div className={styles.container_div}>ASSENZE</div>
        <div className={styles.container_div}>VARIAZIONI</div>
        <div className={styles.container_div}>PERCENTUALE RIEMPIMENTO</div>
    </div>

    <h2>ORGANIZZAZIONE SETTIMANALE</h2>
    <svg id="straight-line" width="90%" height="90vh"></svg>

    <br />
    <h2>ORGANIZZAZIONE SETTIMANALE</h2>
    <svg id="no-straight-line" width="90%" height="90vh"></svg>
        
      </main>
  );
}
