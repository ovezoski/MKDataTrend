import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const App = () => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [data, setData] = useState([]);

  useEffect(() => {
    d3.json("plantProduction.json").then((d) =>
      setData(d.sort((a, b) => a.Production - b.Production)),
    );
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth * 0.5,
        height: 400,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 100, left: 90 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.Product))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.Production) * 1.1])
      .nice()
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-60)")
      .style("text-anchor", "end")
      .attr("font-family", "Inter, sans-serif")

      .style("font-size", "11px")
      .style("fill", "#333");

    g.append("g")
      .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format(".2s")))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#333");

    g.append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -innerHeight / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Production (Tonnes)");

    g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.Product))
      .attr("y", (d) => y(d.Production))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.Production))
      .attr("fill", "url(#barGradient)");

    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "barGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    linearGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#6EE7B7");
    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#34D399");

    g.selectAll(".bar-value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "bar-value")
      .attr("x", (d) => x(d.Product) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.Production) - 8)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#555")
      .text((d) => d3.format(".2s")(d.Production));

    svg
      .append("text")
      .attr("x", dimensions.width / 2)
      .attr("y", margin.top / 2 + 5)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "#2d3748")
      .text(
        "Production of Cereals, Industrial Crops, Vegetables, Fruit and Grapes",
      );
  }, [data, dimensions]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 font-sans">
      <div className="w-full max-w-4xl rounded-lg bg-white p-2 shadow-xl">
        <svg ref={svgRef} className="mx-auto block"></svg>
      </div>
    </div>
  );
};

export default App;
