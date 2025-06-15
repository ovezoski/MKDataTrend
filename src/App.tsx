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
import { GenderStatisticsChart } from "./pages/GenderStats";
import AppartmentsPage from "./pages/AppartmentsPage";
import PassengerCrossingHeatmap from "./pages/PassengerCrossingHeatmap";
import JobVacanciesDashboard from "./pages/Job Vacancies/JobVacanciesDashboard";
import WholesaleTreemap from "./pages/WholesaleTreemap";
import PlantProduction from "./pages/PlantProduction";
import RegionalCropProduction from "./pages/RegionalCropProduction";

export function App() {
  return (
    <Router>
      <div>
        <SidebarProvider>
          <SidebarNavigation />
          <div className="w-full">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/appartments" element={<AppartmentsPage />} />
              <Route path="/population" element={<MacedoniaMap />} />
              <Route path="/plant" element={<PlantProduction />} />
              <Route
                path="/plant-regional"
                element={<RegionalCropProduction />}
              />
              <Route path="/livestock" element={<Livestock />} />
              <Route path="/salary" element={<NetoSalary />} />
              <Route path="/commodity" element={<CommodityExchangeChart />} />
              <Route path="/electricity" element={<ElectricityConsumption />} />
              <Route path="/sale" element={<WholesaleTreemap />} />
              <Route path="/gender" element={<GenderStatisticsChart />} />
              <Route path="/job" element={<JobVacanciesDashboard />} />
              <Route path="/passenger" element={<PassengerCrossingHeatmap />} />
            </Routes>
          </div>
        </SidebarProvider>
      </div>
    </Router>
  );
}

export default App;
