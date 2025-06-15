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

interface LivestockTreemapProps {
  width?: number;
  height?: number;
}

const MARGIN = { top: 30, right: 10, bottom: 10, left: 10 };
const LIVESTOCK_KEY = "Livestock";

export default function LivestockTreemap({
  width = 1160,
  height = 550,
}: LivestockTreemapProps) {
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
    if (!data.length || !svgRef.current) return;

    const chartWidth = width - MARGIN.left - MARGIN.right;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;

    const groupedData = d3.group(data, (d) => d.Regions);

    const rootData: TreemapNodeDatum = {
      name: "Regions",
      children: Array.from(groupedData, ([region, values]) => ({
        name: region,
        children: values.map((d) => ({
          name: d[LIVESTOCK_KEY],
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
      .size([chartWidth, chartHeight])
      .paddingInner(2)
      .paddingOuter(5)
      .paddingTop(20)
      .round(true)(root);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", width)
      .attr("height", height);

    const g = svg
      .selectAll("g")
      .data([null])
      .join("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const regionColor = d3.scaleOrdinal(
      root.children?.map((d) => d.data.name) ?? [],
      d3.schemeTableau10,
    );

    const regionGroups = g
      .selectAll(".region-group")
      .data(root.children ?? [])
      .join("g")
      .attr("class", "region-group")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    regionGroups
      .selectAll(".region-rect")
      .data((d) => [d])
      .join("rect")
      .attr("class", "region-rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => regionColor(d.data.name))
      .attr("rx", 5);

    regionGroups
      .selectAll(".region-label")
      .data((d) => [d])
      .join("text")
      .attr("class", "region-label")
      .attr("x", 5)
      .attr("y", 15)
      .text((d) => d.data.name)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "white");

    const leafCells = g
      .selectAll(".leaf-cell")
      .data(root.leaves())
      .join("g")
      .attr("class", "leaf-cell")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    leafCells
      .selectAll("rect")
      .data((d) => [d])
      .join("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("rx", 3)
      .attr("fill", (d) => {
        const parentName = d.parent?.data.name ?? "";
        const baseColor = d3.color(regionColor(parentName));
        return baseColor ? baseColor.darker(0.7) : "#ccc";
      });

    leafCells
      .selectAll("text")
      .data((d) => [d])
      .join("text")
      .attr("x", 4)
      .attr("y", 14)
      .attr("fill", "white")
      .attr("font-size", "11px")
      .each(function (d) {
        const textNode = d3.select(this);
        const availableWidth = d.x1 - d.x0 - 8;
        let text = d.data.name;
        textNode.text(text);
        if (this.getComputedTextLength() > availableWidth) {
          text =
            text.slice(
              0,
              Math.floor(
                (availableWidth / this.getComputedTextLength()) * text.length,
              ),
            ) + "..";
          textNode.text(text);
        }
      });

    leafCells
      .selectAll("title")
      .data((d) => [d])
      .join("title")
      .text(
        (d) =>
          `${d.parent?.data.name} - ${d.data.name}: ${d.value?.toLocaleString()}`,
      );
  }, [data, width, height]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg ref={svgRef}></svg>
    </div>
  );
}
