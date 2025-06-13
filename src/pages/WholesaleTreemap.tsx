import React, { useEffect, useState } from "react";
import { Treemap, Tooltip, ResponsiveContainer } from "recharts";
import { fetchWholesaleTrade2023 } from "@/utility/fetchWholeSaleTrade";

interface WholesaleAPIData {
  dimension: {
    "Назив на групата производи": {
      category: {
        label: { [key: string]: string };
      };
    };
  };
  value: number[];
}

interface TreemapChildNode {
  name: string;
  size: number;
  fill?: string;
}

interface TreemapRootNode {
  name: string;
  children: TreemapChildNode[];
}

interface CustomTreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
  value?: number;
}

const WholesaleTreemap: React.FC = () => {
  const [data, setData] = useState<TreemapRootNode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const json: WholesaleAPIData = await fetchWholesaleTrade2023();

        const productLabels =
          json.dimension["Назив на групата производи"].category.label;
        const values = json.value;

        const colors = [
          "#4CAF50",
          "#2196F3",
          "#FFC107",
          "#F44336",
          "#9C27B0",
          "#00BCD4",
          "#FF5722",
          "#607D8B",
          "#795548",
          "#E91E63",
        ];

        const children: TreemapChildNode[] = Object.entries(
          productLabels
        ).map(([, label], index) => ({
          name: label,
          size: values[index],
          fill: colors[index % colors.length],
        }));

        setData({
          name: "Wholesale Trade Turnover",
          children,
        });
      } catch (err) {
        console.error("Failed to fetch wholesale trade data:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-96 text-lg text-gray-700">
        Loading wholesale trade data...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-96 text-lg text-red-600">
        Error: {error}
      </div>
    );
  if (!data)
    return (
      <div className="flex justify-center items-center h-96 text-lg text-gray-700">
        No data available.
      </div>
    );

  return (
    <div className="mx-auto my-8 max-w-6xl p-6 bg-white rounded-xl shadow-2xl border border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
        Годишен промет во трговијата на големо по групи на производи (2023)
      </h2>
      <ResponsiveContainer width="100%" height={550}>
        <Treemap
          data={data.children}
          dataKey="size"
          nameKey="name"
          stroke="#fff"
          content={<CustomTreemapContent />}
        >
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const dataItem = payload[0].payload;
                return (
                  <div className="bg-white p-3 border border-gray-300 rounded-md shadow-md text-gray-800">
                    <p className="font-semibold text-lg">{dataItem.name}</p>
                    <p className="text-sm">
                      Промет:{" "}
                      <span className="font-medium">
                        {dataItem.size.toLocaleString()} МКД
                      </span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
      <p className="text-sm text-gray-600 mt-6 text-center">
        *Податоците го прикажуваат годишниот промет во трговијата на големо за
        2023 година, изразен во денари.
      </p>
    </div>
  );
};

const CustomTreemapContent: React.FC<CustomTreemapContentProps> = (props) => {
  const { x, y, width, height, name, fill, value } = props;

  if (x === undefined || y === undefined || width === undefined || height === undefined || name === undefined) {
    return null;
  }

  const textPadding = 8;
  const maxTextWidth = width - textPadding * 2;

  const shouldDisplayText = width > 80 && height > 30;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill || "#82ca9d",
          stroke: "#fff",
          strokeWidth: 1.5,
          opacity: 0.9,
        }}
        className="transition-all duration-200 ease-in-out hover:opacity-100 hover:scale-[1.01]"
      />
      {shouldDisplayText && (
        <>
          <text
            x={x + textPadding}
            y={y + textPadding + 10}
            fill="#FFFFFF"
            fontSize={Math.min(16, maxTextWidth / name.length * 1.5)}
            fontWeight="bold"
            alignmentBaseline="hanging"
            textAnchor="start"
            style={{
                userSelect: "none",
                pointerEvents: "none",
                textShadow: "1px 1px 2px rgba(0,0,0,0.4)"
            }}
          >
            {name}
          </text>
          {value !== undefined && height > 50 && (
              <text
                x={x + textPadding}
                y={y + textPadding + 30}
                fill="#F0F0F0"
                fontSize={Math.min(12, maxTextWidth / String(value).length * 1.5)}
                alignmentBaseline="hanging"
                textAnchor="start"
                style={{
                    userSelect: "none",
                    pointerEvents: "none",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.4)"
                }}
              >
                {value.toLocaleString()} МКД
              </text>
          )}
        </>
      )}
    </g>
  );
};

export default WholesaleTreemap;