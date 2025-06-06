import {
  LivestockDataRow,
  parseJsonStatData,
  RawJsonStatResponse,
} from "@/types/livestock";
import * as d3 from "d3";
import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnOrderState,
  createColumnHelper,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";

export default function LivestockTable() {
  const [tableData, setTableData] = useState<LivestockDataRow[]>([]);
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "Value",
      desc: true,
    },
  ]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnHelper = createColumnHelper<LivestockDataRow>();

  const columns = useMemo(() => {
    return [
      {
        accessorKey: "Regions",
        enableSorting: true,
      },
      {
        accessorKey: "Year",
        enableSorting: true,
      },
      columnHelper.accessor("Livestock/Poultry/Bee-hives", {
        header: "Type",
        enableSorting: true,
      }),
      columnHelper.accessor("Value", {
        id: "Value",
        enableSorting: true,
        cell: (info) => {
          const value = info.getValue();
          return new Intl.NumberFormat(navigator.language).format(value);
        },
      }),
    ];
  }, [columnHelper]);

  const table = useReactTable({
    columns,
    data: tableData,
    state: {
      columnOrder,
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    initialState: {
      columnOrder: ["Regions", "Year", "Type", "Value"],
      expanded: true,
      pagination,
      sorting: [
        {
          id: "Value",
          desc: true,
        },
      ],
    },
  });

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

  return (
    <div className="m-auto mt-5 h-min w-3/4 rounded-md border bg-white p-3">
      <Table className="">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: (
                          <ChevronUp className="float-right inline h-4 w-4" />
                        ),
                        desc: (
                          <ChevronDown className="float-right inline h-4 w-4" />
                        ),
                        default: (
                          <ChevronsUpDown className="float-right inline h-4 w-4" />
                        ),
                      }[header.column.getIsSorted() as string] || (
                        <ChevronsUpDown className="float-right inline h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
