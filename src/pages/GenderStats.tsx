import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchGenderStatistics } from "@/utility/fetchGenderStats";

interface RawGenderData {
  id: string[];
  size: number[];
  value: (number | null)[];
  dimension: {
    [key: string]: {
      category: {
        index: { [key: string]: number };
        label: { [key: string]: string };
      };
    };
  };
}

interface YearGenderValue {
  year: string;
  total: number | undefined;
  women: number | undefined;
  men: number | undefined;
}

interface IndicatorData {
  code: string;
  label: string;
  data: YearGenderValue[];
  minValue: number;
  maxValue: number;
}

export const GenderStatisticsChart: React.FC = () => {
  const [processedData, setProcessedData] = useState<IndicatorData[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getData = async () => {
      try {
        const rawData: RawGenderData = await fetchGenderStatistics();
        const { id, size, value, dimension } = rawData;

        const indicatorLabels = dimension["Показател"].category.label;
        const indicatorIndices = dimension["Показател"].category.index;

        const yearLabels = dimension["Година"].category.label;
        const yearIndices = dimension["Година"].category.index;

        const genderLabels = dimension["Пол"].category.label;
        const genderIndices = dimension["Пол"].category.index;

        const numYears = size[id.indexOf("Година")];
        const numGenders = size[id.indexOf("Пол")];

        const tempProcessedData: { [key: string]: IndicatorData } = {};

        Object.keys(indicatorIndices).forEach((indicatorCode) => {
          const label = indicatorLabels[indicatorCode];
          const indicatorDataForYears: YearGenderValue[] = Object.keys(yearIndices)
            .sort((a, b) => yearIndices[a] - yearIndices[b])
            .map((yearCode) => ({
              year: yearLabels[yearCode],
              total: undefined,
              women: undefined,
              men: undefined,
            }));

          tempProcessedData[indicatorCode] = {
            code: indicatorCode,
            label,
            data: indicatorDataForYears,
            minValue: Infinity,
            maxValue: -Infinity,
          };
        });

        value.forEach((val, i) => {
          const genderIdx = i % numGenders;
          const yearIdx = Math.floor(i / numGenders) % numYears;
          const indicatorIdx = Math.floor(i / (numGenders * numYears));

          const currentIndicatorCode = Object.keys(indicatorIndices).find(key => indicatorIndices[key] === indicatorIdx);
          const currentYearCode = Object.keys(yearIndices).find(key => yearIndices[key] === yearIdx);
          const currentGenderCode = Object.keys(genderIndices).find(key => genderIndices[key] === genderIdx);

          if (currentIndicatorCode && currentYearCode && currentGenderCode) {
            const currentIndicatorDataItem = tempProcessedData[currentIndicatorCode].data[yearIdx];

            if (currentIndicatorDataItem && val !== null) {
              const parsedVal = parseFloat(String(val));
              if (!isNaN(parsedVal)) {
                const genderLabel = genderLabels[currentGenderCode];
                if (genderLabel === "вкупно") currentIndicatorDataItem.total = parsedVal;
                else if (genderLabel === "жени") currentIndicatorDataItem.women = parsedVal;
                else if (genderLabel === "мажи") currentIndicatorDataItem.men = parsedVal;

                tempProcessedData[currentIndicatorCode].minValue = Math.min(
                  tempProcessedData[currentIndicatorCode].minValue,
                  parsedVal
                );
                tempProcessedData[currentIndicatorCode].maxValue = Math.max(
                  tempProcessedData[currentIndicatorCode].maxValue,
                  parsedVal
                );
              }
            }
          }
        });

        const finalProcessedData = Object.values(tempProcessedData)
          .filter(d => d.minValue !== Infinity && d.maxValue !== -Infinity)
          .sort((a, b) => indicatorIndices[a.code] - indicatorIndices[b.code]);

        setProcessedData(finalProcessedData);

      } catch (error) {
        console.error("Error fetching or processing gender statistics:", error);
      }
    };

    getData();
  }, []);

  useEffect(() => {
    if (processedData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parentDiv = d3.select(svgRef.current?.parentNode as HTMLElement);
    const containerWidth = parentDiv.node()?.getBoundingClientRect().width || 1200;

    const chartMargin = { top: 30, right: 40, bottom: 30, left: 60 };
    const chartWidth = (containerWidth / 2) - chartMargin.left - chartMargin.right - 20;
    const chartHeight = 150;

    const numIndicators = processedData.length;
    const numRows = Math.ceil(numIndicators / 2);
    const totalSvgHeight = numRows * (chartHeight + chartMargin.top + chartMargin.bottom) + 50;

    svg.attr("width", containerWidth).attr("height", totalSvgHeight);

    const years = ["2021", "2022", "2023"];
    const genderColors = {
      "вкупно": "#1f77b4",
      "жени": "#e377c2",
      "мажи": "#2ca02c",
    };

    const formatValue = (d: number, label: string): string => {
      if (label.includes("Стапка") || label.includes("%")) {
        return d3.format(".1f")(d) + "%";
      }
      if (Number.isInteger(d) || d >= 1000) {
        return d3.format(".2s")(d);
      }
      return d3.format(".1f")(d);
    };

    processedData.forEach((indicator, i) => {
      const colIndex = i % 2;
      const rowIndex = Math.floor(i / 2);

      const chartGroup = svg
        .append("g")
        .attr(
          "transform",
          `translate(
            ${colIndex * (chartWidth + chartMargin.left + chartMargin.right + 20)},
            ${rowIndex * (chartHeight + chartMargin.top + chartMargin.bottom)}
          )`
        );

      chartGroup
        .append("text")
        .attr("x", chartWidth / 2)
        .attr("y", chartMargin.top / 2 + 5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text(indicator.label);

      const xScale = d3
        .scalePoint<string>()
        .domain(years)
        .range([chartMargin.left, chartWidth - chartMargin.right])
        .padding(0.5);

      const yScale = d3
        .scaleLinear()
        .domain([indicator.minValue * 0.9, indicator.maxValue * 1.1])
        .nice()
        .range([chartHeight - chartMargin.bottom, chartMargin.top]);

      chartGroup
        .append("g")
        .attr("transform", `translate(0,${chartHeight - chartMargin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#555")
        .style("font-family", "Inter, sans-serif");

      chartGroup
        .append("g")
        .attr("transform", `translate(${chartMargin.left},0)`)
        .call(
          d3
            .axisLeft(yScale)
            .ticks(5)
            .tickFormat((d) => formatValue(d.valueOf(), indicator.label))
        )
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "#555")
        .style("font-family", "Inter, sans-serif");

      ["total", "women", "men"].forEach((genderKey) => {
        const currentGenderLabel =
            genderKey === "total"
                ? "вкупно"
                : genderKey === "women"
                ? "жени"
                : "мажи";

        const lineData = indicator.data
            .filter(d => typeof d[genderKey as keyof YearGenderValue] === 'number')
            .map((d) => ({
              year: d.year,
              value: d[genderKey as keyof YearGenderValue] as number,
              gender: currentGenderLabel,
            }));

        const lineColor = genderColors[currentGenderLabel as keyof typeof genderColors];

        const lineGenerator = d3
          .line<{ year: string; value: number }>()
          .defined(d => !isNaN(d.value))
          .x((d) => {
            const xCoord = xScale(d.year);
            return xCoord!;
          })
          .y((d) => {
            const yCoord = yScale(d.value);
            return yCoord;
          });

        if (lineData.length > 1) {
            chartGroup
            .append("path")
            .datum(lineData)
            .attr("fill", "none")
            .attr("stroke", lineColor)
            .attr("stroke-width", 2)
            .attr("d", lineGenerator)
            .style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");
        }

        chartGroup
          .selectAll(`.dot-${indicator.code}-${genderKey}`)
          .data(lineData)
          .join("circle")
          .attr("class", `dot-${indicator.code}-${genderKey}`)
          .attr("cx", (d) => {
            const xCoord = xScale(d.year);
            return xCoord!;
          })
          .attr("cy", (d) => {
            const yCoord = yScale(d.value);
            return yCoord;
          })
          .attr("r", 4)
          .attr("fill", lineColor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
          .style("cursor", "pointer")
          .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(100).attr("r", 6).attr("fill", d3.rgb(genderColors[d.gender as keyof typeof genderColors]).darker(0.5).toString());
            tooltip
              .html(`
                <strong class="font-bold text-lg">${indicator.label}</strong><br/>
                <span class="text-sm">Година: ${d.year}</span><br/>
                <span class="text-sm">${d.gender}: <strong>${formatValue(d.value, indicator.label)}</strong></span>
              `)
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px")
              .transition()
              .duration(200)
              .style("opacity", 1);
          })
          .on("mouseout", function (d) {
            d3.select(this).transition().duration(200).attr("r", 4).attr("fill", genderColors[d.gender as keyof typeof genderColors]);
            tooltip.transition().duration(500).style("opacity", 0);
          })
          .on("mousemove", function (event) {
            tooltip
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          });

        const lastYearData = lineData.find((d) => d.year === "2023");
        if (lastYearData && typeof lastYearData.value === 'number') {
          chartGroup
            .append("text")
            .attr("x", xScale("2023")! + 8)
            .attr("y", yScale(lastYearData.value))
            .attr("dy", "0.35em")
            .style("font-size", "10px")
            .style("fill", lineColor)
            .style("font-family", "Inter, sans-serif")
            .text(formatValue(lastYearData.value, indicator.label));
        }
      });
    });

    const legend = svg
      .append("g")
      .attr("transform", `translate(${containerWidth / 2 - 100}, ${totalSvgHeight - 30})`);

    let legendXOffset = 0;
    Object.entries(genderColors).forEach(([gender, color]) => {
      legend
        .append("rect")
        .attr("x", legendXOffset)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("fill", color)
        .attr("rx", 3);

      const textNode = legend
        .append("text")
        .attr("x", legendXOffset + 20)
        .attr("y", 7)
        .attr("dy", "0.35em")
        .style("font-size", "13px")
        .style("fill", "#333")
        .style("font-family", "Inter, sans-serif")
        .text(gender);

      const textWidth = textNode.node()?.getBBox().width || 0;
      legendXOffset += textWidth + 40;
    });

    const tooltip = d3
      .select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "rgba(0,0,0,0.85)")
      .style("color", "white")
      .style("padding", "10px 12px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("font-family", "Inter, sans-serif")
      .style("font-size", "13px")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
      .style("z-index", "1000");
  }, [processedData]);

  return (
    <div className="mx-auto my-3 flex min-h-screen max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-4 font-inter text-gray-800">
      <h1 className="m-1 text-3xl font-extrabold text-gray-800 text-center">
        Показатели за родова статистика (2021-2023)
      </h1>
      <p className="text-gray-600 text-center mb-4">
        Прикажува промени во клучни индикатори по пол низ годините.
      </p>

      <div className="p-2 shadow-2xl rounded-lg bg-gray-50 overflow-auto w-full max-w-[1200px] flex justify-center items-center">
        <svg ref={svgRef}></svg>
      </div>

      <div ref={tooltipRef} />
    </div>
  );
};