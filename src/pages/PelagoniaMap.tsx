import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { getColor, invertCoordinates } from "../utility/functions";
import { initialTooltipState } from "../utility/tooltip";

const PelagoniaMap = ({ width = 800, height = 600 }) => {
  const svgRef = useRef(null);
  const [geoData, setGeoData] = useState<FeatureCollection | undefined>();
  const [regionsData, setRegionsData] = useState<
    FeatureCollection | undefined
  >();

  const [tooltip, setTooltip] = useState(initialTooltipState);

  useEffect(() => {
    Promise.all([
      d3.json<FeatureCollection>("/mk.json"),
      d3.json<FeatureCollection<Polygon | MultiPolygon>>(
        "/internalRegions.json",
      ),
    ])
      .then(([macedoniaBorder, internalRegions]) => {
        setGeoData(macedoniaBorder);

        if (internalRegions && internalRegions.features) {
          const clonedInternalRegions: FeatureCollection<
            Polygon | MultiPolygon
          > = JSON.parse(JSON.stringify(internalRegions));

          setRegionsData(invertCoordinates(clonedInternalRegions));
        } else {
          setRegionsData(internalRegions);
        }
      })
      .catch((error) => {
        console.error("Error loading GeoJSON data:", error);
      });
  }, []);

  useEffect(() => {
    if (!geoData || !regionsData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = d3.geoMercator().fitSize([width, height], geoData);

    const pathGenerator = d3.geoPath().projection(projection);

    //terain code
    svg
      .append("defs")
      .append("radialGradient")
      .attr("id", "earthTerrainRadialGradient")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")
      .attr("fx", "50%")
      .attr("fy", "50%")
      .selectAll("stop")
      .data([
        { offset: "0%", color: "#F5DEB3" },
        { offset: "25%", color: "#D2B48C" },
        { offset: "50%", color: "#C8E6C9" },
        { offset: "75%", color: "#A8D7A8" },
        { offset: "100%", color: "#8BC88B" },
      ])
      .enter()
      .append("stop")
      .attr("offset", function (d) {
        return d.offset;
      })
      .attr("stop-color", function (d) {
        return d.color;
      });

    svg
      .append("g")
      .selectAll("path.border")
      .data(geoData.features)
      .enter()
      .append("path")
      .attr("class", "border")
      .attr("d", pathGenerator)
      .attr("fill", "#E8E8E8")
      .attr("fill", "url(#earthTerrainRadialGradient)")
      .attr("stroke", "#5A5A5A")
      .attr("stroke-width", 1);

    svg
      .append("g")
      .selectAll("path.region")
      .data(regionsData.features)
      .enter()
      .append("path")
      .attr("class", "region")
      .attr("d", pathGenerator)
      .attr("fill", (d) => getColor(d.properties?.category))
      .attr("stroke", (d) => {
        const baseColor = getColor(d.properties?.category);
        if (!baseColor) return null;
        const d3Color = d3.color(baseColor);
        return d3Color ? d3Color.darker(0.3).toString() : null;
      })

      .attr("stroke-width", 1)
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).attr("opacity", 0.7);
        setTooltip({
          visible: true,
          content: `${d.properties?.name || "Unknown Region"}`,
          x: event.pageX + 10,
          y: event.pageY - 20,
        });
      })
      .on("mousemove", (event) => {
        setTooltip((prev) => ({
          ...prev,
          x: event.pageX + 10,
          y: event.pageY - 20,
        }));
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).attr("opacity", 1);
        setTooltip({ visible: false, content: "", x: 0, y: 0 });
      })
      .on("click", (_event, d) => {
        console.log("Clicked on:", d.properties?.name);
      });

    svg
      .append("g")
      .selectAll("text.region-label")
      .data(regionsData.features)
      .enter()
      .append("text")
      .attr("class", "region-label")
      .attr("x", (d) => {
        const centroid = pathGenerator.centroid(d);
        return centroid[0];
      })
      .attr("y", (d) => {
        const centroid = pathGenerator.centroid(d);
        return centroid[1];
      })
      .text((d) => d.properties?.name)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "central")
      .attr("font-size", "9px")
      .attr("font-family", "Arial, sans-serif")
      .attr("fill", "#333")
      .style("pointer-events", "none");
  }, [geoData, regionsData, width, height]);

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ backgroundColor: "#a7cee2" }}
      ></svg>
      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "3px",
            fontSize: "12px",
            pointerEvents: "none",
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default PelagoniaMap;
