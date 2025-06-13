import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const AppartmentsPage = () => {
  const svgRef = useRef();
  const wrapperRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2024");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/appartments.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
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

  useEffect(() => {
    if (!data || dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    const apartmentsDim = data.dimension["Завршени станови"];
    const yearsDim = data.dimension["Година"];
    const regionsDim = data.dimension["Регион"];

    const orderedApartmentTypes = Object.keys(apartmentsDim.category.index)
      .sort(
        (a, b) =>
          apartmentsDim.category.index[a] - apartmentsDim.category.index[b],
      )
      .map((key) => ({ code: key, label: apartmentsDim.category.label[key] }));

    const orderedYears = Object.keys(yearsDim.category.index)
      .sort((a, b) => yearsDim.category.index[a] - yearsDim.category.index[b])
      .map((key) => ({ code: key, label: yearsDim.category.label[key] }));

    const orderedRegions = Object.keys(regionsDim.category.index)
      .sort(
        (a, b) => regionsDim.category.index[a] - regionsDim.category.index[b],
      )
      .map((key) => ({ code: key, label: regionsDim.category.label[key] }));

    const selectedYearData = orderedYears.find((y) => y.label === selectedYear);
    if (!selectedYearData) return;

    const selectedYearIdx = yearsDim.category.index[selectedYearData.code];
    const totalApartmentTypeIndex = apartmentsDim.category.index["0"];

    const rootData = {
      name: `Завршени станови во ${selectedYearData.label}`,
      children: [],
    };

    orderedRegions.forEach((regionObj, regionIdx) => {
      const flatIndex =
        totalApartmentTypeIndex * (data.size[1] * data.size[2]) +
        selectedYearIdx * data.size[2] +
        regionIdx;
      let value = data.value[flatIndex];

      if (value === null) {
        value = 0;
      }

      if (value > 0) {
        rootData.children.push({
          name: regionObj.label,
          value: value,
        });
      }
    });

    const root = d3
      .hierarchy(rootData)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    const treemap = d3
      .treemap()
      .size([width, height])
      .paddingInner(1)
      .paddingOuter(3)
      .round(true);

    treemap(root);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const cell = svg
      .selectAll("g")
      .data(root.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    cell
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => color(d.data.name))
      .attr("rx", 5)
      .attr("ry", 5);

    cell
      .append("text")
      .attr("x", 4)
      .attr("y", 16)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .text((d) => {
        const rectWidth = d.x1 - d.x0;
        const textWidth = d.data.name.length * 6;
        return rectWidth > textWidth ? d.data.name : "";
      });

    cell
      .append("text")
      .attr("x", 4)
      .attr("y", 32)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .text((d) => {
        const rectWidth = d.x1 - d.x0;
        const textWidth = d.value.toString().length * 6;
        return rectWidth > textWidth ? d.value.toLocaleString() : "";
      });
  }, [data, dimensions, selectedYear]);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        Вчитување податоци...
      </div>
    );
  }

  const years = Object.keys(data.dimension["Година"].category.label).map(
    (key) => data.dimension["Година"].category.label[key],
  );

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
        Прикажува вкупен број на завршени станови по региони за избраната
        година.
      </p>
    </div>
  );
};

export default AppartmentsPage;
