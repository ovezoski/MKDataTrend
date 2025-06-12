import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchElectricityData } from "@/utility/fetchElectricityConsumption";

interface DataItem {
  indicator: string;
  value: number;
}

export default function App() {
  const [data, setData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchElectricityData()
      .then((json) => {
        const values = json.value;
        const indicatorCodes = json.dimension["Индикатор"].category.label;
        const indicators = Object.values(indicatorCodes) as string[];

        const parsed: DataItem[] = indicators.map((indicator, i) => ({
          indicator,
          value: values[i],
        }));

        setData(parsed);
      })
      .catch((err) => {
        setError("Неуспешно вчитување на податоците за електрична енергија. Обидете се повторно подоцна.");
        console.error("Error fetching electricity data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (data.length === 0 || isLoading || error) return;

    const svg = d3.select(svgRef.current);
    const width = 800; 
    const height = 800;
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const chartRadius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
    const innerRadius = chartRadius * 0.2;
    const outerRadius = chartRadius * 0.9;

    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "radialGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#00c6ff");
    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#0072ff");

    const xScale = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.indicator))
      .range([0, 2 * Math.PI])
      .align(0);

    const yScale = d3
      .scaleLinear<number>()
      .domain([0, d3.max(data, (d) => d.value)! * 1.1])
      .nice()
      .range([innerRadius, outerRadius]);

    const arc = d3
      .arc<DataItem>()
      .innerRadius(innerRadius)
      .outerRadius((d) => yScale(d.value))
      .startAngle((d) => xScale(d.indicator)!)
      .endAngle((d) => xScale(d.indicator)! + xScale.bandwidth())
      .padAngle(0.01)
      .padRadius(innerRadius);

    g.selectAll(".bar")
      .data(data)
      .join("path")
      .attr("class", "bar")
      .attr("fill", "url(#radialGradient)")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr("opacity", 1)
      .attrTween("d", function(d) {

        const i = d3.interpolate(innerRadius, yScale(d.value));
        return (t: number) => {
          return arc.innerRadius(innerRadius)
            .outerRadius(i(t))
            .startAngle(xScale(d.indicator)!)
            .endAngle(xScale(d.indicator)! + xScale.bandwidth())
            .padAngle(0.01)
            .padRadius(innerRadius)(d) || '';
        };
      });

    g.selectAll(".label")
    .data(data)
    .join("text")
    .attr("class", "label")
    .attr("transform", (d) => {
        const angle = xScale(d.indicator)! + xScale.bandwidth() / 2;
        const x = Math.sin(angle) * (outerRadius + 30);
        const y = -Math.cos(angle) * (outerRadius + 30);

        let rotation = angle * 180 / Math.PI;
        
        if (rotation > 90 && rotation < 270) {
        rotation += 180; 
        }
        
        return `translate(${x},${y}) rotate(${rotation})`;
    })
    .attr("dy", "0.35em")
    .style("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#333")
    .style("font-family", "Inter, sans-serif")
    .text((d) => d.indicator);

    g.selectAll(".value-label")
      .data(data)
      .join("text")
      .attr("class", "value-label")
      .attr("transform", (d) => {
        const angle = xScale(d.indicator)! + xScale.bandwidth() / 2;
        const radius = yScale(d.value) + 10;
        const x = Math.sin(angle) * radius;
        const y = -Math.cos(angle) * radius;
        return `translate(${x},${y})`;
      })
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#666")
      .style("font-family", "Inter, sans-serif")
      .text((d) => d.value.toLocaleString('mk-MK') + ' MWh');

    const tooltip = d3
      .select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "rgba(0,0,0,0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none");

    g.selectAll<SVGPathElement, DataItem>(".bar")
      .on("mouseover", function (event: MouseEvent, d: DataItem) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("fill", "#ffc107");

        tooltip
          .html(
            `Индикатор: <strong>${d.indicator}</strong><br/>Вредност: <strong>${d.value.toLocaleString('mk-MK')} MWh</strong>`,
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`)
          .transition()
          .duration(200)
          .style("opacity", 1);
      })
      .on("mousemove", function (event: MouseEvent) {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function (this: SVGPathElement) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "url(#radialGradient)");

        tooltip.transition().duration(300).style("opacity", 0);
      });
  }, [data, isLoading, error]);

  return (
    <div className="mx-auto my-3 flex min-h-screen max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-4">
      <h1 className="m-1 text-3xl font-extrabold text-gray-800 p-6">
        Потрошувачка на електрична енергија (Јануари 2025)
      </h1>

      {isLoading && <p className="text-gray-600">Вчитување податоци...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!isLoading && !error && data.length > 0 && (
        <div className="p-2 shadow-2xl rounded-lg">
          <svg ref={svgRef} width={800} height={800}></svg>
        </div>
      )}

      {!isLoading && !error && data.length === 0 && (
        <p className="text-gray-600">Нема достапни податоци за прикажување.</p>
      )}

      <div ref={tooltipRef} />
    </div>
  );
}