import "./App.css";
import MacedoniaMap from "./pages/MacedoniaMap";

export function App() {
  return (
    <div className="margin-auto bg-white">
      <div className="text-bold pb-2">Mak Stats</div>

      <div className="margin-auto jc-center flex text-center">
        <MacedoniaMap />
      </div>
    </div>
  );
}

export default App;
