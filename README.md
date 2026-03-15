# 👗 Vestra – Digital Wardrobe

> A full-stack **digital wardrobe management** application built with **Node.js, Express, MongoDB, and vanilla JavaScript**. Capture clothing photos with your device camera, organise your wardrobe, and get smart outfit suggestions.

---

## 🖼️ App Preview

```
┌───────────────────────────────────────────────────────────┐
│  VESTRA  │  My Wardrobe  │  Add Item  │  Outfits  │ Stats │
├──────────┼───────────────────────────────────────────────┤
│          │  🔍 Search...  [All][Shirts][Pants][Shoes]    │
│ 👤 User  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│          │  │  👕  │ │  👖  │ │  🧥  │ │  👟  │        │
│ 📦 Wardrobe│ │ Blue │ │Black │ │Green │ │White │        │
│ ➕ Add   │  │Shirt │ │Jeans │ │Jacket│ │Nikes │        │
│ 🎨 Outfits│ └──────┘ └──────┘ └──────┘ └──────┘        │
│ 📊 Stats │                                               │
│          │  ✨ 4 items in your wardrobe                  │
│ 🚪 Logout│                                               │
└──────────┴───────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Signup/login with JWT tokens, bcrypt password hashing |
| 📷 **Camera Integration** | Browser camera via `MediaDevices.getUserMedia`, front/back switch |
| 👗 **Digital Wardrobe** | Add, view, delete clothing items with metadata |
| 🖼️ **Image Optimisation** | Auto-resize & convert to WebP using Sharp |
| 🔍 **Smart Filtering** | Filter by category, colour, search text |
| 🎨 **Outfit Suggestions** | Colour-harmony-based outfit combinations |
| 📊 **Statistics** | Visual KPI cards and bar charts of your wardrobe |
| 📱 **Responsive Design** | Mobile-first, works on all screen sizes |
| 🌙 **Modern UI** | Smooth animations, toast notifications, loading states |

---

## 📁 Project Structure

```
vestra/
├── frontend/                    # Static frontend (HTML + CSS + JS)
│   ├── index.html               # Single-page app shell
│   ├── css/
│   │   └── style.css            # Complete responsive stylesheet
│   └── js/
│       ├── api.js               # API service layer (fetch wrappers)
│       ├── auth.js              # Login / signup / logout logic
│       ├── camera.js            # Camera & file upload handling
│       ├── wardrobe.js          # Wardrobe CRUD + gallery rendering
│       ├── outfits.js           # Outfit suggestion algorithm
│       ├── stats.js             # Statistics & chart rendering
│       └── app.js               # App controller & section routing
│
├── backend/                     # Node.js + Express API server
│   ├── server.js                # Main Express server entry point
│   ├── package.json             # NPM dependencies
│   ├── .env.example             # Environment variable template
│   ├── .gitignore
│   ├── models/
│   │   ├── User.js              # Mongoose User schema
│   │   └── ClothingItem.js      # Mongoose ClothingItem schema
│   ├── routes/
│   │   ├── auth.routes.js       # POST /signup, POST /login, GET /me
│   │   └── wardrobe.routes.js   # CRUD wardrobe + image upload
│   └── middleware/
│       └── auth.middleware.js   # JWT verify middleware
│
└── uploads/                     # User-uploaded clothing images
    └── {userId}/                # Per-user subdirectory
        └── opt_*.webp           # Optimised WebP images
```

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MongoDB** v6+ → [mongodb.com](https://www.mongodb.com/try/download/community) *(local)* **or** [MongoDB Atlas](https://www.mongodb.com/atlas) *(cloud)*
- **npm** (comes with Node.js)

---

### Step 1 – Clone / Download

```bash
# If using git:
git clone https://github.com/your-username/vestra.git
cd vestra

# Or simply extract the downloaded zip and enter the folder
```

---

### Step 2 – Backend Setup

```bash
# 1. Navigate to backend folder
cd backend

# 2. Install all Node.js dependencies
npm install

# 3. Create your environment file
cp .env.example .env

# 4. Edit .env with your values (use any text editor)
#    At minimum, change JWT_SECRET to a long random string
nano .env     # or: code .env / notepad .env
```

**.env configuration:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/vestra_db
JWT_SECRET=replace_this_with_a_long_random_secret_string_64chars_minimum
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5500
```

---

### Step 3 – Start MongoDB

**Option A — Local MongoDB:**
```bash
# macOS (Homebrew)
brew services start mongodb/brew/mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
net start MongoDB

# Or run directly:
mongod --dbpath /data/db
```

**Option B — MongoDB Atlas (cloud):**
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **Connect → Connect your application**
3. Copy the connection string into your `.env` file:
```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vestra_db
```

---

### Step 4 – Start the Backend

```bash
# From the /backend directory:

# Development mode (auto-restarts on changes):
npm run dev

# Production mode:
npm start
```

You should see:
```
✅ MongoDB connected: 127.0.0.1
🚀 Vestra API running on http://localhost:5000
📁 Uploads served at  http://localhost:5000/uploads
💚 Health check at    http://localhost:5000/health
```

---

### Step 5 – Open the Frontend

Open `frontend/index.html` in your browser.

**Recommended: Use Live Server (VS Code)**
```
1. Install the "Live Server" extension in VS Code
2. Right-click frontend/index.html → "Open with Live Server"
3. Frontend opens at http://127.0.0.1:5500
```

**Or use Python's built-in server:**
```bash
cd frontend
python3 -m http.server 5500
# Open http://localhost:5500
```

> **⚠️ Important:** Open `frontend/js/api.js` and check that `API_BASE` points to your backend URL:
> ```javascript
> const API_BASE = window.API_BASE_URL || 'http://localhost:5000/api';
> ```

---

### Step 6 – Use the App!

1. **Sign up** with your name, email, and password
2. Navigate to **Add Clothing** from the sidebar
3. Click **Open Camera** to capture a photo — or **Upload Photo** to select a file
4. Fill in the clothing details (name, category, colour, season, occasion)
5. Click **Add to Wardrobe** — your item appears in the gallery!
6. Go to **Outfit Ideas** and click **Generate Outfits**
7. Check **Statistics** for an overview of your wardrobe composition

---

## 🌐 API Reference

All protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Auth Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | `{ name, email, password }` | Register new user |
| `POST` | `/api/auth/login`  | `{ email, password }` | Login, returns JWT |
| `GET`  | `/api/auth/me`     | — | Get current user profile |

**Signup Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "666abc123def456...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "wardrobeCount": 0,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### Wardrobe Endpoints

| Method   | Endpoint                | Description |
|----------|-------------------------|-------------|
| `GET`    | `/api/wardrobe`         | Get all user's clothing items |
| `GET`    | `/api/wardrobe/:id`     | Get single item |
| `POST`   | `/api/wardrobe`         | Add new item (multipart/form-data) |
| `PATCH`  | `/api/wardrobe/:id`     | Update item metadata |
| `DELETE` | `/api/wardrobe/:id`     | Delete item |

**GET /api/wardrobe query params:**
```
?category=shirt
?color=blue
?season=summer
?occasion=casual
?search=denim
?page=1&limit=20
```

**POST /api/wardrobe (multipart form fields):**
```
name        (required) – e.g. "Blue Linen Shirt"
category    (required) – shirt | pants | jacket | dress | shoes | accessory | sweater | other
color       (required) – black | white | gray | red | blue | green | yellow | pink | purple | brown | orange | beige | multicolor
season      (optional) – spring | summer | autumn | winter | all
occasion    (optional) – casual | formal | sport | party | work | beach
notes       (optional) – brand, description, notes
image       (optional) – image file (JPEG/PNG/WebP, max 10MB)
```

**Example Response:**
```json
{
  "_id": "64ab1234cd5678ef90123456",
  "user": "666abc123def456...",
  "name": "Blue Linen Shirt",
  "category": "shirt",
  "color": "blue",
  "season": "summer",
  "occasion": "casual",
  "notes": "H&M, bought in Barcelona",
  "imageUrl": "uploads/666abc123def456/opt_item_1720000000_abc123.webp",
  "createdAt": "2025-06-15T14:22:11.000Z"
}
```

---

## 📷 Camera API Details

The frontend uses the **Web MediaDevices API**:

```javascript
// Request camera access
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: 'environment',  // back camera (default)
    width:  { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false
});

// Attach to <video> element
videoElement.srcObject = stream;

// Capture frame to canvas → Blob → File
canvas.toBlob((blob) => {
  const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
  // ...upload via FormData
}, 'image/jpeg', 0.92);
```

> **Note:** Camera access requires **HTTPS** in production (or `localhost` for development).

---

## 🗃️ Database Schema

### User
```javascript
{
  name:           String (required, 2-60 chars),
  email:          String (required, unique, lowercase),
  password:       String (hashed with bcrypt, 12 rounds),
  wardrobeCount:  Number (default: 0),
  createdAt:      Date,
  updatedAt:      Date
}
```

### ClothingItem
```javascript
{
  user:     ObjectId (ref: User, required),
  name:     String   (required, 1-100 chars),
  category: String   (enum: shirt|pants|jacket|dress|shoes|accessory|sweater|other),
  color:    String   (enum: black|white|gray|red|blue|green|yellow|pink|purple|brown|orange|beige|multicolor),
  season:   String   (enum: spring|summer|autumn|winter|all, default: all),
  occasion: String   (enum: casual|formal|sport|party|work|beach, default: casual),
  notes:    String   (max 500 chars),
  imageUrl: String   (relative path: uploads/{userId}/opt_*.webp),
  deleted:  Boolean  (soft delete flag, default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Outfit Suggestion Algorithm

The outfit generator uses a **colour harmony matrix** and **category matching**:

1. **Categorises** items into: tops, bottoms, layers, shoes, accessories
2. **Generates combinations**: top + bottom + optional layer + optional shoes
3. **Scores each outfit** (0–100%) based on:
   - Colour harmony pairs (e.g. navy + white = ✅)
   - Completeness bonus (has top + bottom = +20, has shoes = +10)
4. **Sorts** by score and displays top 6 outfits
5. **Filters** by occasion and season if selected

---

## 🔒 Security Features

- 🔑 **JWT Authentication** with 7-day expiry
- 🔐 **bcrypt password hashing** (12 salt rounds)
- 🛡️ **Helmet.js** HTTP security headers
- 🚦 **Rate limiting**: 200 req/15min general, 20 req/15min for auth
- ✅ **Mongoose validators** on all inputs
- 🔍 **User scoping**: all wardrobe queries filtered by `req.user._id`
- 🗑️ **Soft delete**: items flagged `deleted=true`, not physically removed from DB

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | App structure & semantic markup |
| CSS3 | Custom responsive design (mobile-first) |
| Vanilla JavaScript | App logic, DOM manipulation |
| Google Fonts (Inter + Playfair) | Typography |
| Font Awesome 6 | Icons |
| MediaDevices API | Camera access |

### Backend
| Package | Version | Purpose |
|---|---|---|
| express | ^4.19 | Web framework |
| mongoose | ^8.4 | MongoDB ODM |
| bcryptjs | ^2.4 | Password hashing |
| jsonwebtoken | ^9.0 | JWT auth |
| multer | ^1.4.5 | File upload |
| sharp | ^0.33 | Image processing |
| helmet | ^7.1 | Security headers |
| cors | ^2.8 | Cross-origin requests |
| express-rate-limit | ^7.3 | Rate limiting |
| morgan | ^1.10 | HTTP request logging |
| dotenv | ^16.4 | Environment variables |
| nodemon | ^3.1 | Dev auto-restart |

---

## 🌍 Deploying to Production

### Backend (Railway / Render / Fly.io)

1. Push backend code to GitHub
2. Connect to Railway/Render
3. Set environment variables:
   - `MONGO_URI` → MongoDB Atlas URI
   - `JWT_SECRET` → Long random string
   - `NODE_ENV=production`
   - `FRONTEND_URL` → Your frontend domain
4. Deploy — get your backend URL like `https://vestra-api.railway.app`

### Frontend (Netlify / Vercel / GitHub Pages)

1. In `frontend/js/api.js`, update the API base URL:
   ```javascript
   const API_BASE = 'https://vestra-api.railway.app/api';
   ```
2. Push frontend to GitHub / drag-drop to Netlify
3. Done!

### Full-Stack Single Server

Set `SERVE_FRONTEND=true` in `.env` and the Express server will serve the frontend at `/` and the API at `/api`.

---

## 🧪 Testing the API (curl examples)

```bash
# Health check
curl http://localhost:5000/health

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"secret123"}'

# Get wardrobe (replace TOKEN with the JWT from login)
curl http://localhost:5000/api/wardrobe \
  -H "Authorization: Bearer TOKEN"

# Add clothing item (without image)
curl -X POST http://localhost:5000/api/wardrobe \
  -H "Authorization: Bearer TOKEN" \
  -F "name=Blue Jeans" \
  -F "category=pants" \
  -F "color=blue" \
  -F "season=all" \
  -F "occasion=casual"

# Add clothing item (with image)
curl -X POST http://localhost:5000/api/wardrobe \
  -H "Authorization: Bearer TOKEN" \
  -F "name=White Shirt" \
  -F "category=shirt" \
  -F "color=white" \
  -F "image=@/path/to/shirt.jpg"

# Delete item
curl -X DELETE http://localhost:5000/api/wardrobe/ITEM_ID \
  -H "Authorization: Bearer TOKEN"
```

---

## ❗ Troubleshooting

| Problem | Solution |
|---|---|
| `Cannot connect to server` | Ensure backend is running on port 5000 |
| `MongoDB connection failed` | Check if `mongod` is running; verify `MONGO_URI` in `.env` |
| `Camera access denied` | Allow camera permissions in browser; use HTTPS in production |
| `CORS error` | Add your frontend URL to `allowedOrigins` in `server.js` |
| `jwt malformed` | Clear `localStorage` and sign in again |
| `sharp` install errors | Run `npm install --include=optional sharp` |
| Images not showing | Check `uploads/` folder exists; verify `UPLOADS_DIR` path |

---

## 📋 Checklist for First Run

- [ ] Node.js v18+ installed
- [ ] MongoDB running (local or Atlas)
- [ ] `npm install` done in `/backend`
- [ ] `.env` file created from `.env.example`
- [ ] `JWT_SECRET` changed to a secure value
- [ ] `MONGO_URI` points to your database
- [ ] Backend started (`npm run dev`)
- [ ] Frontend opened in browser (Live Server recommended)
- [ ] Camera permission granted in browser

---

## 🗺️ Planned Features

- [ ] OAuth login (Google, Apple)
- [ ] Edit clothing item details
- [ ] Outfit history / favourites
- [ ] Share wardrobe with friends
- [ ] Cloud image storage (AWS S3 / Cloudinary)
- [ ] AI-powered outfit suggestions (GPT integration)
- [ ] Weather-based outfit recommendations
- [ ] Export wardrobe to PDF

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<p align="center">Made with ❤️ by the Vestra Team</p>
