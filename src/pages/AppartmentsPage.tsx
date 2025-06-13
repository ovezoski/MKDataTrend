import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";
import { AppartmentsDataset, Dimension } from "@/types/appartments";

interface TreemapNode extends d3.HierarchyRectangularNode<unknown> {
  data: {
    name: string;
    value?: number | null;
    children?: TreemapNodeData[];
  };
}

interface TreemapNodeData {
  name: string;
  value?: number | null;
  children?: TreemapNodeData[];
}

const AppartmentsPage = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [data, setData] = useState<AppartmentsDataset | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("2024");
  const [currentZoomNode, setCurrentZoomNode] = useState<TreemapNode | null>(
    null,
  );
  const [initialRoot, setInitialRoot] = useState<TreemapNode | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response: Response = await fetch("/appartments.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData: AppartmentsDataset = await response.json();
        setData(jsonData);
      } catch (error: any) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (wrapperRef.current) {
      setDimensions({
        width: wrapperRef.current.offsetWidth,
        height: wrapperRef.current.offsetHeight,
      });
    }

    const handleResize = () => {
      if (wrapperRef.current) {
        setDimensions({
          width: wrapperRef.current.offsetWidth,
          height: wrapperRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [data]);

  const drawTreemap = useCallback(
    (node: TreemapNode | null) => {
      if (
        !data ||
        dimensions.width === 0 ||
        dimensions.height === 0 ||
        !node ||
        !svgRef.current
      ) {
        return;
      }

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const { width, height } = dimensions;

        // d3
        // .hierarchy(node)
        // .sum((d: TreemapNodeData) => d.value || 0)
        // .sort(
        //   (
        //     a: d3.HierarchyNode<TreemapNodeData>,
        //     b: d3.HierarchyNode<TreemapNodeData>,
        //   ) => (b.value || 0) - (a.value || 0),
        // ) as TreemapNode;


      const treemap = d3
        .treemap<TreemapNodeData>()
        .size([width, height])
        .paddingInner(2)
        .paddingOuter(4)
        .round(true);

      treemap(node);

      console.log(node.descendants());

      const color = d3.scaleOrdinal(d3.schemeTableau10);

      const cell = svg
        .selectAll<SVGGElement, TreemapNode>("g")
        .data(node.descendants())
        .join("g")
        .attr("transform", (d: TreemapNode) => `translate(${d.x0},${d.y0})`)
        .on("click", (event: MouseEvent, d: TreemapNode) => {
          
          console.log("d", d);

          event.stopPropagation();
          if (d.children && d !== node) {
            console.log("parent", d);
            setCurrentZoomNode(d);
          }
        });

      cell
        .append("rect")
        .attr("width", (d: TreemapNode) => d.x1 - d.x0)
        .attr("height", (d: TreemapNode) => d.y1 - d.y0)
        .attr("fill", (d: TreemapNode) => {
          if (d === node) {
            return "transparent";
          }
          if (initialRoot && d.depth === initialRoot.depth + 1) {
            return color(d.data.name);
          } else if (initialRoot && d.depth === initialRoot.depth + 2) {
            return (
              d3.color(color(d.parent!.data.name) as any)?.darker(0.5) || "gray"
            );
          }
          return "gray";
        })
        .attr("stroke", (d: TreemapNode) => (d === node ? "darkgray" : "none"))
        .attr("stroke-width", (d: TreemapNode) => (d === node ? 2 : 0))
        .attr("rx", 5)
        .attr("ry", 5)
        .style("cursor", (d: TreemapNode) =>
          d.children && d !== node ? "pointer" : "default",
        );

      cell
        .append("text")
        .attr("x", 4)
        .attr("y", 16)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .text((d: TreemapNode) => {
          const rectWidth = d.x1 - d.x0;
          let textToDisplay = d.data.name;
          textToDisplay += " " + d.parent?.data?.name;
          const textWidth = textToDisplay.length * 6;
          return rectWidth > textWidth ? textToDisplay : "*";
        });

      cell
        .append("text")
        .attr("x", 4)
        .attr("y", 32)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text((d: TreemapNode) => {
          if (d === node) return "";
          const rectWidth = d.x1 - d.x0;
          const textToDisplay =
            d.data.value !== null && d.data.value !== undefined
              ? d.data.value.toLocaleString()
              : "";
          const textWidth = textToDisplay.length * 6;
          return rectWidth > textWidth ? textToDisplay : "";
        });

      if (node !== initialRoot && initialRoot) {
        svg
          .append("text")
          .attr("x", 10)
          .attr("y", 20)
          .text("← Назад")
          .attr("fill", "blue")
          .style("cursor", "pointer")
          .on("click", () => {
            if (node.parent) {
              setCurrentZoomNode(node.parent as TreemapNode);
            } else {
              setCurrentZoomNode(initialRoot);
            }
          });
      }
    },
    [data, dimensions, initialRoot],
  );

  useEffect(() => {
    if (!data || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const apartmentsDim: Dimension = data.dimension["Завршени станови"];
    const yearsDim: Dimension = data.dimension["Година"];
    const regionsDim: Dimension = data.dimension["Регион"];

    const orderedApartmentTypes = Object.keys(apartmentsDim.category.index)
      .sort(
        (a: string, b: string) =>
          apartmentsDim.category.index[a] - apartmentsDim.category.index[b],
      )
      .map((key: string) => ({
        code: key,
        label: apartmentsDim.category.label[key],
      }));

    const orderedYears = Object.keys(yearsDim.category.index)
      .sort(
        (a: string, b: string) =>
          yearsDim.category.index[a] - yearsDim.category.index[b],
      )
      .map((key: string) => ({
        code: key,
        label: yearsDim.category.label[key],
      }));

    const orderedRegions = Object.keys(regionsDim.category.index)
      .sort(
        (a: string, b: string) =>
          regionsDim.category.index[a] - regionsDim.category.index[b],
      )
      .map((key: string) => ({
        code: key,
        label: regionsDim.category.label[key],
      }));

    const selectedYearData = orderedYears.find(
      (y: { label: string }) => y.label === selectedYear,
    );
    if (!selectedYearData) return;

    const selectedYearIdx: number =
      yearsDim.category.index[selectedYearData.code];
    const numYears: number = data.size[1];
    const numRegions: number = data.size[2];

    const rootData: TreemapNodeData = {
      name: `Завршени станови (${selectedYearData.label})`,
      children: [],
    };

    orderedRegions.forEach((regionObj: { code: string; label: string }) => {
      const regionNode: TreemapNodeData = {
        name: regionObj.label,
        children: [],
      };

      orderedApartmentTypes.forEach(
        (aptTypeObj: { code: string; label: string }) => {
          const apartmentTypeIndex: number =
            apartmentsDim.category.index[aptTypeObj.code];
          const flatIndex: number =
            apartmentTypeIndex * (numYears * numRegions) +
            selectedYearIdx * numRegions +
            regionsDim.category.index[regionObj.code];
          let value: number | null = data.value[flatIndex];

          if (value === null) {
            value = 0;
          }

          if (value > 0) {
            regionNode.children!.push({
              name: aptTypeObj.label,
              value: value,
            });
          }
        },
      );
      if (regionNode.children && regionNode.children.length > 0) {
        rootData.children!.push(regionNode);
      }
    });

    const newRoot = d3
      .hierarchy(rootData)
      .sum((d: TreemapNodeData) => d.value || 0)
      .sort(
        (
          a: d3.HierarchyNode<TreemapNodeData>,
          b: d3.HierarchyNode<TreemapNodeData>,
        ) => (b.value || 0) - (a.value || 0),
      ) as TreemapNode;

    setInitialRoot(newRoot);
    setCurrentZoomNode(newRoot);
  }, [data, selectedYear, dimensions]);

  useEffect(() => {
    drawTreemap(currentZoomNode);
  }, [currentZoomNode, drawTreemap]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
  };

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        Вчитување податоци...
      </div>
    );
  }

  const years: string[] = Object.keys(
    data.dimension["Година"].category.label,
  ).map((key: string) => data.dimension["Година"].category.label[key]);

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
          onChange={handleYearChange}
        >
          {years.map((year: string) => (
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
