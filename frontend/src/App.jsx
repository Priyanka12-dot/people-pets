import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar      from "./components/Navbar";
import Dashboard   from "./components/Dashboard";
import MissingForm from "./components/MissingForm";
import FoundForm   from "./components/FoundForm";
import MatchesPage from "./components/MatchesPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh flex flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/"        element={<Dashboard />}   />
            <Route path="/report"  element={<MissingForm />} />
            <Route path="/found"   element={<FoundForm />}   />
            <Route path="/matches" element={<MatchesPage />} />
          </Routes>
        </div>

        <footer className="border-t border-border text-center py-5 text-xs text-muted font-mono">
          People &amp; Pets — Crowdsourced Lost &amp; Found Infrastructure · DeveloperWeek Hackathon 2026
        </footer>
      </div>
    </BrowserRouter>
  );
}
