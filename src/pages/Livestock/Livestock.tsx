import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LivestockTable from "./LivestockTable";
import LivestockSankey from "./LivestockSankey";
import { useState } from "react";
import LivestockTreemap from "./LivestockTreemap";

export default function Livestock() {
  const [activeTab, setActiveTab] = useState("treemap");

  return (
    <div className="container mx-auto p-1">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="treemap">Treemap Diagram</TabsTrigger>
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

        <TabsContent value="treemap">
          <div className="rounded-md border bg-white p-4">
            <h3 className="text-m mb-2 font-semibold">
              Livestock Treemap Diagram
            </h3>
            <LivestockTreemap />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
