import { useRef } from "react";
import ListPage from "./ListPage";
import DetailPage from "./Detailpage";

export default function App() {
  const tooltipRef = useRef(null);
  const uuid = new URLSearchParams(window.location.search).get("dataset");

  return (
    <div className="wrap">
      {uuid
        ? <DetailPage uuid={uuid} tooltipRef={tooltipRef} />
        : <ListPage tooltipRef={tooltipRef} />}
      <div className="tooltip" ref={tooltipRef}></div>
    </div>
  );
}