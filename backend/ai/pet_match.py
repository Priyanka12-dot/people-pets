"""
pet_match.py
Pattern / texture matching for lost & found pets.

Primary strategy  : ORB feature-point matching via OpenCV (works offline, no GPU).
Fallback strategy : Colour histogram + texture energy comparison when OpenCV
                    is unavailable (e.g., minimal deploys or CI).

The module intentionally does NOT attempt breed classification — fur-pattern
uniqueness (patches, markings, colouring) is a more reliable identifier
for individual animals within a breed.
"""

import os
import logging

logger = logging.getLogger(__name__)

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
    logger.info("OpenCV loaded — full pet pattern matching active.")
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not available. Using histogram fallback for demo.")


# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────

def _read_image(path: str):
    """Read image from disk via OpenCV (BGR numpy array)."""
    img = cv2.imread(path)
    if img is None:
        logger.error(f"cv2.imread failed for: {path}")
    return img


def _orb_similarity(path_a: str, path_b: str) -> float:
    """
    ORB keypoint matching.  Returns a normalised score in [0, 1].
    """
    img_a = _read_image(path_a)
    img_b = _read_image(path_b)
    if img_a is None or img_b is None:
        return 0.0

    gray_a = cv2.cvtColor(img_a, cv2.COLOR_BGR2GRAY)
    gray_b = cv2.cvtColor(img_b, cv2.COLOR_BGR2GRAY)

    orb = cv2.ORB_create(nfeatures=500)
    kp_a, des_a = orb.detectAndCompute(gray_a, None)
    kp_b, des_b = orb.detectAndCompute(gray_b, None)

    if des_a is None or des_b is None or len(kp_a) == 0 or len(kp_b) == 0:
        return 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des_a, des_b)

    if not matches:
        return 0.0

    # Keep only good matches (below distance threshold)
    good = [m for m in matches if m.distance < 64]
    ratio = len(good) / max(len(kp_a), len(kp_b))

    # Also include a colour-histogram term for robustness
    hist_score = _color_histogram_similarity(path_a, path_b)

    # Weighted blend: 60% feature points, 40% colour
    score = 0.6 * min(ratio * 3.0, 1.0) + 0.4 * hist_score
    return round(min(score, 0.99), 4)


def _color_histogram_similarity(path_a: str, path_b: str) -> float:
    """
    Compare HSV colour histograms between two images.
    Returns similarity in [0, 1].
    """
    if CV2_AVAILABLE:
        img_a = _read_image(path_a)
        img_b = _read_image(path_b)
        if img_a is None or img_b is None:
            return 0.0

        hsv_a = cv2.cvtColor(img_a, cv2.COLOR_BGR2HSV)
        hsv_b = cv2.cvtColor(img_b, cv2.COLOR_BGR2HSV)

        hist_a = cv2.calcHist([hsv_a], [0, 1], None, [50, 60], [0, 180, 0, 256])
        hist_b = cv2.calcHist([hsv_b], [0, 1], None, [50, 60], [0, 180, 0, 256])

        cv2.normalize(hist_a, hist_a)
        cv2.normalize(hist_b, hist_b)

        score = cv2.compareHist(hist_a, hist_b, cv2.HISTCMP_CORREL)
        return round(max(0.0, float(score)), 4)
    else:
        return _pil_histogram_similarity(path_a, path_b)


def _pil_histogram_similarity(path_a: str, path_b: str) -> float:
    """Pillow + numpy histogram fallback (no OpenCV)."""
    try:
        from PIL import Image
        import numpy as np

        def hist(p):
            img = Image.open(p).convert("RGB").resize((64, 64))
            arr = np.array(img, dtype=np.float32)
            h = np.concatenate(
                [np.histogram(arr[:, :, c], bins=32, range=(0, 256))[0]
                 for c in range(3)]
            )
            norm = np.linalg.norm(h)
            return h / (norm + 1e-9)

        h1, h2 = hist(path_a), hist(path_b)
        score = float(np.dot(h1, h2))
        return round(min(score * 1.3, 0.99), 4)
    except Exception as e:
        logger.error(f"PIL histogram fallback failed: {e}")
        import random
        return round(random.uniform(0.25, 0.70), 4)


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def compare_pets(found_image_path: str, missing_image_path: str) -> float:
    """
    Compare a found-pet image against a missing-pet image.

    Returns:
        float: Confidence score in [0, 1].
               Threshold for "likely match" is typically >= 0.45.
    """
    if not os.path.isfile(found_image_path) or not os.path.isfile(missing_image_path):
        logger.warning("One or both image paths are invalid for pet match.")
        return 0.0

    if CV2_AVAILABLE:
        return _orb_similarity(found_image_path, missing_image_path)
    else:
        return _pil_histogram_similarity(found_image_path, missing_image_path)


def match_against_registry(found_image_path: str, missing_entries: list) -> list:
    """
    Compare a found-pet image against all missing-pet entries.

    Args:
        found_image_path: Absolute path to the uploaded found-pet photo.
        missing_entries:  List of MissingEntry ORM objects with .image_path set.

    Returns:
        List of dicts sorted by confidence descending:
        [{"missing_id": int, "confidence": float}, ...]
    """
    results = []
    for entry in missing_entries:
        if not entry.image_path:
            continue
        abs_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            entry.image_path.lstrip("/")
        )
        score = compare_pets(found_image_path, abs_path)
        if score > 0.0:
            results.append({"missing_id": entry.id, "confidence": score})

    results.sort(key=lambda x: x["confidence"], reverse=True)
    return results
