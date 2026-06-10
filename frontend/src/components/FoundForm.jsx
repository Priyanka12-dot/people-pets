import React, { useState, useRef } from "react";
import { Upload, Users, PawPrint, ScanLine, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { createFound } from "../api";
import MatchCard from "./MatchCard";

const SCAN_STEPS = [
  "Preprocessing image…",
  "Extracting features…",
  "Searching registry…",
  "Calculating similarity scores…",
  "Ranking matches…",
];

export default function FoundForm() {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    entry_type: "person",
    location_found: "",
    reporter_contact: "",
    notes: "",
  });
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [matches, setMatches]   = useState(null);   // null = not run yet
  const [foundEntry, setFoundEntry] = useState(null);
  const [error, setError]       = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setMatches(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setMatches(null);
  };

  const handleSubmit = async () => {
    if (!image) { setError("Please upload a photo to scan."); return; }
    setError(null);
    setScanning(true);
    setScanStep(0);

    // Animated step progression (visual polish)
    let step = 0;
    const stepTimer = setInterval(() => {
      step += 1;
      if (step < SCAN_STEPS.length) setScanStep(step);
      else clearInterval(stepTimer);
    }, 600);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("image", image);
      const result = await createFound(fd);
      clearInterval(stepTimer);
      setScanStep(SCAN_STEPS.length - 1);
      await new Promise((r) => setTimeout(r, 400)); // let last step render
      setFoundEntry(result.found_entry);
      setMatches(result.matches || []);
    } catch (err) {
      clearInterval(stepTimer);
      setError(err?.response?.data?.error || "Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="section-title">Upload Found Photo</h1>
        <p className="text-muted text-sm">
          Found a stray person or animal? Upload a photo and our AI will scan the missing registry for potential matches.
        </p>
      </div>

      {error && (
        <div className="card p-4 flex items-center gap-3 border-alert/40 bg-alert/5 animate-fade_up">
          <AlertCircle className="h-5 w-5 text-alert shrink-0" />
          <p className="text-sm text-alert">{error}</p>
        </div>
      )}

      <div className="card p-6 space-y-5">
        {/* Type selector */}
        <fieldset>
          <legend className="label">What did you find?</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "person", label: "A Person", Icon: Users },
              { value: "pet",    label: "A Pet",    Icon: PawPrint },
            ].map(({ value, label, Icon }) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors
                  ${form.entry_type === value
                    ? "border-scan bg-scan/5 text-scan"
                    : "border-border bg-ink text-muted hover:border-body/40"
                  }`}
              >
                <input
                  type="radio" name="entry_type" value={value}
                  checked={form.entry_type === value}
                  onChange={handleChange} className="sr-only"
                />
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-display font-semibold text-sm">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Photo upload */}
        <div>
          <p className="label">Photo <span className="text-alert">*</span></p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => !scanning && fileRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-colors flex flex-col items-center gap-3
              ${scanning ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
              ${preview ? "border-scan/40 bg-scan/5 p-4" : "border-border hover:border-scan/40 bg-ink p-8"}`}
          >
            {preview ? (
              <div className="relative w-full">
                <img src={preview} alt="Found" className="max-h-56 mx-auto rounded-lg object-contain" />
                {/* Scan overlay */}
                {scanning && (
                  <div className="absolute inset-0 rounded-lg overflow-hidden border border-scan/40">
                    <div className="w-full h-0.5 bg-scan/70 absolute left-0 animate-scan_line" />
                    <div className="absolute inset-0 bg-scan/5" />
                  </div>
                )}
              </div>
            ) : (
              <>
                <ScanLine className="h-9 w-9 text-muted" />
                <p className="text-sm text-muted text-center">
                  Drop a photo here, or <span className="text-scan">browse</span>
                </p>
                <p className="text-xs text-muted">PNG, JPG, WEBP up to 16 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
          </div>
          {preview && !scanning && (
            <button onClick={() => { setImage(null); setPreview(null); setMatches(null); }}
              className="mt-2 text-xs text-muted hover:text-alert transition-colors">
              Remove photo
            </button>
          )}
        </div>

        {/* Scan progress */}
        {scanning && (
          <div className="rounded-xl border border-scan/30 bg-scan/5 p-4 space-y-3 animate-fade_up">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-scan opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-scan" />
              </span>
              <span className="text-scan text-sm font-mono font-medium">Scanning…</span>
            </div>
            <div className="space-y-1.5">
              {SCAN_STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs transition-opacity duration-300
                  ${i <= scanStep ? "opacity-100" : "opacity-25"}`}>
                  {i < scanStep ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-resolve shrink-0" />
                  ) : i === scanStep ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-scan border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <span className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                  )}
                  <span className={i === scanStep ? "text-scan" : "text-muted"}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional fields */}
        <div>
          <label className="label" htmlFor="location_found">Where was the {form.entry_type} found?</label>
          <input id="location_found" name="location_found" className="input"
            placeholder="e.g. Downtown shelter, Main St & 5th Ave" value={form.location_found} onChange={handleChange} />
        </div>
        <div>
          <label className="label" htmlFor="reporter_contact">Your Contact</label>
          <input id="reporter_contact" name="reporter_contact" className="input"
            placeholder="Phone or email for follow-up" value={form.reporter_contact} onChange={handleChange} />
        </div>
        <div>
          <label className="label" htmlFor="notes">Additional Notes</label>
          <textarea id="notes" name="notes" rows={2} className="input resize-none"
            placeholder="Any extra details that might help identify them…" value={form.notes} onChange={handleChange} />
        </div>

        <button onClick={handleSubmit} disabled={scanning || !image}
          className="btn-primary w-full justify-center py-3">
          <ScanLine className="h-5 w-5" />
          {scanning ? "Scanning Registry…" : "Scan & Submit"}
        </button>
      </div>

      {/* Results */}
      {matches !== null && !scanning && (
        <section className="space-y-4 animate-fade_up">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-bright text-xl">
              Scan Complete —{" "}
              <span className={matches.length > 0 ? "text-hope" : "text-muted"}>
                {matches.length} match{matches.length !== 1 ? "es" : ""} found
              </span>
            </h2>
          </div>

          {matches.length === 0 ? (
            <div className="card p-8 flex flex-col items-center gap-3 text-center">
              <ScanLine className="h-10 w-10 text-border" />
              <p className="font-display font-semibold text-bright">No matches in the registry</p>
              <p className="text-sm text-muted max-w-xs">
                The photo has been saved. As new missing reports are added, the system will continue to compare them.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
