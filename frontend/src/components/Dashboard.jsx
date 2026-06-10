import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users, PawPrint, CheckCircle2, Zap,
  MapPin, Phone, Clock, Search, RefreshCw, Trash2
} from "lucide-react";
import { getMissing, getStats, updateMissingStatus, deleteMissing, imageUrl } from "../api";

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <p className="text-2xl font-display font-bold text-bright">{value ?? "—"}</p>
        <p className="text-xs text-muted font-body mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Entry card ───────────────────────────────────────────────────────────────
function EntryCard({ entry, onStatusChange, onDelete }) {
  const isPerson = entry.entry_type === "person";
  const isMissing = entry.status === "missing";

  return (
    <article className="card overflow-hidden flex flex-col animate-fade_up">
      {/* Image */}
      <div className="relative h-44 bg-ink overflow-hidden">
        {entry.image_path ? (
          <img
            src={imageUrl(entry.image_path)}
            alt={entry.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted">
            {isPerson ? <Users className="h-10 w-10 opacity-30" /> : <PawPrint className="h-10 w-10 opacity-30" />}
          </div>
        )}

        {/* Type badge */}
        <span className={`absolute top-3 left-3 badge text-night font-semibold
          ${isPerson ? "bg-signal" : "bg-hope"}`}>
          {isPerson ? "Person" : "Pet"}
        </span>

        {/* Status badge */}
        <span className={`absolute top-3 right-3 badge
          ${isMissing ? "bg-alert/20 text-alert border border-alert/30" : "bg-resolve/20 text-resolve border border-resolve/30"}`}>
          {isMissing ? "Missing" : "Found"}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <h3 className="font-display font-semibold text-bright text-base line-clamp-1">{entry.name}</h3>

        {entry.description && (
          <p className="text-sm text-muted line-clamp-2">{entry.description}</p>
        )}

        <div className="flex flex-col gap-1.5 mt-auto">
          {entry.last_seen_location && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{entry.last_seen_location}</span>
            </div>
          )}
          {entry.contact_info && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{entry.contact_info}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{new Date(entry.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-border mt-1">
          {isMissing ? (
            <button
              onClick={() => onStatusChange(entry.id, "found")}
              className="flex-1 text-xs btn-primary py-1.5 justify-center"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Found
            </button>
          ) : (
            <button
              onClick={() => onStatusChange(entry.id, "missing")}
              className="flex-1 text-xs btn-secondary py-1.5 justify-center"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            aria-label="Delete entry"
            className="p-1.5 rounded-lg text-muted hover:text-alert hover:bg-alert/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [entries, setEntries]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [filter, setFilter]     = useState("all");   // "all" | "person" | "pet"
  const [status, setStatus]     = useState("missing"); // "missing" | "found" | "all"
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== "all") params.type = filter;
      if (status !== "all") params.status = status;
      const [data, s] = await Promise.all([getMissing(params), getStats()]);
      setEntries(data);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [filter, status]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, newStatus) => {
    await updateMissingStatus(id, newStatus);
    load();
  };

  const handleDelete = async (id) => {
    if (confirm("Remove this entry from the registry?")) {
      await deleteMissing(id);
      load();
    }
  };

  const visible = entries.filter((e) =>
    search.trim() === "" ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.last_seen_location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero */}
      <section className="space-y-2">
        <h1 className="section-title">
          Lost &amp; Found Registry
        </h1>
        <p className="text-muted text-sm max-w-xl">
          A crowdsourced database helping communities reunite missing persons and pets with their families.
        </p>
      </section>

      {/* Stats */}
      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Users}       label="Missing Persons"  value={stats.missing_persons}           color="bg-alert/10 text-alert"   />
          <StatCard icon={PawPrint}    label="Missing Pets"     value={stats.missing_pets}              color="bg-signal/10 text-signal" />
          <StatCard icon={CheckCircle2} label="Persons Found"   value={stats.found_persons}             color="bg-resolve/10 text-resolve" />
          <StatCard icon={CheckCircle2} label="Pets Found"      value={stats.found_pets}                color="bg-hope/10 text-hope"     />
          <StatCard icon={Zap}         label="AI Matches"       value={stats.total_matches}             color="bg-scan/10 text-scan"     />
          <StatCard icon={Zap}         label="High Confidence"  value={stats.high_confidence_matches}   color="bg-hope/10 text-hope"     />
        </section>
      )}

      {/* Controls */}
      <section className="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by name or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["all","person","pet"].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-3 py-2 rounded-lg text-xs font-display font-semibold transition-colors capitalize
                ${filter === v ? "bg-hope/10 text-hope border border-hope/30" : "bg-ink text-muted border border-border hover:text-body"}`}
            >
              {v === "all" ? "All types" : v === "person" ? "Persons" : "Pets"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {["missing","found","all"].map((v) => (
            <button
              key={v}
              onClick={() => setStatus(v)}
              className={`px-3 py-2 rounded-lg text-xs font-display font-semibold transition-colors capitalize
                ${status === v ? "bg-hope/10 text-hope border border-hope/30" : "bg-ink text-muted border border-border hover:text-body"}`}
            >
              {v === "all" ? "All status" : v}
            </button>
          ))}
        </div>

        <button onClick={load} className="btn-secondary text-sm py-2 px-3 shrink-0" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading" : "Refresh"}
        </button>
      </section>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center gap-3">
          <Search className="h-10 w-10 text-border" />
          <p className="font-display font-semibold text-bright text-lg">No entries found</p>
          <p className="text-sm text-muted max-w-xs">
            Try adjusting the filters, or{" "}
            <Link to="/report" className="text-hope hover:underline">add a missing report</Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </main>
  );
}
