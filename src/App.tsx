import "./App.css";
import PelagoniaMap from "./pages/PelagoniaMap";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MacedoniaMap from "./pages/MacedoniaMap";
import HomePage from "./pages/HomePage";
import SidebarNavigation from "./components/SidebarNavigation";
import { SidebarProvider } from "./components/ui/sidebar";
import { NetoSalary } from "./pages/NetoSalary";
import LivestockSankey from "./pages/Livestock/LivestockSankey";
import Livestock from "./pages/Livestock/Livestock";
import CommodityExchangeChart from "./pages/CommodityExchange";
export function App() {
  return (
    <Router>
      <div>
        <SidebarProvider>
          <SidebarNavigation />
          <div className="w-full">
            <div className="m-2 ml-0 rounded-md bg-white p-3">
              <h2>Mak Stats</h2>
            </div>
            <div className="">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/population" element={<MacedoniaMap />} />
                <Route path="/pelagonia" element={<PelagoniaMap />} />
                <Route path="/livestock" element={<Livestock />} />
                <Route path="/salary" element={<NetoSalary />} />
                <Route path ="/commodity" element={<CommodityExchangeChart />} />
              </Routes>
            </div>
          </div>
        </SidebarProvider>
      </div>
    </Router>
  );
}

export default App;
