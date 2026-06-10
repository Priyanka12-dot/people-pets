from datetime import datetime
from extensions import db


class MissingEntry(db.Model):
    """Represents a missing person or pet report."""
    __tablename__ = "missing_entries"

    id = db.Column(db.Integer, primary_key=True)
    entry_type = db.Column(db.String(10), nullable=False)   # "person" | "pet"
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    last_seen_location = db.Column(db.String(255), nullable=True)
    contact_info = db.Column(db.String(255), nullable=True)
    image_path = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default="missing")    # "missing" | "found"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    matches_as_missing = db.relationship(
        "Match", foreign_keys="Match.missing_id",
        backref="missing_entry", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "entry_type": self.entry_type,
            "name": self.name,
            "description": self.description,
            "last_seen_location": self.last_seen_location,
            "contact_info": self.contact_info,
            "image_path": self.image_path,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class FoundEntry(db.Model):
    """Represents an uploaded found person/pet photo."""
    __tablename__ = "found_entries"

    id = db.Column(db.Integer, primary_key=True)
    entry_type = db.Column(db.String(10), nullable=False)   # "person" | "pet"
    location_found = db.Column(db.String(255), nullable=True)
    reporter_contact = db.Column(db.String(255), nullable=True)
    image_path = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    matches_as_found = db.relationship(
        "Match", foreign_keys="Match.found_id",
        backref="found_entry", lazy=True, cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "entry_type": self.entry_type,
            "location_found": self.location_found,
            "reporter_contact": self.reporter_contact,
            "image_path": self.image_path,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
        }


class Match(db.Model):
    """AI-generated match between a found entry and a missing entry."""
    __tablename__ = "matches"

    id = db.Column(db.Integer, primary_key=True)
    missing_id = db.Column(db.Integer, db.ForeignKey("missing_entries.id"), nullable=False)
    found_id = db.Column(db.Integer, db.ForeignKey("found_entries.id"), nullable=False)
    confidence = db.Column(db.Float, nullable=False)        # 0.0 – 1.0
    match_type = db.Column(db.String(10), nullable=False)   # "person" | "pet"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "missing_id": self.missing_id,
            "found_id": self.found_id,
            "confidence": round(self.confidence * 100, 1),
            "match_type": self.match_type,
            "created_at": self.created_at.isoformat(),
            "missing_entry": self.missing_entry.to_dict() if self.missing_entry else None,
            "found_entry": self.found_entry.to_dict() if self.found_entry else None,
        }
