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
    const width = 1000;
    const height = 600; 
    const margin = { top: 20, right: 30, bottom: 200, left: 60 }; 

    svg.selectAll("*").remove();

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.sector))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.salary)!])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-65)") 
      .style("text-anchor", "end")
      .style("font-size", "11px"); 

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.sector)!)
      .attr("y", (d) => y(d.salary))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - margin.bottom - y(d.salary))
      .attr("fill", "red");
  }, [data]);

  return (
    <div>
      <h2>Нето плата по сектори</h2>
      <svg ref={svgRef} width={1000} height={600}></svg>
    </div>
  );
};