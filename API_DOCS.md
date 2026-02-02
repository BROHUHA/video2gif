# Giffy - Backend API Documentation

**Version:** 2.0.0  
**Type:** Backend API (Frontend Removed)  
**Stack:** Node.js + Express + FFmpeg

---

## 🎯 Overview

Giffy is now a **pure backend API** for video to GIF conversion. All frontend UI has been removed. The API accepts video files and returns converted GIFs using FFmpeg.

---

## 📡 API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "giffy-api"
}
```

---

### 2. Convert Video to GIF
```http
POST /api/convert
Content-Type: multipart/form-data
```

**Parameters:**
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `video` | File | ✅ Yes | - | Video file (MP4, MOV, WEBM) |
| `trimStart` | Number | ❌ No | 0 | Start time in seconds |
| `trimEnd` | Number | ❌ No | - | End time in seconds |
| `width` | Number | ❌ No | 480 | Output width in pixels |
| `fps` | Number | ❌ No | 15 | Frames per second |

**Response:**  
Binary GIF file download

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/convert \
  -F "video=@myvideo.mp4" \
  -F "trimStart=5" \
  -F "trimEnd=15" \
  -F "width=640" \
  -F "fps=20" \
  --output output.gif
```

---

### 3. Get Video Info
```http
POST /api/info
Content-Type: multipart/form-data
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `video` | File | ✅ Yes | Video file |

**Response:**
```json
{
  "duration": 30.5,
  "width": 1920,
  "height": 1080,
  "fps": 30,
  "size": 15728640
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/info \
  -F "video=@myvideo.mp4"
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** ≥18.0.0
- **FFmpeg** installed on system

### Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### Install Dependencies
```bash
npm install
```

---

## 🏃 Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

**Server starts on:** `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```bash
PORT=3000  # Server port (default: 3000)
```

### File Upload Limits

- **Max file size:** 100 MB
- **Allowed types:** MP4, MOV, WEBM

---

## 📁 Project Structure

```
giffy/
├── server.js           # Express API server
├── package.json        # Dependencies
├── README.md           # Documentation
├── .gitignore          # Git ignore rules
├── uploads/            # Temporary uploads (auto-created)
└── output/             # Temporary GIF outputs (auto-created)
```

---

## 🔄 Conversion Process

1. **Upload:** Client sends video via multipart/form-data
2. **Save:** File saved to `uploads/` directory
3. **Process:** FFmpeg converts video to GIF
4. **Download:** Client receives GIF file
5. **Cleanup:** Temporary files auto-deleted

---

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:3000/health
```

### Test Conversion
```bash
# Create a test video (requires ffmpeg)
ffmpeg -f lavfi -i testsrc=duration=5:size=320x240:rate=30 test.mp4

# Convert to GIF
curl -X POST http://localhost:3000/api/convert \
  -F "video=@test.mp4" \
  -F "trimStart=0" \
  -F "trimEnd=3" \
  --output test.gif
```

---

## 🛠️ Technologies

- **Express.js** - Web framework
- **Multer** - File upload handling
- **fluent-ffmpeg** - FFmpeg wrapper
- **CORS** - Cross-origin support

---

## 🐛 Error Handling

### Common Errors

**400 Bad Request:**
```json
{ "error": "No video file provided" }
```

**500 Server Error:**
```json
{
  "error": "Conversion failed",
  "details": "FFmpeg error message"
}
```

---

## 📊 API Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success - GIF file downloaded |
| 400 | Bad Request - Missing or invalid parameters |
| 500 | Server Error - FFmpeg conversion failed |

---

## 🔒 Security Notes

- No authentication (add middleware if needed)
- File size limited to 100 MB
- Only video MIME types allowed
- Temporary files auto-deleted after 5 seconds
- CORS enabled (restrict in production)

---

## 📝 License

MIT

---

## 🚫 What Was Removed

This version has **ZERO frontend code**:
- ❌ No React/Next.js
- ❌ No UI components
- ❌ No CSS/styling
- ❌ No client-side JavaScript
- ❌ No TypeScript
- ❌ No Tailwind

**This is a pure backend API.**
