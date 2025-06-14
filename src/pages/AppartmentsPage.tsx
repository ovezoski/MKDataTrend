import { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { AppartmentsDataset, Dimension } from "@/types/appartments";

interface TreemapNode extends d3.HierarchyRectangularNode<TreemapNodeData> {
  data: {
    name: string;
    value?: number;
    children?: TreemapNodeData[];
  };
}

interface TreemapNodeData {
  name: string;
  value?: number;
  children?: TreemapNodeData[];
}

const AppartmentsPage = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [data, setData] = useState<AppartmentsDataset | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [rootNode, setRootNode] = useState<TreemapNode | null>(null);
  const [currentView, setCurrentView] = useState<TreemapNode | null>(null);

  useEffect(() => {
    fetch("/appartments.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(setData)
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [data]);

  useEffect(() => {
    if (!data || dimensions.width === 0) return;

    const apartmentsDim = data.dimension["Завршени станови"];
    const yearsDim = data.dimension["Година"];
    const regionsDim = data.dimension["Регион"];

    const getOrderedCategory = (dimension: Dimension) =>
      Object.keys(dimension.category.index)
        .sort(
          (a, b) => dimension.category.index[a] - dimension.category.index[b],
        )
        .map((key) => ({ code: key, label: dimension.category.label[key] }));

    const orderedApartmentTypes = getOrderedCategory(apartmentsDim);
    const orderedYears = getOrderedCategory(yearsDim);
    const orderedRegions = getOrderedCategory(regionsDim);

    const selectedYearData = orderedYears.find((y) => y.label === selectedYear);
    if (!selectedYearData) return;

    const selectedYearIdx = yearsDim.category.index[selectedYearData.code];
    const numYears = data.size[1];
    const numRegions = data.size[2];

    const rootData: TreemapNodeData = {
      name: `Завршени станови (${selectedYearData.label})`,
      children: orderedRegions
        .map((region) => {
          const regionNode: TreemapNodeData = {
            name: region.label,
            children: orderedApartmentTypes
              .map((aptType) => {
                const aptTypeIndex = apartmentsDim.category.index[aptType.code];
                const regionIndex = regionsDim.category.index[region.code];
                const flatIndex =
                  aptTypeIndex * (numYears * numRegions) +
                  selectedYearIdx * numRegions +
                  regionIndex;
                const value = data.value[flatIndex] || 0;
                return value > 0 ? { name: aptType.label, value } : null;
              })
              .filter((child): child is TreemapNodeData => child !== null),
          };
          return regionNode.children && regionNode.children.length > 0
            ? regionNode
            : null;
        })
        .filter((child): child is TreemapNodeData => child !== null),
    };

    const hierarchy = d3
      .hierarchy(rootData)
      .sum((d) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    const newRoot = d3
      .treemap<TreemapNodeData>()
      .size([dimensions.width, dimensions.height])
      .paddingInner(2)
      .paddingOuter(4)
      .round(true)(hierarchy) as TreemapNode;

    setRootNode(newRoot);
    setCurrentView(newRoot);
  }, [data, selectedYear, dimensions]);

  const drawTreemap = useCallback(
    (node: TreemapNode | null) => {
      if (!node || !svgRef.current || dimensions.width === 0) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const { width, height } = dimensions;

      const scaleX = width / (node.x1 - node.x0);
      const scaleY = height / (node.y1 - node.y0);
      const translateX = -node.x0 * scaleX;
      const translateY = -node.y0 * scaleY;

      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${translateX},${translateY})scale(${scaleX},${scaleY})`,
        );

      const color = d3.scaleOrdinal(d3.schemeTableau10);

      const cell = g
        .selectAll("g")
        .data(node.descendants())
        .join("g")
        .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.children && d !== currentView) {
            setCurrentView(d);
          } else if (d === currentView && d.parent) {
            setCurrentView(d.parent as TreemapNode);
          }
        });

      cell
        .append("rect")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => d.y1 - d.y0)
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("fill", (d) => {
          if (d === node) return "transparent";
          if (!d.parent) return "gray";
          const parentColor = color(
            d.parent === node ? d.data.name : d.parent.data.name,
          );
          return d.parent === node
            ? parentColor
            : d3.color(parentColor)?.darker(0.5) || "gray";
        })
        .attr("stroke", (d) => (d === node ? "darkgray" : "none"))
        .attr("stroke-width", (d) => (d === node ? 2 : 0))
        .style("cursor", (d) =>
          d.children && d !== node ? "pointer" : "default",
        );

      const addText = (
        selection: any,
        y: number,
        fontSize: string,
        getText: (d: TreemapNode) => string,
      ) => {
        selection
          .append("text")
          .attr("x", 5)
          .attr("y", y)
          .attr("fill", "white")
          .attr("font-size", fontSize)
          .text(getText)
          .style("display", (d) =>
            d.x1 - d.x0 < 40 || d.y1 - d.y0 < 40 ? "none" : "block",
          );
      };

      addText(cell, 16, "12px", (d) => {
        const rectWidth = d.x1 - d.x0;
        let text = d.data.name;
        if (d.parent && d.parent !== node) {
          text = `${d.parent.data.name} - ${text}`;
        }
        return rectWidth > text.length * 6 ? text : "";
      });

      addText(cell, 32, "10px", (d) => {
        if (d === node || d.value === undefined) return "";
        const text = d.value.toLocaleString();
        return d.x1 - d.x0 > text.length * 6 ? text : "";
      });

      if (node !== rootNode) {
        svg
          .append("text")
          .attr("x", 10)
          .attr("y", 20)
          .text("← Назад")
          .attr("fill", "blue")
          .style("cursor", "pointer")
          .on("click", () => setCurrentView(node.parent || rootNode));
      }
    },
    [dimensions, rootNode, currentView],
  );

  useEffect(() => {
    drawTreemap(currentView);
  }, [currentView, drawTreemap]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        Вчитување податоци...
      </div>
    );
  }

  const years = Object.values(data.dimension["Година"].category.label);

  return (
    <div className="font-inter flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Визуелизација на завршени станови
      </h1>
      <div className="mb-4">
        <label
          htmlFor="year-select"
          className="mb-2 block text-sm font-bold text-gray-700"
        >
          Избери Година:
        </label>
        <select
          id="year-select"
          className="focus:shadow-outline appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div
        ref={wrapperRef}
        className="h-[600px] w-full max-w-4xl rounded-lg bg-white p-4 shadow-lg"
      >
        <svg ref={svgRef} className="h-full w-full"></svg>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Прикажува завршени станови по региони и број на соби за избраната
        година. Кликнете на регион за да зумирате.
      </p>
    </div>
  );
};

export default AppartmentsPage;
