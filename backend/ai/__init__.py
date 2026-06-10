from .face_match import compare_faces, match_against_registry as face_match_registry
from .pet_match import compare_pets, match_against_registry as pet_match_registry

__all__ = [
    "compare_faces",
    "compare_pets",
    "face_match_registry",
    "pet_match_registry",
]
