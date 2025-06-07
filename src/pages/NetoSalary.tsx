import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchNetoPlata } from "@/utility/fetchNetoPlata";

interface DataItem {
  sector: string;
  salary: number;
}

export const NetoSalary = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchNetoPlata().then((json) => {
      const values = json.value;
      const sectorCodes = json.dimension["Сектори и оддели"].category.label;
      const sectors = Object.values(sectorCodes) as string[];

      const parsed: DataItem[] = sectors.map((sector, i) => ({
        sector,
        salary: values[i],
      }));

      setData(parsed);
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = 900;
    const height = 550;
    const margin = { top: 40, right: 30, bottom: 250, left: 100 };

    svg.selectAll("*").remove();

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
      .attr("stop-color", "#6a11cb");
    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#2575fc");

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.sector))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3
      .scaleLinear<number, number>()
      .domain([0, d3.max(data, (d) => d.salary)! * 1.1])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-60)")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "#333")
      .style("font-family", "sans-serif");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).tickFormat(d3.format(".2s")))
      .style("font-size", "12px")
      .style("fill", "#333")
      .style("font-family", "sans-serif");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left / 2 - 20)
      .attr("x", -(height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#555")
      .style("font-family", "sans-serif")
      .text("Нето плата");

    svg
      .selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d: DataItem) => x(d.sector)!)
      .attr("width", x.bandwidth())
      .attr("fill", "url(#barGradient)")
      .attr("y", height - margin.bottom)
      .attr("height", 0)
      .transition()
      .duration(800)
      .delay((d: DataItem, i: number) => i * 50)
      .attr("y", (d: DataItem) => y(d.salary))
      .attr("height", (d: DataItem) => height - margin.bottom - y(d.salary));

    const tooltip = d3
      .select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none");

    svg
      .selectAll<SVGRectElement, DataItem>(".bar")
      .on("mouseover", function (event: MouseEvent, d: DataItem) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", "#ff7f0e")
          .attr("y", y(d.salary) - 5)
          .attr("height", height - margin.bottom - y(d.salary) + 5);

        tooltip
          .html(
            `Sector: <strong>${d.sector}</strong><br/>Salary: <strong>${d.salary.toLocaleString()} MKD</strong>`,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function (event: MouseEvent) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function (event: MouseEvent, d: DataItem) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "url(#barGradient)")
          .attr("y", y(d.salary))
          .attr("height", height - margin.bottom - y(d.salary));

        tooltip.transition().duration(300).style("opacity", 0);
      });
  }, [data]);

  return (
    <div className="mx-auto my-3 flex min-h-screen max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-4">
      <h1 className="m-1 text-3xl font-extrabold text-gray-800">
        Нето плата по сектори
      </h1>

      <div className="p-2 shadow-2xl">
        <svg ref={svgRef} width={900} height={800}></svg>
      </div>

      <div ref={tooltipRef} />
    </div>
  );
};
