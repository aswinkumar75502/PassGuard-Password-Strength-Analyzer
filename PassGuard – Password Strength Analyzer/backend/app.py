"""
PassGuard – Flask Backend (Optional)
=====================================
Provides a REST API for password strength checking.
Stores only anonymised scores — NEVER the password itself.

Usage:
    pip install flask flask-cors
    python app.py

API Endpoints:
    POST /api/check   – analyze password strength
    GET  /api/logs    – retrieve anonymised strength logs
    GET  /api/health  – health check
"""

import re
import json
import time
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from the frontend

# ─── Simple in-memory log (demo only, resets on restart) ───
# In production, replace with a real database (SQLite, PostgreSQL, etc.)
strength_logs = []
LOG_FILE = "logs.json"

# ══════════════════════════════════════════
# PASSWORD ANALYSIS ENGINE
# ══════════════════════════════════════════

def analyze_password(password: str) -> dict:
    """
    Analyze a password and return a strength report.
    The password is never stored — only the score.
    """
    rules = {
        "length":    len(password) >= 8,
        "upper":     bool(re.search(r"[A-Z]", password)),
        "lower":     bool(re.search(r"[a-z]", password)),
        "number":    bool(re.search(r"[0-9]", password)),
        "special":   bool(re.search(r"[!@#$%^&*()\-_+=\[\]{};':\",./<>?\\|`~]", password)),
        "length16":  len(password) >= 16,
    }

    # Score: each core rule = 20 points (max 100)
    core_rules = ["length", "upper", "lower", "number", "special"]
    score = sum(20 for r in core_rules if rules[r])

    # Bonus for 16+ characters
    if rules["length16"]:
        score = min(100, score + 10)

    # Empty input
    if len(password) == 0:
        score = 0

    # Determine level
    if len(password) == 0:
        level = 0
        level_name = "empty"
    elif score <= 20:
        level = 1
        level_name = "weak"
    elif score <= 60:
        level = 2
        level_name = "medium"
    elif score <= 85:
        level = 3
        level_name = "strong"
    else:
        level = 4
        level_name = "excellent"

    # Build feedback suggestions
    suggestions = []
    if not rules["length"]:    suggestions.append("Increase password length to at least 8 characters")
    if not rules["upper"]:     suggestions.append("Add uppercase letters (A–Z)")
    if not rules["lower"]:     suggestions.append("Include lowercase letters (a–z)")
    if not rules["number"]:    suggestions.append("Add numbers (0–9)")
    if not rules["special"]:   suggestions.append("Use special characters like !@#$%^&*")
    if not rules["length16"]:  suggestions.append("Aim for 16+ characters for maximum security")

    return {
        "score":       score,
        "level":       level,
        "level_name":  level_name,
        "rules":       rules,
        "suggestions": suggestions,
        "char_count":  len(password),
    }


# ══════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "PassGuard API",
        "version": "1.0.0"
    })


@app.route("/api/check", methods=["POST"])
def check_password():
    """
    Analyze a password and return strength data.

    Request body (JSON):
        { "password": "your-password-here" }

    Response (JSON):
        {
            "score":       75,
            "level":       3,
            "level_name":  "strong",
            "rules":       { ... },
            "suggestions": [ ... ],
            "char_count":  14
        }
    """
    data = request.get_json(silent=True)

    if not data or "password" not in data:
        return jsonify({"error": "Missing 'password' field in request body"}), 400

    password = data["password"]

    # Sanity limit – never process absurdly long inputs
    if len(password) > 512:
        return jsonify({"error": "Password exceeds maximum allowed length (512 chars)"}), 400

    result = analyze_password(password)

    # ── Log only the SCORE and TIMESTAMP (never the password) ──
    log_entry = {
        "timestamp":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "score":      result["score"],
        "level_name": result["level_name"],
    }
    strength_logs.append(log_entry)

    # Persist to file (optional)
    try:
        with open(LOG_FILE, "w") as f:
            json.dump(strength_logs, f, indent=2)
    except Exception:
        pass  # Logging failure should not affect the API response

    return jsonify(result)


@app.route("/api/logs", methods=["GET"])
def get_logs():
    """
    Retrieve anonymised strength logs (demo endpoint).
    Returns only scores and timestamps — never passwords.
    """
    # Load from file if in-memory list is empty (e.g., after restart)
    logs = strength_logs
    if not logs and os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE) as f:
                logs = json.load(f)
        except Exception:
            logs = []

    # Summary stats
    total = len(logs)
    if total > 0:
        avg_score = round(sum(e["score"] for e in logs) / total, 1)
        distribution = {
            "weak":      sum(1 for e in logs if e["level_name"] == "weak"),
            "medium":    sum(1 for e in logs if e["level_name"] == "medium"),
            "strong":    sum(1 for e in logs if e["level_name"] == "strong"),
            "excellent": sum(1 for e in logs if e["level_name"] == "excellent"),
        }
    else:
        avg_score = 0
        distribution = {}

    return jsonify({
        "total_checks": total,
        "average_score": avg_score,
        "distribution": distribution,
        "recent": logs[-20:]  # Last 20 entries
    })


@app.route("/api/logs", methods=["DELETE"])
def clear_logs():
    """Clear all logs (demo utility endpoint)."""
    global strength_logs
    strength_logs = []
    if os.path.exists(LOG_FILE):
        os.remove(LOG_FILE)
    return jsonify({"message": "Logs cleared successfully."})


# ══════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 50)
    print("  PassGuard API Server")
    print("  Running at: http://localhost:5000")
    print("  Endpoints:")
    print("    GET  /api/health")
    print("    POST /api/check")
    print("    GET  /api/logs")
    print("=" * 50)
    app.run(debug=True, host="0.0.0.0", port=5000)
