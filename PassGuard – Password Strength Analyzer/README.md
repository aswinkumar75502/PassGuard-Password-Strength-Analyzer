# 🔐 PassGuard – Password Strength Checker

A modern, professional password strength analyzer built as a portfolio project.
Features real-time analysis, a score ring, animated feedback, a password generator,
dark/light mode, and an optional Python Flask backend.

---

## 📁 Folder Structure

```
password-checker/
├── frontend/
│   ├── index.html          ← Main page (password checker)
│   ├── css/
│   │   └── style.css       ← All styles (glassmorphism, animations, themes)
│   ├── js/
│   │   └── checker.js      ← All logic (analysis, generator, clipboard)
│   └── pages/
│       ├── about.html      ← About page (what is password security)
│       └── tips.html       ← Tips page (how to create strong passwords)
│
├── backend/
│   ├── app.py              ← Python Flask REST API
│   └── requirements.txt    ← Python dependencies
│
└── README.md               ← You are here
```

---

## 🚀 Quick Start (Frontend Only)

The frontend works entirely without the backend.

**Option A – Open directly in browser:**
```
Open frontend/index.html in any modern browser. Done!
```

**Option B – VS Code Live Server (recommended):**
1. Install the **Live Server** extension in VS Code
2. Open the `frontend/` folder in VS Code
3. Right-click `index.html` → **Open with Live Server**
4. Browser opens at `http://127.0.0.1:5500`

---

## 🐍 Backend Setup (Optional)

The Flask API adds server-side analysis and anonymised logging.

### Prerequisites
- Python 3.8 or higher
- pip

### Steps

```bash
# 1. Navigate to the backend folder
cd password-checker/backend

# 2. (Recommended) Create a virtual environment
python -m venv venv

# Activate it:
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
python app.py
```

The API will be available at `http://localhost:5000`

### API Endpoints

| Method | Endpoint      | Description                         |
|--------|---------------|-------------------------------------|
| GET    | /api/health   | Server health check                 |
| POST   | /api/check    | Analyze password strength           |
| GET    | /api/logs     | View anonymised score logs          |
| DELETE | /api/logs     | Clear all logs                      |

### Example API Call

```bash
curl -X POST http://localhost:5000/api/check \
  -H "Content-Type: application/json" \
  -d '{"password": "MyP@ssw0rd!2024"}'
```

**Response:**
```json
{
  "score": 90,
  "level": 4,
  "level_name": "excellent",
  "rules": {
    "length": true,
    "upper": true,
    "lower": true,
    "number": true,
    "special": true,
    "length16": false
  },
  "suggestions": ["Aim for 16+ characters for maximum security"],
  "char_count": 15
}
```

---

## ✨ Features

### Checker Page
- 🔢 **Score Ring** – animated SVG ring showing 0–100% score
- 📊 **Strength Meter** – color-coded bar (red → yellow → green → teal)
- 🎯 **4 Strength Levels** – Weak ❌ / Medium ⚠️ / Strong ✅ / Excellent 🔥
- ✅ **6-Rule Checklist** – live pass/fail for each criterion
- 💡 **Smart Feedback** – personalized suggestions or praise
- ⚡ **Password Generator** – cryptographically secure (uses `window.crypto`)
- 📋 **Copy to Clipboard** – one click copy
- 👁️ **Show/Hide Toggle** – reveal password safely
- 🌙 **Dark/Light Mode** – persisted in `localStorage`
- ⌨️ **Keyboard Shortcut** – `Ctrl/Cmd+G` to generate

### About Page
- What is password security and why it matters
- How PassGuard analyzes passwords
- Tech stack details
- Privacy commitment

### Tips Page
- 8 evidence-based security tip cards
- NIST SP 800-63B aligned guidance
- Password manager recommendations
- When to change passwords

---

## 🎨 Design System

- **Fonts:** Syne (display), DM Mono, DM Sans
- **Theme:** Dark glass / Glassmorphism with light mode toggle
- **Effects:** Mesh orb background, backdrop blur, gradient accents
- **Animation:** CSS keyframes, smooth SVG ring transitions
- **Colors:**
  - Weak: `#fc8181` (rose)
  - Medium: `#f6ad55` (amber)
  - Strong: `#68d391` (green)
  - Excellent: `#38b2ac` (teal)

---

## 🔒 Security & Privacy

- **Zero data transmission** – all analysis runs in the browser
- **Cryptographically secure generator** – uses `window.crypto.getRandomValues()`
- **No tracking** – no analytics, no telemetry, no third-party scripts
- **Backend never stores passwords** – only anonymised score + timestamp

---

## 🛠️ Built With

- HTML5, CSS3, Vanilla JavaScript (ES2020+)
- Python 3 + Flask + Flask-CORS
- Google Fonts (Syne, DM Mono, DM Sans)

---

## 📄 License

MIT — free to use, modify, and include in your portfolio.

---

*Built as a portfolio/placement demonstration project.*
