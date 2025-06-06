import {
  LivestockDataRow,
  parseJsonStatData,
  RawJsonStatResponse,
} from "@/types/livestock";
import { useEffect, useState, useRef, useMemo } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

interface SankeyNode {
  id: number;
  name: string;
  type: "region" | "livestock" | "year";
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  value?: number;
}

interface SankeyLink {
  source: number | SankeyNode;
  target: number | SankeyNode;
  value: number;
  index?: number;
  width?: number;
  y0?: number;
  y1?: number;
}

export default function LivestockSankey() {
  const [livestockData, setLivestockData] = useState<LivestockDataRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>("2023");
  const svgRef = useRef<SVGSVGElement | null>(null);

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

  const availableYears = useMemo(() => {
    if (livestockData.length === 0) return [];
    return Array.from(new Set(livestockData.map((d) => d.Year))).sort(
      (a, b) => parseInt(b) - parseInt(a),
    );
  }, [livestockData]);

  useEffect(() => {
    if (livestockData.length === 0 || !selectedYear) return;

    const filteredData = livestockData.filter(
      (d) => d.Year === selectedYear && d.Value !== null && d.Value > 0,
    );

    const nodesMap = new Map<string, SankeyNode>();
    const links: SankeyLink[] = [];

    let nodeIndex = 0;

    const getOrCreateNode = (name: string, type: SankeyNode["type"]) => {
      if (!nodesMap.has(name)) {
        nodesMap.set(name, { id: nodeIndex++, name: name, type: type });
      }
      return nodesMap.get(name)!;
    };

    filteredData.forEach((d) => {
      const regionNode = getOrCreateNode(d.Regions, "region");
      const livestockNode = getOrCreateNode(
        d["Livestock/Poultry/Bee-hives"],
        "livestock",
      );
      const value = d.Value;

      if (value > 0) {
        links.push({
          source: regionNode.id,
          target: livestockNode.id,
          value: value,
        });
      }
    });

    const nodes = Array.from(nodesMap.values());

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const width = 960 - margin.left - margin.right;
    const height = Math.max(400, nodes.length * 20 + 50);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .html("")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const sankeyGenerator = sankey<SankeyNode, SankeyLink>()
      .nodeId((d) => d.id)
      .nodeWidth(50)
      .nodePadding(10)
      .extent([
        [1, 1],
        [width - 1, height - 5],
      ]);

    const { nodes: graphNodes, links: graphLinks } = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    const node = svg
      .append("g")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.3)
      .selectAll(".node")
      .data(graphNodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    node
      .append("rect")
      .attr("height", (d) => d.y1! - d.y0!)
      .attr("width", sankeyGenerator.nodeWidth())
      .attr("fill", (d) => colorScale(d.type))
      .attr("rx", 3)
      .attr("ry", 3)
      .append("title")
      .text(
        (d) =>
          `${d.name}\n${new Intl.NumberFormat(navigator.language).format(Math.round(d.value!))}`,
      );

    node
      .append("text")
      .attr("x", (d) =>
        d.x0! < width / 2 ? 6 + sankeyGenerator.nodeWidth() : -6,
      )
      // .attr("y", (d) => (d.y1! + d.y0!) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0! < width / 2 ? "start" : "end"))
      .text((d) => d.name)
      .attr("font-size", "12px");

    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.3)
      .selectAll(".link")
      .data(graphLinks)
      .join("path")
      .attr("class", "link")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke-width", (d) => Math.max(1, d.width!))
      .on("mouseover", function () {
        d3.select(this).attr("stroke-opacity", 0.6);
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-opacity", 0.3);
      })
      .append("title")
      .text(
        (d) =>
          `${d.source.name} → ${d.target.name}\n${new Intl.NumberFormat(
            navigator.language,
          ).format(Math.round(d.value))}`,
      );

    const defs = svg.append("defs");
    graphLinks.forEach((d, i) => {
      const gradient = defs
        .append("linearGradient")
        .attr("id", `gradient-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", d.source.x1!)
        .attr("x2", d.target.x0!);

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale(d.source.type));
      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale(d.target.type));

      d3.select(svg.selectAll(".link").nodes()[i] as SVGPathElement).attr(
        "stroke",
        `url(#gradient-${i})`,
      );
    });
  }, [livestockData, selectedYear]);

  if (livestockData.length === 0) {
    return <div>Loading Sankey data...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="mb-4">
        <label htmlFor="year-select" className="mr-2 font-medium">
          Select Year:
        </label>
        <select
          id="year-select"
          value={selectedYear || ""}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-md border p-2"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
}
