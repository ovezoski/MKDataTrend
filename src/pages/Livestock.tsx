import {
  LivestockDataRow,
  parseJsonStatData,
  RawJsonStatResponse,
} from "@/types/livestock";
import * as d3 from "d3";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Livestock() {
  const [tableData, setTableData] = useState<LivestockDataRow[]>([]);

  useEffect(() => {
    d3.json<RawJsonStatResponse>("/livestock.json")
      .then((rawJsonStatData) => {
        if (!rawJsonStatData || !rawJsonStatData.dataset) {
          throw new Error("Invalid JSON-stat data received: missing dataset.");
        }
        const parsedData = parseJsonStatData(rawJsonStatData.dataset);
        setTableData(parsedData);
      })
      .catch((err) => {
        console.error("Error loading or parsing livestock data:", err);
      });
  }, []);

  if (!tableData.length) {
    return <div>Loading data...</div>;
  }

  const headers = Object.keys(tableData[0]);

  return (
    <Table style={{ backgroundColor: "white" }}>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {headers.map((header) => (
              <TableCell key={header}>
                {row[header as keyof LivestockDataRow]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
