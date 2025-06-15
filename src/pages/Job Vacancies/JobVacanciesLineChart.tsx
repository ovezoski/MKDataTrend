import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { fetchHistoricalJobVacancies } from "@/utility/fetchHistoricalJobVacancies";

interface JsonStat2Response {
  id: string[];
  dimension: {
    [key: string]: {
      category: {
        label: { [key: string]: string };
        index: { [key: string]: number };
      };
    };
  };
  value: number[];
}

interface VacancyDataByQuarter {
  quarter: string;
  value: number;
}

interface OccupationLineData {
  occupation: string;
  id: string;
  values: VacancyDataByQuarter[];
}

export const JobVacanciesLineChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<OccupationLineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredOccupation, setHoveredOccupation] = useState<string | null>(null);

  const processData = useCallback((json: JsonStat2Response): OccupationLineData[] => {
    const quarterId = json.id[1];
    const occupationGroupId = json.id[0];

    const quarterLabels = json.dimension[quarterId].category.label;
    const quarterIndexes = json.dimension[quarterId].category.index;
    const occupationLabels = json.dimension[occupationGroupId].category.label;
    const occupationIndexes = json.dimension[occupationGroupId].category.index;

    const values = json.value;

    const processedLines: OccupationLineData[] = [];

    Object.keys(occupationLabels).forEach((occCode) => {
      const occName = occupationLabels[occCode];
      const occIdx = occupationIndexes[occCode];
      const quarterData: VacancyDataByQuarter[] = [];

      Object.keys(quarterLabels).forEach((qCode) => {
        const qIdx = quarterIndexes[qCode];
        const valueIndex = occIdx * Object.keys(quarterLabels).length + qIdx;
        const vacancyValue = values[valueIndex] || 0;
        
        quarterData.push({
          quarter: quarterLabels[qCode],
          value: vacancyValue,
        });
      });

      quarterData.sort((a, b) => {
        const yearA = parseInt(a.quarter.substring(0, 4));
        const qtrA = parseInt(a.quarter.substring(5, 6));
        const yearB = parseInt(b.quarter.substring(0, 4));
        const qtrB = parseInt(b.quarter.substring(5, 6));
        if (yearA !== yearB) return yearA - yearB;
        return qtrA - qtrB;
      });

      processedLines.push({
        occupation: occName,
        id: occCode,
        values: quarterData,
      });
    });

    return processedLines;
  }, []);

  useEffect(() => {
    const fetchDataAndProcess = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const json = await fetchHistoricalJobVacancies();
        const processed = processData(json);
        setData(processed);
      } catch (err: unknown) {
        let errorMessage = "Настана непозната грешка при преземање податоци.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        console.error("Error fetching or parsing historical job vacancies data:", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDataAndProcess();
  }, [processData]);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const newWidth = containerRef.current.clientWidth;
      setDimensions({ width: newWidth, height: Math.min(newWidth * 0.6, 500) });
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

    const margin = { top: 60, right: 180, bottom: 80, left: 70 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const allQuarters = Array.from(new Set(data.flatMap(d => d.values.map(v => v.quarter)))).sort((a, b) => {
      const yearA = parseInt(a.substring(0, 4));
      const qtrA = parseInt(a.substring(5, 6));
      const yearB = parseInt(b.substring(0, 4));
      const qtrB = parseInt(b.substring(5, 6));
      if (yearA !== yearB) return yearA - yearB;
      return qtrA - qtrB;
    });

    const x = d3.scalePoint<string>()
      .domain(allQuarters)
      .range([0, innerWidth])
      .padding(0.5);

    const maxY = d3.max(data, series => d3.max(series.values, d => d.value)) || 0;
    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([innerHeight, 0])
      .nice();

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "10px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif");

    g.append("g")
      .call(d3.axisLeft(y).ticks(innerHeight / 40).tickFormat(d3.format(".2s")))
      .call(gAxis => gAxis.select(".domain").remove())
      .call(gAxis => gAxis.selectAll(".tick line").clone()
          .attr("x2", innerWidth)
          .attr("stroke-opacity", 0.1))
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif");

    svg.append("text")
      .attr("x", dimensions.width / 2)
      .attr("y", dimensions.height - margin.bottom / 2 + 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif")
      .text("Тримесечје");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left / 2 - 40)
      .attr("x", -(dimensions.height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#555")
      .style("font-family", "Inter, sans-serif")
      .text("Број на слободни работни места");

    const line = d3.line<VacancyDataByQuarter>()
      .x(d => x(d.quarter)!)
      .y(d => y(d.value)!);

    g.selectAll(".occupation-line")
      .data(data)
      .join("path")
      .attr("class", d => `occupation-line occupation-${d.id}`)
      .attr("fill", "none")
      .attr("stroke", d => color(d.occupation))
      .attr("stroke-width", 2)
      .attr("d", d => line(d.values))
      .attr("opacity", 1)
      .on("mouseover", function(event, d) {
          setHoveredOccupation(d.occupation);
          d3.selectAll(".occupation-line").transition().duration(100).attr("opacity", 0.2);
          d3.select(this).transition().duration(100).attr("opacity", 1).attr("stroke-width", 3);

          const firstPoint = d.values[0];
          if (firstPoint) {
            tooltip
              .html(`Занимање: <strong>${d.occupation}</strong><br/>Тримесечје: <strong>${firstPoint.quarter}</strong><br/>Слободни места: <strong>${firstPoint.value.toLocaleString()}</strong>`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px")
              .transition()
              .duration(200)
              .style("opacity", 1);
          }
      })
      .on("mouseout", function() {
          setHoveredOccupation(null);
          d3.selectAll(".occupation-line").transition().duration(100).attr("opacity", 1).attr("stroke-width", 2);
          tooltip.transition().duration(300).style("opacity", 0);
      });

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

    svg.append("text")
      .attr("x", dimensions.width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .style("font-family", "Inter, sans-serif")

    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${dimensions.width - margin.right + 20}, ${margin.top})`);

    data.forEach((d, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`)
        .on("mouseover", function() {
            setHoveredOccupation(d.occupation);
            d3.selectAll(".occupation-line").transition().duration(100).attr("opacity", 0.2);
            d3.select(`.occupation-${d.id}`).transition().duration(100).attr("opacity", 1).attr("stroke-width", 3);
        })
        .on("mouseout", function() {
            setHoveredOccupation(null);
            d3.selectAll(".occupation-line").transition().duration(100).attr("opacity", 1).attr("stroke-width", 2);
        });

      legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color(d.occupation));

      legendRow.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .style("font-size", "10px")
        .style("fill", "#333")
        .style("font-family", "Inter, sans-serif")
        .text(d.occupation.length > 25 ? d.occupation.substring(0, 22) + "..." : d.occupation);
    });

  }, [data, dimensions, isLoading, error, hoveredOccupation]);

  return (
    <div
      ref={containerRef}
      className="mx-auto my-3 flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-2xl"
      style={{ width: '100%', maxWidth: '1200px', minHeight: '500px' }}
    >
      <h1 className="m-1 text-3xl font-extrabold text-gray-800">
        Тренд на слободни работни места по занимање (2024-2025)
      </h1>

      {isLoading ? (
        <div className="flex h-full items-center justify-center text-lg text-gray-600">
          Вчитување податоци за трендот на слободни работни места...
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center text-lg text-red-600">
          Грешка: {error} Ве молиме проверете ја конзолата за повеќе детали.
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-lg text-gray-600">
          Нема достапни податоци за прикажување на трендот.
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

export default JobVacanciesLineChart;