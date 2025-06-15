import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { fetchJobVacancies } from "@/utility/fetchJobVacancies";

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

interface JobVacancyDataItem {
  id: string;
  name: string;
  vacancies: number;
  x: number;
  y: number;
}

export const JobVacanciesZoomChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<JobVacancyDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const width = 960;
  const height = 600;
  const fixedCircleRadius = 30;

  const [currentTransform, setCurrentTransform] = useState<[number, number, number]>([width / 2, height / 2, height]);

  const [zoomState, setZoomState] = useState<{ isZoomed: boolean; zoomedId: string | null }>({ isZoomed: false, zoomedId: null });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const json: JsonStat2Response = await fetchJobVacancies();

        if (!json || !json.dimension || !json.id || !json.value) {
          throw new Error("Invalid or incomplete JSON-stat2 response structure.");
        }

        const occupationGroupId = json.id[0];
        const quarterId = json.id[1];

        if (!json.dimension[occupationGroupId] || !json.dimension[quarterId]) {
          throw new Error("Expected dimension IDs not found in the API response.");
        }

        const occupationLabels = json.dimension[occupationGroupId].category.label;
        const occupationIndexes = json.dimension[occupationGroupId].category.index;
        const quarterLabels = json.dimension[quarterId].category.label;
        const quarterIndexes = json.dimension[quarterId].category.index;

        const values = json.value;

        const processedData: JobVacancyDataItem[] = [];

        const quarterCode = Object.keys(quarterLabels)[0];
        const quarterIdx = quarterIndexes[quarterCode];

        let count = 0;

        Object.keys(occupationLabels).forEach((occCode) => {
          const occIdx = occupationIndexes[occCode];
          const valueIndex = occIdx * Object.keys(quarterLabels).length + quarterIdx;
          const vacancyValue = values[valueIndex] || 0;
          
          const cols = 5;
          const rows = Math.ceil(Object.keys(occupationLabels).length / cols);
          const row = Math.floor(count / cols);
          const col = count % cols;
          const paddingX = 100;
          const paddingY = 80;
          
          const effectiveWidth = width - 2 * paddingX;
          const effectiveHeight = height - 2 * paddingY;
          const itemWidth = effectiveWidth / cols;
          const itemHeight = effectiveHeight / rows;

          processedData.push({
            id: occCode,
            name: occupationLabels[occCode],
            vacancies: vacancyValue,
            x: paddingX + col * itemWidth + itemWidth / 2,
            y: paddingY + row * itemHeight + itemHeight / 2
          });
          count++;
        });

        processedData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setData(processedData);

        setCurrentTransform([width / 2, height / 2, height]);

      } catch (err: unknown) {
        let errorMessage = "Настана непозната грешка при преземање податоци.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        console.error("Error fetching or parsing job vacancies data:", err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const transform = useCallback(([x, y, r]: [number, number, number]) => {
    return `
      translate(${width / 2}, ${height / 2})
      scale(${height / r})
      translate(${-x}, ${-y})
    `;
  }, [width, height]);

  const performZoom = useCallback((targetX: number, targetY: number, targetR: number) => {
    if (!svgRef.current) return;

    const g = d3.select(svgRef.current).select("g");
    if (g.empty()) return;

    const i = d3.interpolateZoom(currentTransform, [targetX, targetY, targetR]);

    g.transition()
      .delay(250)
      .duration(i.duration)
      .attrTween("transform", () => t => {
          return transform(i(t));
      })
      .on("end", () => {
          setCurrentTransform(i(1));
      });
  }, [currentTransform, transform, width, height]);


  const zoomInToCircle = useCallback((d: JobVacancyDataItem) => {
    if (!d || typeof d.x !== 'number' || typeof d.y !== 'number' || isNaN(d.x) || isNaN(d.y)) {
      console.error("Invalid data point for zoom-in:", d);
      return;
    }

    const targetRadius = fixedCircleRadius * 2 + 1;
    performZoom(d.x, d.y, targetRadius);
    setZoomState({ isZoomed: true, zoomedId: d.id });
  }, [performZoom, fixedCircleRadius]);

  const zoomOutToFullView = useCallback(() => {
    performZoom(width / 2, height / 2, height);
    setZoomState({ isZoomed: false, zoomedId: null });
  }, [performZoom, width, height]);


  useEffect(() => {
    if (!isLoading && data.length > 0 && svgRef.current) {
      const svg = d3.select(svgRef.current);
      if (svg.select("g").empty()) {
        svg.append("g");
      }
      
      if (!zoomState.isZoomed && currentTransform[2] !== height) {
          zoomOutToFullView();
      }
    }
  }, [isLoading, data, zoomOutToFullView, zoomState.isZoomed, currentTransform]);


  const truncateText = useCallback((text: string, maxLength: number) => {
    if (text.length > maxLength) {
      const truncated = text.substring(0, maxLength);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      return (lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) : truncated) + '...';
    }
    return text;
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select("g");

    const tooltip = d3
      .select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "rgba(0,0,0,0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("font-family", "Inter, sans-serif");

    g.attr("transform", transform(currentTransform));

    g.selectAll(".data-group").remove();

    const currentCircleRadius = fixedCircleRadius;

    const dataGroups = g.selectAll<SVGGElement, JobVacancyDataItem>(".data-group")
      .data(data, (d) => d.id)
      .join("g")
      .attr("class", "data-group");

    dataGroups.append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", currentCircleRadius)
        .attr("fill", (d, i) => d3.interpolateRainbow(i / data.length))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event: MouseEvent, d: JobVacancyDataItem) {
          d3.select(this).attr("stroke-width", 2).attr("stroke", "orange");
          tooltip
            .html(`Занимање: <strong>${d.name}</strong><br/>Слободни места: <strong>${d.vacancies.toLocaleString()}</strong>`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .transition()
            .duration(200)
            .style("opacity", 1);
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#333");
          tooltip.transition().duration(300).style("opacity", 0);
        })
        .on("click", function(event: MouseEvent, d: JobVacancyDataItem) {
          d3.select(svgRef.current).select("g").interrupt();
          if (zoomState.isZoomed && zoomState.zoomedId === d.id) {
            zoomOutToFullView();
          } else {
            zoomInToCircle(d);
          }
        });
    
    dataGroups.append("text")
        .attr("class", "label")
        .attr("x", d => d.x + currentCircleRadius + 12)
        .attr("y", d => d.y) 
        .attr("dominant-baseline", "middle") 
        .attr("text-anchor", "start")
        .attr("transform", d => `rotate(-30, ${d.x + currentCircleRadius + 12}, ${d.y})`)
        .style("font-size", "10px")
        .style("fill", "#333")
        .style("font-family", "Inter, sans-serif")
        .text(d => truncateText(d.name, 35))
        .on("mouseover", function(event: MouseEvent, d: JobVacancyDataItem) {
          tooltip
            .html(`Занимање: <strong>${d.name}</strong><br/>Слободни места: <strong>${d.vacancies.toLocaleString()}</strong>`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px")
            .transition()
            .duration(200)
            .style("opacity", 1);
        })
        .on("mouseout", function() {
          tooltip.transition().duration(300).style("opacity", 0);
        })
        .on("click", function(event: MouseEvent, d: JobVacancyDataItem) {
            d3.select(svgRef.current).select("g").interrupt();
            if (zoomState.isZoomed && zoomState.zoomedId === d.id) {
                zoomOutToFullView();
            } else {
                zoomInToCircle(d);
            }
        });

    dataGroups.append("text")
        .attr("class", "vacancy-value")
        .attr("x", d => d.x)
        .attr("y", d => d.y + 4) 
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", d => {
            const colorValue = d3.interpolateRainbow(parseInt(d.id) / data.length);
            const labColor = d3.lab(colorValue); 
            if (labColor && typeof labColor.l === 'number') {
                return labColor.l > 50 ? "#000" : "#fff";
            }
            return "#000";
        })
        .style("font-family", "Inter, sans-serif")
        .text(d => d.vacancies.toLocaleString())
        .style("pointer-events", "none");

  }, [data, transform, truncateText, fixedCircleRadius, zoomState.isZoomed, zoomState.zoomedId, zoomInToCircle, zoomOutToFullView, currentTransform]);

  return (
    <div className="mx-auto my-3 flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-2xl"
         style={{ width: '100%', maxWidth: `${width + 40}px`, minHeight: `${height + 100}px` }}>
      <h1 className="m-1 text-3xl font-extrabold text-gray-800">
        Слободни работни места по занимања (2025 Q1)
      </h1>

      {isLoading ? (
        <div className="flex h-full items-center justify-center text-lg text-gray-600">
          Вчитување податоци за слободни работни места...
        </div>
      ) : error ? (
        <div className="flex h-full items-center justify-center text-lg text-red-600">
          Грешка: {error} Ве молиме проверете ја конзолата за повеќе детали.
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-lg text-gray-600">
          Нема достапни податоци за прикажување.
        </div>
      ) : (
        <div className="p-2 w-full h-full flex justify-center items-center">
          <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`}></svg>
        </div>
      )}
      <div ref={tooltipRef} />
    </div>
  );
};

export default JobVacanciesZoomChart;