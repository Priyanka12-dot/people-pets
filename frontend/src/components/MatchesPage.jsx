import React, { useEffect, useState, useCallback } from "react";
import { Zap, RefreshCw, Filter } from "lucide-react";
import { getMatches, deleteMatch } from "../api";
import MatchCard from "./MatchCard";

export default function MatchesPage() {
  const [matches, setMatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [minConf, setMinConf]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "all") params.type = typeFilter;
      if (minConf > 0) params.min_confidence = minConf / 100;
      setMatches(await getMatches(params));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, minConf]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await deleteMatch(id);
    load();
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="section-title">AI Matches</h1>
        <p className="text-muted text-sm">
          All potential matches found by the AI comparison engine, ranked by confidence.
        </p>
      </div>

      {/* Controls */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex gap-2 flex-wrap">
          {["all", "person", "pet"].map((v) => (
            <button key={v} onClick={() => setTypeFilter(v)}
              className={`px-3 py-2 rounded-lg text-xs font-display font-semibold transition-colors capitalize
                ${typeFilter === v ? "bg-scan/10 text-scan border border-scan/30" : "bg-ink text-muted border border-border hover:text-body"}`}>
              {v === "all" ? "All" : v === "person" ? "Persons" : "Pets"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Filter className="h-4 w-4 text-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="sr-only">Min confidence: {minConf}%</label>
            <input type="range" min={0} max={90} step={5} value={minConf}
              onChange={(e) => setMinConf(Number(e.target.value))}
              className="w-full accent-scan" />
          </div>
          <span className="text-xs font-mono text-muted w-10 shrink-0">≥{minConf}%</span>
        </div>

        <button onClick={load} className="btn-secondary text-sm py-2 px-3 shrink-0" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-48 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-3">
          <Zap className="h-10 w-10 text-border" />
          <p className="font-display font-semibold text-bright text-lg">No matches yet</p>
          <p className="text-sm text-muted max-w-xs">
            Upload a found photo to trigger an AI scan against the missing registry.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </main>
  );
}
