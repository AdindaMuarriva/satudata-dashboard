import { Routes, Route } from "react-router-dom";
import ListView from "./components/ListView.jsx";
import DetailView from "./components/DetailView.jsx";

export default function App() {
  return (
    <div className="wrap">
      <Routes>
        <Route path="/" element={<ListView />} />
        <Route path="/dataset/:uuid" element={<DetailView />} />
      </Routes>
    </div>
  );
}
