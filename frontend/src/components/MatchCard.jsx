import React from "react";
import { Zap, MapPin, Phone, Users, PawPrint, Trash2 } from "lucide-react";
import { imageUrl, deleteMatch } from "../api";

function ConfidenceBar({ value }) {
  const pct = Math.min(Math.max(value, 0), 100);
  const color =
    pct >= 75 ? "bg-resolve" :
    pct >= 50 ? "bg-hope"    :
    pct >= 30 ? "bg-signal"  : "bg-alert";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted font-mono">Match confidence</span>
        <span className={`font-mono font-bold ${
          pct >= 75 ? "text-resolve" : pct >= 50 ? "text-hope" : pct >= 30 ? "text-signal" : "text-alert"
        }`}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-ink overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchCard({ match, onDelete }) {
  const { missing_entry: missing, found_entry: found, confidence, match_type, id } = match;
  const isPerson = match_type === "person";
  const TypeIcon = isPerson ? Users : PawPrint;

  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm("Remove this match?")) onDelete(id);
  };

  return (
    <article className="card overflow-hidden animate-fade_up">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-ink/60">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-scan" />
          <span className="font-display font-semibold text-bright text-sm">AI Match</span>
          <span className={`badge ${isPerson ? "bg-signal/20 text-signal" : "bg-hope/20 text-hope"}`}>
            <TypeIcon className="h-3 w-3" />
            {isPerson ? "Person" : "Pet"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted font-mono">
            {new Date(match.created_at).toLocaleDateString()}
          </span>
          {onDelete && (
            <button onClick={handleDelete}
              className="p-1 rounded text-muted hover:text-alert hover:bg-alert/10 transition-colors"
              aria-label="Delete match">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Confidence bar */}
        <ConfidenceBar value={confidence} />

        {/* Side by side comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Found side */}
          <div className="rounded-xl border border-scan/30 bg-scan/5 overflow-hidden">
            <p className="px-3 py-2 text-xs font-mono font-medium text-scan border-b border-scan/20">
              FOUND
            </p>
            <div className="p-3 space-y-2">
              {found?.image_path && (
                <img src={imageUrl(found.image_path)} alt="Found"
                  className="w-full h-32 object-cover rounded-lg" loading="lazy" />
              )}
              <div className="space-y-1">
                {found?.location_found && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{found.location_found}</span>
                  </div>
                )}
                {found?.reporter_contact && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{found.reporter_contact}</span>
                  </div>
                )}
                {found?.notes && (
                  <p className="text-xs text-muted line-clamp-2">{found.notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Missing side */}
          <div className="rounded-xl border border-alert/30 bg-alert/5 overflow-hidden">
            <p className="px-3 py-2 text-xs font-mono font-medium text-alert border-b border-alert/20">
              MISSING REPORT
            </p>
            <div className="p-3 space-y-2">
              {missing?.image_path && (
                <img src={imageUrl(missing.image_path)} alt={missing.name}
                  className="w-full h-32 object-cover rounded-lg" loading="lazy" />
              )}
              <div className="space-y-1">
                <p className="font-display font-semibold text-bright text-sm">
                  {missing?.name || "Unknown"}
                </p>
                {missing?.description && (
                  <p className="text-xs text-muted line-clamp-2">{missing.description}</p>
                )}
                {missing?.last_seen_location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{missing.last_seen_location}</span>
                  </div>
                )}
                {missing?.contact_info && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{missing.contact_info}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confidence callout */}
        <p className={`text-xs rounded-lg px-3 py-2 font-mono
          ${confidence >= 75 ? "bg-resolve/10 text-resolve border border-resolve/20" :
            confidence >= 50 ? "bg-hope/10 text-hope border border-hope/20" :
            confidence >= 30 ? "bg-signal/10 text-signal border border-signal/20" :
                               "bg-alert/10 text-alert border border-alert/20"}`}>
          {confidence >= 75
            ? "High confidence match — contact the reporter immediately."
            : confidence >= 50
            ? "Possible match — review photos carefully before contacting."
            : confidence >= 30
            ? "Low confidence — visual inspection recommended."
            : "Very low confidence — likely not a match."}
        </p>
      </div>
    </article>
  );
}
