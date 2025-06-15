import {
  LivestockDataRow,
  parseJsonStatData,
  RawJsonStatResponse,
} from "@/types/livestock";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import * as d3 from "d3";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  RabbitIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import SheepIcon from "/src/components/icons/sheep.svg?react";
import CattleIcon from "/src/components/icons/cattle.svg?react";
import PigIcon from "/src/components/icons/pig.svg?react";
import BeeIcon from "/src/components/icons/bee.svg?react";
import GoatIcon from "/src/components/icons/goat.svg?react";
import ChickenIcon from "/src/components/icons/chicken.svg?react";

const animalIcons = {
  Sheep: <SheepIcon width="20px" height="20px" />,
  Cattles: <CattleIcon width="20px" height="20px" />,
  "Bee-hives": <BeeIcon width="20px" height="20px" />,
  Pigs: <PigIcon width="20px" height="20px" />,
  Poultry: <ChickenIcon width="20px" height="20px" />,
  Goats: <GoatIcon width="20px" height="20px" />,
};

const SortingIcon = ({ isSorted }: { isSorted: false | "asc" | "desc" }) => {
  if (isSorted === "asc") {
    return <ArrowUp className="ml-2 inline h-4 w-4" />;
  }
  if (isSorted === "desc") {
    return <ArrowDown className="ml-2 inline h-4 w-4" />;
  }
  return <ChevronsUpDown className="ml-2 inline h-4 w-4 opacity-30" />;
};

export default function LivestockTable() {
  const [data, setData] = useState<LivestockDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "Value", desc: true },
  ]);

  const columns = useMemo<ColumnDef<LivestockDataRow>[]>(
    () => [
      {
        accessorKey: "Regions",
        header: "Region",
        size: 10,
      },

      {
        accessorKey: "Livestock/Poultry/Bee-hives",
        header: "Type",
        size: 5,
        cell: ({ row }) => {
          const animal = row.getValue("Livestock/Poultry/Bee-hives");
          const IconComponent = animalIcons[animal] || (
            <RabbitIcon width="20px" height="20px" />
          );

          return (
            <div className="align-center flex justify-between">
              <span>{animal ?? ""}</span>
              <span>{IconComponent}</span>
            </div>
          );
        },
      },
      {
        size: 30,

        accessorKey: "Value",
        header: "Value",
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("Value"));
          const formatted = new Intl.NumberFormat("en-US").format(amount);
          return <div className="text-right font-medium">{formatted}</div>;
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
        pageIndex: 0,
      },
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const rawData = await d3.json<RawJsonStatResponse>("/livestock.json");
        if (!rawData?.dataset) {
          throw new Error("Invalid JSON-stat data received");
        }
        const parsedData = parseJsonStatData(rawData.dataset);
        setData(parsedData);
      } catch (error) {
        console.error("Error loading or parsing livestock data:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading table data...</div>;
  }

  return (
    <div className="bg-card text-card-foreground container mx-auto flex flex-col gap-4 rounded-lg border p-4 shadow-sm">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="select-none">
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex cursor-pointer items-center"
                            : "flex items-center"
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <SortingIcon isSorted={header.column.getIsSorted()} />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground flex-1 text-sm">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
