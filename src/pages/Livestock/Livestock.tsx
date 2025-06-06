import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LivestockTable from "./LivestockTable";
import LivestockSankey from "./LivestockSankey";
import { useState } from "react";

export default function Livestock() {
  const [activeTab, setActiveTab] = useState("table");

  return (
    <div className="container mx-auto p-1">
      <Tabs
        defaultValue="table"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="sankey">Sankey Diagram</TabsTrigger>
        </TabsList>

        <TabsContent value="table">
          <div className="neutral-50 rounded-md border bg-white p-4">
            <h3 className="text-m mb-2 font-semibold">Livestock Data Table</h3>
            <LivestockTable />
          </div>
        </TabsContent>

        <TabsContent value="sankey">
          <div className="rounded-md border bg-white p-4">
            <h3 className="text-m mb-2 font-semibold">
              Livestock Sankey Diagram
            </h3>
            <LivestockSankey />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
