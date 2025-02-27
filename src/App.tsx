import "./App.css";
import Box from "./Box";

export function App() {
  return (
    <div className="bg-white">
      <div className="text-bold bg-red-100 pb-2">Mak Stats</div>
      <div className="flex">
        <Box shadow="shadow-md" />
        <Box shadow="shadow-xl" />
        <Box shadow="shadow-lg" />
      </div>
    </div>
  );
}

export default App;
