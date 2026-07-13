import { useRef } from "react";
import ListPage from "./ListPage";
import DetailPage from "./Detailpage";
import OrgPage from "./OrgPage";
import AllOrgsPage from "./AllOrgsPage";
import TopicPage from "./TopicPage";
import FeaturePage from "./FeaturePage";
import SearchResultsPage from "./SearchResultsPage";
import ComparePage from "./ComparePage";

export default function App() {
  const tooltipRef = useRef(null);
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get("dataset");
  const org = params.get("org");
  const page = params.get("page");
  const topic = params.get("topic");
  const feature = params.get("feature");
  const query = params.get("query");
  const datasets = params.get("datasets");

  return (
    <div className="wrap">
      {uuid ? (
        <DetailPage uuid={uuid} tooltipRef={tooltipRef} />
      ) : page === "all-orgs" ? (
        <AllOrgsPage />
      ) : page === "topic" ? (
        <TopicPage topicName={topic || "Semua"} />
      ) : page === "feature" ? (
        <FeaturePage featureName={feature || "Dataset"} />
      ) : page === "search" ? (
        <SearchResultsPage query={query || ""} />
      ) : page === "compare" ? (
        <ComparePage datasetIds={datasets ? datasets.split(",").filter(Boolean) : []} tooltipRef={tooltipRef} />
      ) : org ? (
        <OrgPage orgName={org} tooltipRef={tooltipRef} />
      ) : (
        <ListPage tooltipRef={tooltipRef} />
      )}
      <div className="tooltip" ref={tooltipRef}></div>
    </div>
  );
}
