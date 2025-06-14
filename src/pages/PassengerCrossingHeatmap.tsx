import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { fetchPassengerCrossings } from "@/utility/fetchPassengerData";

interface HeatmapDataItem {
  year: string;
  crossing: string;
  type: string;
  value: number;
}

export const PassengerCrossingsHeatmap: React.FC = () => {
  const [data, setData] = useState<HeatmapDataItem[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const json = await fetchPassengerCrossings();

        if (!json || !json.dimension || !json.id || !json.value) {
          throw new Error("Invalid or incomplete JSON-stat2 response structure.");
        }

        const yearId = json.id[0];
        const crossingId = json.id[1];
        const measureId = json.id[2];
        const typeId = json.id[3];

        if (!json.dimension[yearId] || !json.dimension[crossingId] ||
            !json.dimension[measureId] || !json.dimension[typeId]) {
          console.error("Missing expected dimension IDs in the response's 'dimension' object:", Object.keys(json.dimension));
          throw new Error("Expected dimension IDs not found in the API response. Check console for details.");
        }

        const years = json.dimension[yearId].category.label;
        const yearIndexes = json.dimension[yearId].category.index;
        const borderCrossings = json.dimension[crossingId].category.label;
        const crossingIndexes = json.dimension[crossingId].category.index;
        const measures = json.dimension[measureId].category.label;
        const measureIndexes = json.dimension[measureId].category.index;
        const types = json.dimension[typeId].category.label;
        const typeIndexes = json.dimension[typeId].category.index;

        const values = json.value;

        const parsedData: HeatmapDataItem[] = [];

        const crossingCount = Object.keys(crossingIndexes).length;
        const measureCount = Object.keys(measureIndexes).length;
        const typeCount = Object.keys(typeIndexes).length;

        Object.keys(years).forEach((yearCode) => {
          const yearIdx = yearIndexes[yearCode];
          Object.keys(borderCrossings).forEach((crossingCode) => {
            const crossingIdx = crossingIndexes[crossingCode];
            Object.keys(measures).forEach((measureCode) => {
              const measureIdx = measureIndexes[measureCode];
              Object.keys(types).forEach((typeCode) => {
                const typeIdx = typeIndexes[typeCode];

                const valueIndex =
                  yearIdx * crossingCount * measureCount * typeCount +
                  crossingIdx * measureCount * typeCount +
                  measureIdx * typeCount +
                  typeIdx;

                const combinedType = `${measures[measureCode]} - ${types[typeCode]}`;

                parsedData.push({
                  year: years[yearCode],
                  crossing: borderCrossings[crossingCode],
                  type: combinedType,
                  value: values[valueIndex] || 0
                });
              });
            });
          });
        });
        setData(parsedData);
      } catch (err: unknown) {
        let errorMessage = "Настана непозната грешка при преземање податоци.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        console.error("Error fetching or parsing passenger crossings data:", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const newWidth = containerRef.current.clientWidth;
      setDimensions({ width: newWidth, height: Math.min(newWidth * 0.9, 1000) });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    const resizeObserver = new ResizeObserver(() => updateDimensions());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  useEffect(() => {
    if (data.length === 0 || dimensions.width === 0 || dimensions.height === 0 || isLoading || error) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 80, right: 250, bottom: 150, left: 180 };

    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const allYears = Array.from(new Set(data.map((d) => d.year))).sort();
    const allCrossings = Array.from(new Set(data.map((d) => d.crossing))).sort();
    const allTypes = Array.from(new Set(data.map((d) => d.type))).sort();

    const yAxisLabels = allYears.flatMap(year =>
      allCrossings.map(crossing => `${year} (${crossing})`)
    );

    const xAxisLabels = allTypes;

    const xScale = d3
      .scaleBand<string>()
      .range([0, innerWidth])
      .domain(xAxisLabels)
      .padding(0.02);

    const yScale = d3
      .scaleBand<string>()
      .range([innerHeight, 0])
      .domain(yAxisLabels)
      .padding(0.02);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const valueExtent = d3.extent(data, (d) => d.value) as [number, number];
    const colorScale = d3.scaleSequential<string, string>()
      .domain(valueExtent)
      .interpolator(d3.interpolateRdPu);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("font-family", "Inter, sans-serif");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#333")
      .style("font-family", "Inter, sans-serif");

    const cells = g.selectAll(".cell")
      .data(data.map(d => ({
        ...d,
        displayY: `${d.year} (${d.crossing})`,
        displayX: d.type
      })))
      .join("rect")
      .attr("class", "cell")
      .attr("x", (d) => xScale(d.displayX)!)
      .attr("y", (d) => yScale(d.displayY)!)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .style("fill", (d) => colorScale(d.value))
      .style("stroke", "#fff")
      .style("stroke-width", 0.8);

    const tooltip = d3
      .select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("font-family", "Inter, sans-serif")
      .style("box-shadow", "0 4px 8px rgba(0,0,0,0.2)");

    cells
      .on("mouseover", function (event: MouseEvent, d: HeatmapDataItem) {
        d3.select(this)
          .style("stroke", "#ff7f0e")
          .style("stroke-width", 2);

        tooltip
          .html(
            `Година: <strong>${d.crossing}</strong><br/>` +
            `Граничен премин: <strong>${d.year}</strong><br/>` +
            `Тип на движење: <strong>${d.type}</strong><br/>` +
            `Патници: <strong>${d.value.toLocaleString()}</strong>`
          )
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px")
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function (event: MouseEvent) {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("stroke", "#fff")
          .style("stroke-width", 0.8);

        tooltip.transition().duration(300).style("opacity", 0);
      });

    svg.append("text")
      .attr("x", dimensions.width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("font-family", "Inter, sans-serif")

    svg.append("text")
      .attr("x", dimensions.width / 2)
      .attr("y", margin.top / 2 + 30)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif")
      .text(`(${allYears.join(', ')})`);

    svg.append("text")
      .attr("x", dimensions.width / 2)
      .attr("y", dimensions.height - margin.bottom / 2 + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif")
      .text("Тип на патничко движење");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left / 2 - 130)
      .attr("x", -(dimensions.height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif")
      .text("Година и граничен премин");

    const legendWidth = 20;
    const legendHeight = innerHeight;
    const legendMargin = 50;

    const legendSvg = svg.append("g")
      .attr("transform", `translate(${margin.left + innerWidth + legendMargin}, ${margin.top})`);

    const colorAxisScale = d3.scaleLinear()
      .domain(colorScale.domain())
      .range([legendHeight, 0]);

    const colorAxis = d3.axisRight(colorAxisScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));

    legendSvg.append("g")
      .attr("transform", `translate(${legendWidth + 15}, 0)`)
      .call(colorAxis)
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("font-family", "Inter, sans-serif");

    const legendGradient = legendSvg.append("defs")
      .append("linearGradient")
      .attr("id", "legendGradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    const domain = colorScale.domain();
    if (domain[0] !== undefined && domain[1] !== undefined && !isNaN(domain[0]) && !isNaN(domain[1])) {
        d3.range(0, 1.01, 0.1).forEach(t => {
            legendGradient.append("stop")
                .attr("offset", t * 100 + "%")
                .attr("stop-color", colorScale.interpolator()(t));
        });
    }

    legendSvg.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legendGradient)")
      .style("stroke", "#ccc")
      .style("stroke-width", 1);

    legendSvg.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif")
      .text("Број на патници");


  }, [data, dimensions, isLoading, error]);

  return (
    <div
      ref={containerRef}
      className="mx-auto my-3 flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-2xl"
      style={{ width: '100%', maxWidth: '1400px', minHeight: '700px' }}
    >
      <h1 className="m-1 text-3xl font-extrabold text-gray-800">
        Преминување на патници на поважните гранични премини (2020-2023)
      </h1>

      {isLoading ? (
        <div className="flex h-full items-center justify-center text-lg text-gray-600">
          Вчитување податоци за heatmap...
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center text-lg text-red-600">
          Грешка: {error} Ве молиме проверете ја конзолата за повеќе детали.
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-lg text-gray-600">
          Нема достапни податоци за прикажување на heatmap.
        </div>
      ) : (
        <div className="p-2 w-full h-full">
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
        </div>
      )}

      <div ref={tooltipRef} />
    </div>
  );
};

export default PassengerCrossingsHeatmap;
