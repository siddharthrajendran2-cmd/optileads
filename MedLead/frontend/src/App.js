import { useState } from "react";
import "./index.css";
import Navbar from "./components/Navbar";
import SearchPage from "./pages/SearchPage";
import VisitTrackerPage from "./pages/VisitTrackerPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [page, setPage] = useState("search");

  return (
    <div className="min-h-screen bg-[#F4F6F7]">
      <Navbar page={page} setPage={setPage} />
      <main>
        {page === "search" && <SearchPage />}
        {page === "visits" && <VisitTrackerPage />}
        {page === "dashboard" && <DashboardPage />}
      </main>
    </div>
  );
}

export default App;
