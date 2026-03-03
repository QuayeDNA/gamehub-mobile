# 🎮 GameHub Mobile

A cyberpunk-themed mobile-first web games portal — like Friv.com or Y8.com but built for mobile browsers.
Powered by the **FreeToGame API** with 400+ free-to-play games, real thumbnails, and genre filtering.

---

## 🚀 Features

- **Real game data** from [FreeToGame API](https://www.freetogame.com/api-doc) — no API key needed
- **400+ free-to-play games** with thumbnails, descriptions, and metadata
- **Category browsing** — Shooters, MOBA, RPG, Strategy, Racing, and more
- **Search & filter** by game name or genre
- **Game detail pages** with developer info and play button
- **Mobile-first** design with bottom navigation, touch gestures
- **Cyberpunk neon aesthetic** with Orbitron/Rajdhani fonts
- **Offline fallback** — mock data shown when API is unavailable
- **CORS proxy fallback** via allorigins.win

---

## 🏗️ Scaffolding Instructions

### Prerequisites

Make sure you have installed:
- **Node.js** v18+ → https://nodejs.org
- **npm** v9+ (comes with Node.js)

Verify with:
```bash
node --version
npm --version
```

---

### 1. Clone or Extract the Project

**If from ZIP:**
```bash
unzip gamehub-mobile.zip
cd gamehub-mobile
```

**If cloning from GitHub:**
```bash
git clone https://github.com/YOUR_USERNAME/gamehub-mobile.git
cd gamehub-mobile
```

---

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `react` & `react-dom` (v18)
- `react-scripts` (Create React App build tooling)
- `react-router-dom` (v6 client-side routing)

---

### 3. Start Development Server

```bash
npm start
```

Opens at **http://localhost:3000**

> 💡 The app is designed for mobile viewports. Use Chrome DevTools (F12 → Toggle Device Toolbar) and select a mobile device like iPhone 14 for the best experience.

---

### 4. Build for Production

```bash
npm run build
```

Outputs a `build/` folder with static files ready to deploy.

---

## 🌐 Deployment Options

### Vercel (Recommended — Free)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Then drag & drop the `build/` folder to https://app.netlify.com
```

### GitHub Pages
```bash
npm install --save-dev gh-pages
```
Add to `package.json`:
```json
"homepage": "https://YOUR_USERNAME.github.io/gamehub-mobile",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
Then run:
```bash
npm run deploy
```

---

## 📡 API Details

**Source:** [FreeToGame](https://www.freetogame.com/api-doc)
- Base URL: `https://www.freetogame.com/api`
- No API key required
- Free for personal and commercial use (attribution required)
- Rate limit: < 10 requests/second

**Endpoints used:**
| Endpoint | Description |
|----------|-------------|
| `/games?platform=all&sort-by=popularity` | All games sorted by popularity |
| `/games?category=shooter` | Filter by genre |
| `/game?id=1` | Single game details |

**CORS:** The app tries a direct request first, then falls back to `allorigins.win` proxy if CORS blocks. For production, consider setting up your own backend proxy.

---

## 📂 Project Structure

```
gamehub-mobile/
├── public/
│   └── index.html          # HTML template with Google Fonts
├── src/
│   ├── hooks/
│   │   └── useGames.js     # API fetching logic + mock fallback
│   ├── components/
│   │   └── GameComponents.jsx  # Reusable UI components
│   ├── pages/
│   │   ├── Home.jsx        # Main feed with hero, trending, new games
│   │   ├── GameDetail.jsx  # Individual game page
│   │   ├── Category.jsx    # Browse by genre
│   │   └── Search.jsx      # Search & filter
│   ├── App.jsx             # Router setup
│   ├── App.css             # All styles (cyberpunk theme)
│   └── index.js            # React entry point
├── package.json
└── README.md
```

---

## 🎨 Design System

| Token | Value | Use |
|-------|-------|-----|
| `--neon-cyan` | `#00f5ff` | Primary accent, CTA buttons |
| `--neon-purple` | `#bf00ff` | Secondary accent |
| `--neon-green` | `#39ff14` | "New" badges, live status |
| `--neon-orange` | `#ff6a00` | "Hot" badges, warnings |
| `--bg-dark` | `#0a0a0f` | Main background |
| `--bg-card` | `#12121a` | Card backgrounds |

**Fonts:**
- **Orbitron** — Headings, logo, labels (Google Fonts)
- **Rajdhani** — Body text, navigation, descriptions

---

## 🔧 Customization

### Add more categories
Edit `CATEGORIES` array in `src/pages/Home.jsx`:
```js
{ label: 'Battle Royale', value: 'battle-royale', emoji: '🥇' },
```

### Change API platform filter
In `src/hooks/useGames.js`, change `platform: 'all'` to `'browser'` or `'pc'`.

### Add your own backend proxy
Replace the `fetchWithProxy` function in `src/hooks/useGames.js`:
```js
async function fetchWithProxy(url) {
  const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
  return res.json();
}
```

---

## 📋 Attribution

Games data provided by [FreeToGame.com](https://www.freetogame.com) — please keep the attribution if you deploy publicly.

---

## 📄 License

MIT — free to use, modify, and distribute.
