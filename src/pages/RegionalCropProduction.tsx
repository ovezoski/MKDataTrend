import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

export interface CropProductionData {
  year: number;
  data: RegionCropProduction[];
}

export interface RegionCropProduction {
  region: string;
  Wheat: number;
  Maize: number;
  Tobacco: number;
  Potato: number;
  Onion: number;
  Tomatoes: number;
  Pepper: number;
  Cucumbers: number;
}

const RegionalCropProduction = () => {
  const svgRef = useRef(null);
  const [data, setData] = useState<RegionCropProduction[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    d3.json<CropProductionData>("/regionalCropProduction.json")
      .then((d) => {
        if (d === undefined) {
          setError("Data is unavailable.");
        } else {
          setData(d.data);
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const margin = { top: 40, right: 100, bottom: 120, left: 80 };
    const chartWidth = 1000 - margin.left - margin.right;
    const chartHeight = 600 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr(
        "viewBox",
        `0 0 ${chartWidth + margin.left + margin.right} ${chartHeight + margin.top + margin.bottom}`,
      )
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const crops = Object.keys(data[0]).filter((key) => key !== "region");

    const series = d3.stack().keys(crops)(data);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.region))
      .range([0, chartWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1])) || 0])
      .nice()
      .range([chartHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemePaired).domain(crops);

    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => colorScale(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => xScale(d.data.region) || 0)
      .attr("y", (d) => yScale(d[1]))
      .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
      .attr("width", xScale.bandwidth())
      .attr("rx", 4)
      .attr("ry", 4);

    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0));

    xAxis
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dy", "0.5em")
      .attr("dx", "-0.5em")
      .attr("class", "text-sm text-gray-700");

    xAxis.selectAll("line").attr("stroke", "#e5e7eb");
    xAxis.selectAll("path").attr("stroke", "#e5e7eb");

    const yAxis = svg
      .append("g")
      .call(d3.axisLeft(yScale).ticks(10, "s").tickSizeOuter(0));

    yAxis.selectAll("text").attr("class", "text-sm text-gray-700");

    yAxis.selectAll("line").attr("stroke", "#e5e7eb");
    yAxis.selectAll("path").attr("stroke", "#e5e7eb");

    const legend = svg
      .append("g")
      .attr("font-family", "Inter, sans-serif")
      .attr("font-size", 12)
      .attr("text-anchor", "start")
      .attr("transform", `translate(${chartWidth + 20}, 0)`)
      .selectAll("g")
      .data(crops.slice().reverse())
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * 25})`);

    legend
      .append("rect")
      .attr("x", 0)
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", colorScale)
      .attr("rx", 4)
      .attr("ry", 4);

    legend
      .append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .attr("fill", "#4b5563")
      .text((d) => d);

    svg
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("class", "text-lg font-semibold text-gray-800")
      .text("Регионално Растително Производство - 2024");

    svg
      .append("text")
      .attr("transform", `translate(-60, ${chartHeight / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("class", "text-sm font-medium text-gray-600")
      .text("Производство (Метрички Тони)");

    svg
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", chartHeight + margin.bottom - 40)
      .attr("text-anchor", "middle")
      .attr("class", "text-sm font-medium text-gray-600")
      .text("Регион");
  }, [data]);

  return (
    <div className="font-inter flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="hover:shadow-3xl w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl transition-all duration-300">
        <svg ref={svgRef} className="h-auto w-full"></svg>
      </div>
    </div>
  );
};

export default RegionalCropProduction;
