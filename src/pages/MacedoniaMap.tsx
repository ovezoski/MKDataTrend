import React, { useState, useEffect, useMemo } from "react";
import * as d3 from "d3";
import { FeatureCollection, Feature, MultiPolygon } from "geojson";

interface PopulationDimensionCategory {
  index: { [key: string]: number };
  label: { [key: string]: string };
}

interface PopulationDimension {
  Општина: {
    category: PopulationDimensionCategory;
  };
}

interface PopulationData {
  dimension: PopulationDimension;
  value: number[];
}

interface MunicipalityData {
  name: string;
  population: number;
  feature: Feature<MultiPolygon>;
  centroid: [number, number];
}

interface MacedoniaMapProps {
  width?: number;
  height?: number;
}

const circlePath = (
  radius: number,
  centerX: number = 0,
  centerY: number = 0,
): string => {
  const r = radius;
  const x = centerX;
  const y = centerY;

  return `M ${x - r}, ${y}
          a ${r},${r} 0 1,0 ${2 * r},0
          a ${r},${r} 0 1,0 ${-2 * r},0 Z`;
};

const spike = (length: number, width: number = 8): string => {
  return circlePath(length / 3);
  const h = -length;
  const w = width / 2;
  return `M ${-w},0 L 0,${h} L ${w},0 Z`;
};

const MacedoniaSpikeMap: React.FC<MacedoniaMapProps> = ({
  width = 800,
  height = 650,
}) => {
  const [geojsonData, setGeojsonData] = useState<FeatureCollection | null>(
    null,
  );
  const [populationData, setPopulationData] = useState<PopulationData | null>(
    null,
  );
  const [visualisationData, setVisualisationData] = useState<
    MunicipalityData[]
  >([]);
  const [loadingGeoJson, setLoadingGeoJson] = useState(true);
  const [loadingPopulation, setLoadingPopulation] = useState(true);

  const baseCountryStroke = "#3b82f6";
  const mapStrokeWidth = "1px";
  const labelPadding = 5;

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        setLoadingGeoJson(true);
        const response = await fetch("./municipalities.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: FeatureCollection = await response.json();
        setGeojsonData(data);
      } catch (e) {
        console.error("Failed to fetch GeoJSON:", e);
      } finally {
        setLoadingGeoJson(false);
      }
    };

    fetchGeoJSON();
  }, []);

  useEffect(() => {
    const fetchPopulationData = async () => {
      try {
        setLoadingPopulation(true);
        const response = await fetch("./public/population.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: PopulationData = await response.json();
        setPopulationData(data);
      } catch (e: any) {
        console.error("Failed to fetch population data:", e);
      } finally {
        setLoadingPopulation(false);
      }
    };

    fetchPopulationData();
  }, []);

  useEffect(() => {
    if (!geojsonData || !populationData) return;

    const municipalityLabels = populationData.dimension.Општина.category.label;
    const municipalityIndices = populationData.dimension.Општина.category.index;
    const populationValues = populationData.value;

    const processedData: MunicipalityData[] = [];

    geojsonData.features.forEach((feature) => {
      const municipalityName = feature.properties?.NAME_1;
      if (!municipalityName || feature.properties?.TYPE_1 === "Waterbody") {
        return;
      }

      let population = 0;
      const foundCode = Object.keys(municipalityLabels).find(
        (code) => municipalityLabels[code] === municipalityName,
      );
      if (foundCode) {
        const index =
          municipalityIndices[foundCode as keyof typeof municipalityIndices];
        if (index !== undefined && populationValues[index] !== undefined) {
          population = populationValues[index];
        }
      }

      const centroid = d3.geoCentroid(feature.geometry as MultiPolygon);

      processedData.push({
        name: municipalityName,
        population: population,
        feature: feature as Feature<MultiPolygon>,
        centroid: centroid,
      });
    });
    setVisualisationData(processedData);
  }, [geojsonData, populationData]);

  const projection = useMemo(() => {
    if (!geojsonData) return null;
    return d3.geoMercator().fitSize([width, height], geojsonData);
  }, [geojsonData, width, height]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath().projection(projection);
  }, [projection]);

  const spikeHeightScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([0, d3.max(visualisationData, (d) => d.population) || 1])
      .range([2, 85]);
  }, [visualisationData]);

  if (loadingGeoJson || loadingPopulation) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-500">
        Loading map and population data...
      </div>
    );
  }

  const numberOfMapLayers = 5;
  const mapLayerOffsetIncrement = 0.5;

  const mapStackLayers = Array.from({ length: numberOfMapLayers }).map(
    (_, i) => {
      const layerIndex = numberOfMapLayers - i;
      const currentOffset = layerIndex * mapLayerOffsetIncrement;
      const brightnessFactor = 0.1 * (numberOfMapLayers - layerIndex + 1);

      const layerStrokeColor = d3
        .color(baseCountryStroke)
        ?.darker(brightnessFactor)
        .toString();

      return (
        <g
          key={`map-layer-${layerIndex}`}
          transform={`translate(${currentOffset}, ${currentOffset})`}
        >
          {visualisationData.map((d) => (
            <path
              key={`${d.name}-layer-${layerIndex}`}
              d={pathGenerator(d.feature) || ""}
              className="municipality"
              style={{
                stroke: layerStrokeColor,
                strokeWidth: mapStrokeWidth,
              }}
            />
          ))}
        </g>
      );
    },
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center rounded-lg bg-gray-50 p-4">
      <h2 className="mb-4 text-xl font-bold text-gray-800">
        Население По Општини
      </h2>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {mapStackLayers}

        <g>
          {visualisationData.map((d) => (
            <path
              key={d.name}
              className="municipality"
              d={pathGenerator(d.feature) || ""}
              style={{
                stroke: baseCountryStroke,
                strokeWidth: mapStrokeWidth,
              }}
            >
              <title>
                <b>{d.name}</b>
                <div>({d.population})</div>
              </title>
            </path>
          ))}
        </g>

        <g
          className="spikes"
          style={{
            fill: "#f88",
            fillOpacity: 0.7,
            stroke: "red",
            strokeWidth: 1,
          }}
        >
          {visualisationData.map((municipality) => {
            const projectedCentroid = projection(municipality.centroid);

            if (!projectedCentroid) {
              return null;
            }

            const [x, y] = projectedCentroid;
            const spikeHeight = spikeHeightScale(municipality.population);

            return (
              <g
                key={`spike-${municipality.name}`}
                transform={`translate(${x}, ${y})`}
              >
                <path d={spike(spikeHeight)}>
                  <title>
                    {`${municipality.name}\nPopulation: ${d3.format(",.0f")(municipality.population)}`}
                  </title>
                </path>
              </g>
            );
          })}
        </g>

        <g className="labels">
          {visualisationData.map((municipality) => {
            const projectedCentroid = projection(municipality.centroid);
            if (!projectedCentroid) return null;
            const [x, y] = projectedCentroid;
            const spikeHeight = spikeHeightScale(municipality.population);

            return (
              <text
                key={`label-${municipality.name}`}
                x={x}
                y={y - spikeHeight - labelPadding}
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  textAnchor: "middle",
                  paintOrder: "stroke",
                  stroke: "white",
                }}
              >
                {municipality.name}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default MacedoniaSpikeMap;
