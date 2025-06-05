import "./App.css";
import PelagoniaMap from "./pages/PelagoniaMap";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import MacedoniaMap from "./pages/MacedoniaMap";
import HomePage from "./pages/HomePage";
import SidebarNavigation from "./components/SidebarNavigation";
import { SidebarProvider } from "./components/ui/sidebar";
import Livestock from "./pages/Livestock";
export function App() {
  return (
    <Router>
      <SidebarProvider>
        <SidebarNavigation />
        <div className="margin-auto flex w-full justify-center">
          <div className="p-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/population" element={<MacedoniaMap />} />
              <Route path="/pelagonia" element={<PelagoniaMap />} />
              <Route path="/livestock" element={<Livestock />} />
            </Routes>
          </div>
        </div>
      </SidebarProvider>
    </Router>
  );
}

export default App;
