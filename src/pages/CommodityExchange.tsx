import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { fetchCommodityExchange } from '@/utility/fetchCommodityExchange';

interface JsonStatDimensionCategory {
  index?: string[] | { [key: string]: unknown };
  label: { [key: string]: string };
}

interface JsonStatDimension {
  category: JsonStatDimensionCategory;
}

interface RawJsonStatData {
  class: string;
  label: string;
  source: string;
  updated: string;
  id: string[];
  size: number[];
  value: number[];
  dimension: { [key: string]: JsonStatDimension };
}

interface CommodityData {
  country: string;
  value: number;
}

type DataType = 'export' | 'import';

const CommodityExchangeChart: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [data, setData] = useState<CommodityData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDataType, setCurrentDataType] = useState<DataType>('export');

  const rawApiDataRef = useRef<RawJsonStatData | null>(null);

  const processData = useCallback((
    rawData: RawJsonStatData,
    type: DataType
  ): CommodityData[] => {
    if (!rawData || !rawData.dimension || !rawData.id || !rawData.size || !rawData.value) {
      throw new Error("API response is not in the expected json-stat2 format or missing essential keys (dimension, id, size, value).");
    }

    const dimensions = rawData.dimension;
    const dimensionIds = rawData.id;
    const dimensionSizes = rawData.size;

    const countryId = "земја";
    const yearId = "Година";
    const variableId = "Варијабла";
    const tradeTypeId = "Вид на трговија";

    const countryDimIndex = dimensionIds.indexOf(countryId);
    const yearDimIndex = dimensionIds.indexOf(yearId);
    const variableDimIndex = dimensionIds.indexOf(variableId);
    const tradeTypeDimIndex = dimensionIds.indexOf(tradeTypeId);

    if (countryDimIndex === -1 || yearDimIndex === -1 || variableDimIndex === -1 || tradeTypeDimIndex === -1) {
      throw new Error(`Could not find required dimensions (земја, Година, Варијабла, ${tradeTypeId}) in API response ID list.`);
    }

    const countryDimension = dimensions[countryId];
    const yearDimension = dimensions[yearId];
    const variableDimension = dimensions[variableId];
    const tradeTypeDimension = dimensions[tradeTypeId];

    if (!countryDimension || !yearDimension || !variableDimension || !tradeTypeDimension) {
      throw new Error("Could not find full dimension definitions for земја, Година, Варијабла, or Вид на трговија.");
    }

    const getCategoryIndexes = (dimCategory: JsonStatDimensionCategory): string[] => {
      if (dimCategory && Array.isArray(dimCategory.index)) {
        return dimCategory.index;
      } else if (dimCategory && typeof dimCategory.label === 'object' && dimCategory.label !== null) {
        return Object.keys(dimCategory.label);
      }
      return [];
    };

    const countryIndexes: string[] = getCategoryIndexes(countryDimension.category);
    const countryLabels: { [key: string]: string } = countryDimension.category.label;

    const yearIndexes: string[] = getCategoryIndexes(yearDimension.category);
    const variableIndexes: string[] = getCategoryIndexes(variableDimension.category);
    const tradeTypeIndexes: string[] = getCategoryIndexes(tradeTypeDimension.category);

    if (!Array.isArray(countryIndexes) || countryIndexes.length === 0 ||
      !Array.isArray(yearIndexes) || yearIndexes.length === 0 ||
      !Array.isArray(variableIndexes) || variableIndexes.length === 0 ||
      !Array.isArray(tradeTypeIndexes) || tradeTypeIndexes.length === 0) {
      throw new Error("Failed to extract valid dimension categories (indexes) from API response.");
    }

    const targetYearId = "1";
    const targetVariableId = "3";

    let targetTradeTypeId: string;
    if (type === 'export') {
      targetTradeTypeId = "R";
    } else {
      targetTradeTypeId = "S";
    }

    const yearCategoryIndex = yearIndexes.indexOf(targetYearId);
    const variableCategoryIndex = variableIndexes.indexOf(targetVariableId);
    const tradeTypeCategoryIndex = tradeTypeIndexes.indexOf(targetTradeTypeId);


    if (yearCategoryIndex === -1) {
      throw new Error(`Target year '${targetYearId}' not found in API response.`);
    }
    if (variableCategoryIndex === -1) {
      throw new Error(`Target variable '${targetVariableId}' (Вредност во ЕУР) not found in API response.`);
    }
    if (tradeTypeCategoryIndex === -1) {
      throw new Error(`Target trade type '${targetTradeTypeId}' not found in API response.`);
    }

    const transformedData: CommodityData[] = [];
    const dataValues = rawData.value;

    const strides: { [key: string]: number } = {};
    let currentStride = 1;
    for (let i = dimensionIds.length - 1; i >= 0; i--) {
      const dimId: string = dimensionIds[i];
      strides[dimId] = currentStride;
      currentStride *= dimensionSizes[i];
    }

    countryIndexes.forEach((countryCode: string) => {
      const countryIdxInResponse = countryIndexes.indexOf(countryCode);

      let flatIndex = 0;
      dimensionIds.forEach((dimId: string) => {
        if (dimId === countryId) {
          flatIndex += countryIdxInResponse * strides[dimId];
        } else if (dimId === yearId) {
          flatIndex += yearCategoryIndex * strides[dimId];
        } else if (dimId === variableId) {
          flatIndex += variableCategoryIndex * strides[dimId];
        } else if (dimId === tradeTypeId) {
          flatIndex += tradeTypeCategoryIndex * strides[dimId];
        }
      });

      const value = dataValues[flatIndex];

      if (value !== undefined && value !== null) {
        transformedData.push({
          country: countryLabels[countryCode] || countryCode,
          value: value as number,
        });
      }
    });

    return transformedData;
  }, []);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        const rawData: RawJsonStatData = await fetchCommodityExchange();
        rawApiDataRef.current = rawData;

        const initialData = processData(rawData, 'export');
        setData(initialData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
        console.error("Error fetching or processing data:", err);
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, [processData]);

  useEffect(() => {
    if (rawApiDataRef.current) {
      try {
        setLoading(true);
        const processed = processData(rawApiDataRef.current, currentDataType);
        setData(processed);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred while switching data type.");
        }
        console.error("Error processing data for type switch:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }
  }, [currentDataType, processData]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const chartWidth = 1200;
    const chartHeight = 800;

    const margin = { top: 40, right: 40, bottom: 60, left: 120 };
    const width = chartWidth - margin.left - margin.right;
    const height = chartHeight - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
      .attr("id", "barGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", currentDataType === 'export' ? "#007bff" : "#28a745");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", currentDataType === 'export' ? "#89cff0" : "#90ee90");

    data.sort((a, b) => a.value - b.value);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 0])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.country))
      .range([0, height])
      .paddingInner(0.2)
      .paddingOuter(0.1);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x)
        .ticks(5)
        .tickFormat(d => d3.format(".2s")(d as number)))
      .attr("color", "#666")
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "11px")
      .style("fill", "#333");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text("Вредност (во ЕУР)");

    svg.append("g")
      .call(d3.axisLeft(y)
        .tickSizeOuter(0))
      .attr("color", "#666")
      .call(g => g.select(".domain").remove())
      .selectAll("text")
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "12px")
      .style("fill", "#333");

    svg.selectAll<SVGRectElement, CommodityData>(".bar")
      .data(data, d => d.country)
      .join(
        enter => enter.append("rect")
          .attr("class", "bar")
          .attr("x", 0)
          .attr("y", d => y(d.country)!)
          .attr("height", y.bandwidth())
          .attr("fill", "url(#barGradient)")
          .style("cursor", "pointer")
          .attr("width", 0)
          .call(enter => enter.transition()
            .duration(800)
            .delay((_d, i) => i * 50)
            .attr("width", d => x(d.value))),
        update => update.transition()
          .duration(800)
          .delay((_d, i) => i * 50)
          .attr("y", d => y(d.country)!)
          .attr("height", y.bandwidth())
          .attr("fill", "url(#barGradient)")
          .attr("width", d => x(d.value)),
        exit => exit.transition()
          .duration(500)
          .attr("width", 0)
          .remove()
      )
      .on("mouseover", function(event, d) {
        d3.select(this).transition().duration(100).attr("fill", currentDataType === 'export' ? "#0056b3" : "#1e7e34");
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`Country: ${d.country}<br/>Value: ${d.value.toLocaleString()} EUR`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).transition().duration(100).attr("fill", "url(#barGradient)");
        tooltip.transition().duration(500).style("opacity", 0);
      });

    const tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
      d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "12px")
        .style("pointer-events", "none");
    }

    svg.selectAll(".label")
      .data(data, d => d.country)
      .join(
        enter => enter.append("text")
          .attr("class", "label")
          .attr("x", 0)
          .attr("y", d => y(d.country)! + y.bandwidth() / 2)
          .attr("dy", "0.35em")
          .text(d => d.value.toLocaleString())
          .style("font-family", "Arial, sans-serif")
          .style("font-size", "10px")
          .style("fill", "#333")
          .call(enter => enter.transition()
            .duration(800)
            .delay((_d, i) => i * 50)
            .attr("x", d => x(d.value) + 8)),
        update => update.transition()
          .duration(800)
          .delay((_d, i) => i * 50)
          .attr("x", d => x(d.value) + 8)
          .attr("y", d => y(d.country)! + y.bandwidth() / 2)
          .text(d => d.value.toLocaleString()),
        exit => exit.transition()
          .duration(500)
          .attr("x", 0)
          .remove()
      );

  }, [data, currentDataType]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen rounded-2xl bg-amber-50 p-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Стоковна размена по земји, кумулативни податоци
      </h1>

      <div className="mb-8 flex space-x-4">
        <button
          onClick={() => setCurrentDataType('export')}
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200
            ${currentDataType === 'export' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-blue-100'}`
          }
        >
          Извоз (Експорт)
        </button>
        <button
          onClick={() => setCurrentDataType('import')}
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200
            ${currentDataType === 'import' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-green-100'}`
          }
        >
          Увоз (Импорт)
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-lg font-semibold text-gray-700">Loading commodity exchange data...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md" role="alert">
          <p className="font-bold">Error!</p>
          <p>{error}</p>
        </div>
      )}

      {(!loading && !error && (!data || data.length === 0)) && (
        <div className="p-6 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg shadow-md" role="alert">
          <p className="font-bold">No Data!</p>
          <p>No data available for visualization for the selected type.</p>
        </div>
      )}

      {(!loading && !error && data && data.length > 0) && (
        <div className="bg-white p-6 rounded-lg shadow-2xl">
          <svg ref={svgRef} width={1200} height={800}></svg>
        </div>
      )}
    </div>
  );
};

export default CommodityExchangeChart;