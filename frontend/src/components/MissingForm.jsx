import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Users, PawPrint, CheckCircle2, AlertCircle } from "lucide-react";
import { createMissing } from "../api";

export default function MissingForm() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    entry_type: "person",
    name: "",
    description: "",
    last_seen_location: "",
    contact_info: "",
  });
  const [image, setImage]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState(null);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);
      await createMissing(fd);
      setSuccess(true);
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      setError(err?.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="section-title">Report Missing</h1>
        <p className="text-muted text-sm">Add a missing person or pet to the registry so the community can help.</p>
      </div>

      {success && (
        <div className="card p-4 flex items-center gap-3 border-resolve/40 bg-resolve/5 animate-fade_up">
          <CheckCircle2 className="h-5 w-5 text-resolve shrink-0" />
          <p className="text-sm text-resolve font-medium">Report submitted. Redirecting to dashboard…</p>
        </div>
      )}

      {error && (
        <div className="card p-4 flex items-center gap-3 border-alert/40 bg-alert/5 animate-fade_up">
          <AlertCircle className="h-5 w-5 text-alert shrink-0" />
          <p className="text-sm text-alert">{error}</p>
        </div>
      )}

      <div className="card p-6 space-y-5">
        {/* Type selector */}
        <fieldset>
          <legend className="label">Type</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "person", label: "Person", Icon: Users },
              { value: "pet",    label: "Pet",    Icon: PawPrint },
            ].map(({ value, label, Icon }) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors
                  ${form.entry_type === value
                    ? "border-hope bg-hope/5 text-hope"
                    : "border-border bg-ink text-muted hover:border-body/40"
                  }`}
              >
                <input
                  type="radio"
                  name="entry_type"
                  value={value}
                  checked={form.entry_type === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Icon className="h-5 w-5 shrink-0" />
                <span className="font-display font-semibold text-sm">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Name */}
        <div>
          <label className="label" htmlFor="name">
            {form.entry_type === "person" ? "Full Name" : "Pet Name / Description"}
            <span className="text-alert ml-1">*</span>
          </label>
          <input
            id="name" name="name" className="input"
            placeholder={form.entry_type === "person" ? "e.g. Jane Doe" : "e.g. Golden Retriever, male, answers to Max"}
            value={form.name} onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description" name="description" rows={3}
            className="input resize-none"
            placeholder={form.entry_type === "person"
              ? "Age, height, hair colour, last known clothing…"
              : "Breed, colour, markings, collar details…"}
            value={form.description} onChange={handleChange}
          />
        </div>

        {/* Location */}
        <div>
          <label className="label" htmlFor="last_seen_location">Last Seen Location</label>
          <input
            id="last_seen_location" name="last_seen_location" className="input"
            placeholder="e.g. Riverside Park, Chicago, IL"
            value={form.last_seen_location} onChange={handleChange}
          />
        </div>

        {/* Contact */}
        <div>
          <label className="label" htmlFor="contact_info">Contact Information</label>
          <input
            id="contact_info" name="contact_info" className="input"
            placeholder="Phone number or email"
            value={form.contact_info} onChange={handleChange}
          />
        </div>

        {/* Photo upload */}
        <div>
          <p className="label">Photo</p>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-colors p-6 flex flex-col items-center gap-3
              ${preview ? "border-hope/40 bg-hope/5" : "border-border hover:border-body/40 bg-ink"}`}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted" />
                <p className="text-sm text-muted text-center">
                  Drag & drop a photo here, or <span className="text-hope">browse</span>
                </p>
                <p className="text-xs text-muted">PNG, JPG, WEBP up to 16 MB</p>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} />
          </div>
          {preview && (
            <button onClick={() => { setImage(null); setPreview(null); }}
              className="mt-2 text-xs text-muted hover:text-alert transition-colors">
              Remove photo
            </button>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || success}
          className="btn-primary w-full justify-center py-3"
        >
          {submitting ? "Submitting…" : "Submit Report"}
        </button>
      </div>
    </main>
  );
}
