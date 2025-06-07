import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  LivestockDataRow,
  parseJsonStatData,
  RawJsonStatResponse,
} from "@/types/livestock";

interface LivestockDataItem {
  name: string;
  value: number;
}

interface HierarchyRootData {
  name: string;
  children: LivestockDataItem[];
  value: number;
}

export default function LivestockTreemap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [livestockData, setLivestockData] = useState<LivestockDataRow[]>([]);

  useEffect(() => {
    d3.json<RawJsonStatResponse>("/livestock.json")
      .then((rawJsonStatData) => {
        if (!rawJsonStatData || !rawJsonStatData.dataset) {
          throw new Error("Invalid JSON-stat data received: missing dataset.");
        }
        const parsedData = parseJsonStatData(rawJsonStatData.dataset);
        setLivestockData(parsedData);
      })
      .catch((err) => {
        console.error("Error loading or parsing livestock data:", err);
      });
  }, []);

  useEffect(() => {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 860 - margin.left - margin.right;
    const height = 450;

    const color = d3.scaleOrdinal(
      livestockData.map((d) => d["Livestock/Poultry/Bee-hives"]),
      d3.schemeTableau10,
    );

    const rootData = {
      name: "Livestock",
      children: livestockData.map((d) => ({
        name: `${d["Livestock/Poultry/Bee-hives"]}, ${d["Regions"]}, ${d["Year"]}`,
        value: d.Value,
      })),
      value: 0,
    };

    const rootHierarchy = d3
      .hierarchy<HierarchyRootData | LivestockDataItem>(rootData)
      .sum((d) => d.value)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemapLayout = d3
      .treemap<HierarchyRootData | LivestockDataItem>()
      .tile(d3.treemapSquarify)
      .size([width, height])
      .padding(1)
      .round(true);

    treemapLayout(rootHierarchy);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .html("")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    const cell = svg
      .selectAll<SVGGElement, d3.HierarchyNode<LivestockDataItem>>(
        "g.treemap-cell",
      )
      .data(rootHierarchy.leaves())
      .join(
        (enter) =>
          enter
            .append("g")
            .attr("class", "treemap-cell")
            .attr("transform", (d) => `translate(${d.x0},${d.y0})`),
        (update) =>
          update.attr("transform", (d) => `translate(${d.x0},${d.y0})`),
        (exit) => exit.remove(),
      );

    cell
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => color(d.data.name))
      .attr("stroke", "white");

    cell
      .append("text")
      .attr("x", 4)
      .attr("y", 14)
      .text((d) => d.data.name)
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .each(function (d) {
        const textElement = d3.select(this);
        const rectWidth = d.x1 - d.x0;
        const text = d.data.name;

        if (textElement.node()!.getComputedTextLength() > rectWidth - 8) {
          textElement.text("");
          const words = text.split(/\s+/);
          let line = "";
          let lineNumber = 0;
          const lineHeight = 1.1;

          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " ";
            textElement.text(testLine);
            if (
              textElement.node()!.getComputedTextLength() > rectWidth - 8 &&
              i > 0
            ) {
              textElement.text(line);
              line = words[i] + " ";
              textElement
                .append("tspan")
                .attr("x", 4)
                .attr("y", 14 + ++lineNumber * lineHeight * 12)
                .text(words[i] + " ");
            } else {
              line = testLine;
            }
          }
        }
      });

    cell.append("title").text((d) => `${d.data.name}: ${d.data.value}`);
  }, [livestockData]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}
