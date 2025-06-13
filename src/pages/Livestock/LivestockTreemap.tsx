import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  LivestockDataRow,
  parseJsonStatData,
  RawJsonStatResponse,
} from "@/types/livestock";

interface TreemapNodeDatum {
  name: string;
  value?: number;
  children?: TreemapNodeDatum[];
}

const MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };
const WIDTH = 1160 - MARGIN.left - MARGIN.right;
const HEIGHT = 450;
const LIVESTOCK_KEY = "Livestock/Poultry/Bee-hives";

function wrapText(
  text: d3.Selection<
    d3.BaseType | SVGTextElement,
    d3.HierarchyRectLeaf<TreemapNodeDatum>,
    SVGGElement,
    unknown
  >,
) {
  text.each(function (d) {
    const textElement = d3.select(this);
    const rectWidth = d.x1 - d.x0;
    const rectHeight = d.y1 - d.y0;
    const originalText = d.data.name;
    const padding = 8;
    const availableWidth = rectWidth - padding;
    const availableHeight = rectHeight - padding;
    const fontSize = 10;
    const lineHeight = 1.2;

    textElement.text(null);

    const words = originalText.split(/\s+/);
    let line = "";
    let lineNumber = 0;
    const maxLines = Math.floor(availableHeight / (fontSize * lineHeight));

    let tspan = textElement.append("tspan").attr("x", 4).attr("y", 14);

    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      tspan.text(testLine);

      if (tspan.node()!.getComputedTextLength() > availableWidth && i > 0) {
        tspan.text(line);
        if (lineNumber + 1 >= maxLines) {
          tspan.text(tspan.text() + "...");
          break;
        }
        lineNumber++;
        line = words[i];
        tspan = textElement
          .append("tspan")
          .attr("x", 4)
          .attr("dy", `${lineHeight}em`)
          .text(line);
      } else {
        line = testLine;
      }
    }
  });
}

export default function LivestockTreemap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<LivestockDataRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawData = await d3.json<RawJsonStatResponse>("/livestock.json");
        if (!rawData?.dataset) {
          throw new Error("Invalid JSON-stat data received");
        }
        const parsedData = parseJsonStatData(rawData.dataset);
        setData(parsedData);
      } catch (error) {
        console.error("Error loading or parsing livestock data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const groupedData = d3.group(data, (d) => d.Regions);

    const rootData: TreemapNodeDatum = {
      name: "Livestock",
      children: Array.from(groupedData, ([region, values]) => ({
        name: region,
        children: values.map((d) => ({
          name: `${d[LIVESTOCK_KEY]} (${d.Year})`,
          value: d.Value,
        })),
      })),
    };

    const root = d3
      .hierarchy<TreemapNodeDatum>(rootData)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3
      .treemap<TreemapNodeDatum>()
      .size([WIDTH, HEIGHT])
      .paddingInner(1)
      .paddingOuter(6)
      .round(true)(root);

    const svg = d3
      .select(svgRef.current)
      .attr("width", WIDTH + MARGIN.left + MARGIN.right)
      .attr("height", HEIGHT + MARGIN.top + MARGIN.bottom);

    svg.html("");

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const regionColor = d3.scaleOrdinal(
      Array.from(groupedData.keys()),
      d3.schemeTableau10,
    );

    const regionCells = g
      .selectAll(".region-cell")
      .data(root.children!)
      .join("g")
      .attr("class", "region-cell")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    regionCells
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => regionColor(d.data.name))
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    regionCells
      .append("text")
      .attr("x", 4)
      .attr("y", 18)
      .text((d) => d.data.name)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("pointer-events", "none");

    const leafCells = g
      .selectAll(".leaf-cell")
      .data(root.leaves())
      .join("g")
      .attr("class", "leaf-cell")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    leafCells
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => {
        const parentRegion = d.parent?.data.name;
        const color = regionColor(parentRegion!);
        return d3.color(color)?.darker(0.8) ?? "#4682B4";
      })
      .attr("stroke", "white");

    leafCells
      .append("text")
      .attr("fill", "white")
      .attr("pointer-events", "none")
      .attr("font-size", "10px")
      .call(wrapText);

    leafCells
      .append("title")
      .text((d) => `${d.data.name}: ${d.data.value?.toLocaleString()}`);
  }, [data]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg ref={svgRef}></svg>
    </div>
  );
}
