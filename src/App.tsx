import "./App.css";
import PelagoniaMap from "./pages/PelagoniaMap";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MacedoniaMap from "./pages/MacedoniaMap";
import HomePage from "./pages/HomePage";
import SidebarNavigation from "./components/SidebarNavigation";
import { SidebarProvider } from "./components/ui/sidebar";
import { NetoSalary } from "./pages/NetoSalary";
import Livestock from "./pages/Livestock/Livestock";
import CommodityExchangeChart from "./pages/CommodityExchange";
import ElectricityConsumption from "./pages/ElectricityConsumption";
export function App() {
  return (
    <Router>
      <div>
        <SidebarProvider>
          <SidebarNavigation />
          <div className="w-full">
            <div className="">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/population" element={<MacedoniaMap />} />
                <Route path="/pelagonia" element={<PelagoniaMap />} />
                <Route path="/livestock" element={<Livestock />} />
                <Route path="/salary" element={<NetoSalary />} />
                <Route path="/commodity" element={<CommodityExchangeChart />} />
                <Route path="electricity" element={<ElectricityConsumption />} />
              </Routes>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </Router>
  );
}

export default App;
