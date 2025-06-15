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

const RegionalCropBubbleChart = () => {
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

    const width = 960;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const processedData = data.map((d) => {
      const totalProduction = Object.keys(d)
        .filter((key) => key !== "region")
        .reduce(
          (sum, key) => sum + (d[key as keyof RegionCropProduction] as number),
          0,
        );
      return {
        name: d.region,
        value: totalProduction,
      };
    });

    const pack = d3.pack().size([width, height]).padding(5);

    const root = d3
      .hierarchy({ children: processedData })
      .sum((d: any) => d.value);

    const nodes = pack(root).leaves();

    const sizeScale = d3
      .scaleSqrt()
      .domain([0, d3.max(processedData, (d) => d.value) || 0])
      .range([10, 100]); // Minimum and maximum radius

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const tooltip = d3
      .select("body")
      .append("div")
      .attr(
        "class",
        "tooltip absolute text-sm p-2 bg-gray-800 text-white rounded-lg opacity-0 pointer-events-none transition-opacity duration-200",
      )
      .style("z-index", 1000);

    svg
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => sizeScale(d.data.value))
      .attr("fill", (d, i) => colorScale(d.data.name))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr(
        "class",
        "cursor-pointer transition-all duration-300 ease-in-out hover:scale-110",
      )
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(
            `<div class="font-bold">${d.data.name}</div><div>Total Production: ${d.data.value.toLocaleString()}</div>`,
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });

    svg
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("font-size", (d) => `${sizeScale(d.data.value) / 4}px`)
      .attr("fill", "#333333")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text((d) => {
        const radius = sizeScale(d.data.value);
        return d.data.name.length * (radius / 5) < radius * 2
          ? d.data.name
          : "";
      });

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("class", "text-xl font-bold text-gray-800")
      .text("Regional Crop Production - Bubble Chart (Total Production)");
  }, [data]);

  if (loading) {
    return (
      <div className="font-inter flex h-screen items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-inter flex h-screen items-center justify-center bg-red-100">
        <p className="text-lg text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="font-inter flex min-h-screen flex-col items-center bg-gradient-to-br from-indigo-50 to-pink-50 p-6">
      <div className="hover:shadow-3xl w-full max-w-5xl rounded-xl bg-white p-6 shadow-2xl transition-all duration-300">
        <svg ref={svgRef} className="h-auto w-full"></svg>
      </div>
    </div>
  );
};

export default RegionalCropBubbleChart;
