"""
app.py — People & Pets: Crowdsourced Lost & Found Infrastructure
Flask entry point, all API routes.
"""

import os
import uuid
import logging
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS

from config import Config
from extensions import db
from models import MissingEntry, FoundEntry, Match

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# App factory
# ─────────────────────────────────────────────────────────────────────────────

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, origins=app.config["CORS_ORIGINS"])
    db.init_app(app)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    with app.app_context():
        db.create_all()

    # ── Helpers ──────────────────────────────────────────────────────────────

    def allowed_file(filename):
        return (
            "." in filename
            and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]
        )

    def save_upload(file_obj):
        """Save uploaded file with a unique name. Returns relative web path."""
        ext = file_obj.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        dest = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file_obj.save(dest)
        return f"static/uploads/{filename}", dest  # (relative, absolute)

    def run_ai_match(entry_type: str, found_abs_path: str, found_id: int):
        """
        Compare the newly uploaded found photo against all matching missing entries.
        Persists Match rows and returns them as dicts.
        """
        from ai.face_match import match_against_registry as face_registry
        from ai.pet_match import match_against_registry as pet_registry

        missing_entries = MissingEntry.query.filter_by(
            entry_type=entry_type, status="missing"
        ).all()

        if entry_type == "person":
            raw_results = face_registry(found_abs_path, missing_entries)
        else:
            raw_results = pet_registry(found_abs_path, missing_entries)

        matches = []
        for r in raw_results:
            m = Match(
                missing_id=r["missing_id"],
                found_id=found_id,
                confidence=r["confidence"],
                match_type=entry_type,
            )
            db.session.add(m)
            db.session.flush()   # get m.id before commit
            db.session.refresh(m)
            matches.append(m.to_dict())

        db.session.commit()
        return matches

    # ── Static uploads ───────────────────────────────────────────────────────

    @app.route("/static/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # ── Health ───────────────────────────────────────────────────────────────

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "people-pets"})

    # ── Missing entries ───────────────────────────────────────────────────────

    @app.route("/api/missing", methods=["GET"])
    def list_missing():
        entry_type = request.args.get("type")          # "person" | "pet"
        status = request.args.get("status", "missing") # "missing" | "found" | "all"
        query = MissingEntry.query
        if entry_type in ("person", "pet"):
            query = query.filter_by(entry_type=entry_type)
        if status != "all":
            query = query.filter_by(status=status)
        entries = query.order_by(MissingEntry.created_at.desc()).all()
        return jsonify([e.to_dict() for e in entries])

    @app.route("/api/missing/<int:entry_id>", methods=["GET"])
    def get_missing(entry_id):
        entry = MissingEntry.query.get_or_404(entry_id)
        return jsonify(entry.to_dict())

    @app.route("/api/missing", methods=["POST"])
    def create_missing():
        name = request.form.get("name", "").strip()
        entry_type = request.form.get("entry_type", "").strip()
        if not name or entry_type not in ("person", "pet"):
            return jsonify({"error": "name and entry_type ('person'|'pet') are required"}), 400

        image_path = None
        abs_path = None
        if "image" in request.files:
            f = request.files["image"]
            if f and allowed_file(f.filename):
                image_path, abs_path = save_upload(f)

        entry = MissingEntry(
            entry_type=entry_type,
            name=name,
            description=request.form.get("description"),
            last_seen_location=request.form.get("last_seen_location"),
            contact_info=request.form.get("contact_info"),
            image_path=image_path,
        )
        db.session.add(entry)
        db.session.commit()
        return jsonify(entry.to_dict()), 201

    @app.route("/api/missing/<int:entry_id>", methods=["PATCH"])
    def update_missing_status(entry_id):
        entry = MissingEntry.query.get_or_404(entry_id)
        data = request.get_json(silent=True) or {}
        if "status" in data and data["status"] in ("missing", "found"):
            entry.status = data["status"]
            db.session.commit()
        return jsonify(entry.to_dict())

    @app.route("/api/missing/<int:entry_id>", methods=["DELETE"])
    def delete_missing(entry_id):
        entry = MissingEntry.query.get_or_404(entry_id)
        db.session.delete(entry)
        db.session.commit()
        return jsonify({"deleted": entry_id})

    # ── Found entries ─────────────────────────────────────────────────────────

    @app.route("/api/found", methods=["GET"])
    def list_found():
        entry_type = request.args.get("type")
        query = FoundEntry.query
        if entry_type in ("person", "pet"):
            query = query.filter_by(entry_type=entry_type)
        entries = query.order_by(FoundEntry.created_at.desc()).all()
        return jsonify([e.to_dict() for e in entries])

    @app.route("/api/found", methods=["POST"])
    def create_found():
        entry_type = request.form.get("entry_type", "").strip()
        if entry_type not in ("person", "pet"):
            return jsonify({"error": "entry_type ('person'|'pet') is required"}), 400

        image_path = None
        abs_path = None
        if "image" in request.files:
            f = request.files["image"]
            if f and allowed_file(f.filename):
                image_path, abs_path = save_upload(f)

        entry = FoundEntry(
            entry_type=entry_type,
            location_found=request.form.get("location_found"),
            reporter_contact=request.form.get("reporter_contact"),
            notes=request.form.get("notes"),
            image_path=image_path,
        )
        db.session.add(entry)
        db.session.commit()

        # Run AI matching immediately
        matches = []
        if abs_path:
            try:
                matches = run_ai_match(entry_type, abs_path, entry.id)
            except Exception as e:
                logger.error(f"AI matching error: {e}")

        return jsonify({"found_entry": entry.to_dict(), "matches": matches}), 201

    # ── Matches ───────────────────────────────────────────────────────────────

    @app.route("/api/matches", methods=["GET"])
    def list_matches():
        match_type = request.args.get("type")
        min_confidence = float(request.args.get("min_confidence", 0.0))
        query = Match.query
        if match_type in ("person", "pet"):
            query = query.filter_by(match_type=match_type)
        matches = (
            query.filter(Match.confidence >= min_confidence)
            .order_by(Match.confidence.desc(), Match.created_at.desc())
            .all()
        )
        return jsonify([m.to_dict() for m in matches])

    @app.route("/api/matches/<int:match_id>", methods=["DELETE"])
    def delete_match(match_id):
        m = Match.query.get_or_404(match_id)
        db.session.delete(m)
        db.session.commit()
        return jsonify({"deleted": match_id})

    # ── Stats ─────────────────────────────────────────────────────────────────

    @app.route("/api/stats")
    def stats():
        return jsonify({
            "missing_persons": MissingEntry.query.filter_by(entry_type="person", status="missing").count(),
            "missing_pets":    MissingEntry.query.filter_by(entry_type="pet",    status="missing").count(),
            "found_persons":   MissingEntry.query.filter_by(entry_type="person", status="found").count(),
            "found_pets":      MissingEntry.query.filter_by(entry_type="pet",    status="found").count(),
            "total_matches":   Match.query.count(),
            "high_confidence_matches": Match.query.filter(Match.confidence >= 0.70).count(),
        })

    return app


# ─────────────────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
