import React, { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { FeatureCollection } from "geojson";
import { citiesData } from "../data/city";

interface MacedoniaMapProps {
  width?: number;
  height?: number;
}

const MacedoniaMap: React.FC<MacedoniaMapProps> = ({
  width = 700,
  height = 550,
}) => {
  const [geojsonData, setGeojsonData] = useState<FeatureCollection | undefined>(
    undefined,
  );

  const numberOfMapLayers = 5;
  const mapLayerOffsetIncrement = 0.5;
  const baseCountryFill = "#e0f2fe";
  const baseCountryStroke = "#3b82f6";
  const mapStrokeWidth = "1px";

  const columnWidth = 12;
  const perspectiveDepthX = 6;
  const perspectiveDepthY = -6;
  const numberOfSegmentsInStack = 3;

  useEffect(() => {
    d3.json<FeatureCollection>("/mk.json")
      .then((data) => {
        setGeojsonData(data);
      })
      .catch((error) => {
        console.error("Error loading GeoJSON data:", error);
      });
  }, []);

  const projection = useMemo(() => {
    if (!geojsonData) return null;
    return d3.geoMercator().fitSize([width, height], geojsonData);
  }, [geojsonData, width, height]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath().projection(projection);
  }, [projection]);

  const columnHeightScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, d3.max(citiesData, (d) => d.population) || 1])
      .range([15, 75]);
  }, []);

  if (!geojsonData || !projection || !pathGenerator) {
    return <div>Loading map data...</div>;
  }

  const mapStackLayers = Array.from({ length: numberOfMapLayers }).map(
    (_, i) => {
      const layerIndex = numberOfMapLayers - i;
      const currentOffset = layerIndex * mapLayerOffsetIncrement;
      const fillBrightnessFactor = 0.1 * (numberOfMapLayers - layerIndex + 1);
      const strokeBrightnessFactor = 0.1 * (numberOfMapLayers - layerIndex + 1);

      const layerFillColor = d3
        .color(baseCountryFill)
        ?.darker(fillBrightnessFactor)
        .toString();
      const layerStrokeColor = d3
        .color(baseCountryStroke)
        ?.darker(strokeBrightnessFactor)
        .toString();

      return (
        <path
          key={`map-layer-${layerIndex}`}
          d={pathGenerator(geojsonData) || ""}
          transform={`translate(${currentOffset}, ${currentOffset})`}
          style={{
            fill: layerFillColor,
            stroke: layerStrokeColor,
            strokeWidth: mapStrokeWidth,
          }}
        />
      );
    },
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {mapStackLayers}

      <path
        className="country"
        style={{
          fill: baseCountryFill,
          stroke: baseCountryStroke,
          strokeWidth: mapStrokeWidth,
        }}
        d={pathGenerator(geojsonData) || ""}
      />

      {citiesData.map((city) => {
        const [x, y] = projection(city.coordinates) || [0, 0];
        if (x === 0 && y === 0 && city.name !== "Skopje") {
          console.warn(`Projection failed for city: ${city.name}`);
          return null;
        }

        const totalHeight = columnHeightScale(city.population);
        const segmentHeight = totalHeight / numberOfSegmentsInStack;

        return (
          <g
            key={city.name}
            transform={`translate(${x}, ${y})`}
            className="city-group"
          >
            {Array.from({ length: numberOfSegmentsInStack }).map((_, i) => {
              const segmentBaseY = -(i * segmentHeight);
              const segmentTopY = -((i + 1) * segmentHeight);
              return (
                <React.Fragment key={i}>
                  <path
                    className="city-column-side"
                    style={{
                      fill: "#dc2626",
                      stroke: "#c03030",
                      strokeWidth: "0.5px",
                    }}
                    d={`M ${columnWidth / 2},${segmentBaseY} L ${columnWidth / 2},${segmentTopY} L ${columnWidth / 2 + perspectiveDepthX},${segmentTopY + perspectiveDepthY} L ${columnWidth / 2 + perspectiveDepthX},${segmentBaseY + perspectiveDepthY} Z`}
                  />
                  <path
                    className="city-column-front"
                    style={{
                      fill: "#ef4444",
                      stroke: "#c03030",
                      strokeWidth: "0.5px",
                    }}
                    d={`M ${-columnWidth / 2},${segmentBaseY} L ${columnWidth / 2},${segmentBaseY} L ${columnWidth / 2},${segmentTopY} L ${-columnWidth / 2},${segmentTopY} Z`}
                  />
                  <path
                    className="city-column-top"
                    style={{
                      fill: "#f87171",
                      stroke: "#c03030",
                      strokeWidth: "0.5px",
                    }}
                    d={`M ${-columnWidth / 2},${segmentTopY} L ${columnWidth / 2},${segmentTopY} L ${columnWidth / 2 + perspectiveDepthX},${segmentTopY + perspectiveDepthY} L ${-columnWidth / 2 + perspectiveDepthX},${segmentTopY + perspectiveDepthY} Z`}
                  />
                </React.Fragment>
              );
            })}
            <text
              className="city-label"
              style={{
                fontSize: "10px",
                fontWeight: 500,
                fill: "#1f2937",
                textAnchor: "middle",
                paintOrder: "stroke",
                stroke: "#fff",
                strokeWidth: "2.5px",
              }}
              dy={-totalHeight + perspectiveDepthY - 8}
            >
              {city.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default MacedoniaMap;
