# Lumina Canvas

<div align="center">
  <h1 align="center">Lumina Canvas</h1>
  <p align="center">
    A modern, real-time collaborative whiteboard application built with React, Fabric.js, and Google Gemini AI.
  </p>
</div>

##  Features

- **Real-time Collaboration**: Draw and interact with others in real-time.
- **Advanced Tools**:
  - **Pen**: Freehand drawing with adjustable stroke width and color.
  - **Shapes**: Rectangle, Circle, and Line tools.
  - **Arrow**: Custom arrow tool for diagrams.
  - **Text**: Add and edit text on the canvas.
  - **Eraser**: Erase objects or paint over them.
  - **Pan & Zoom**: Navigate infinite canvas with Move tool or Ctrl+Scroll.
- **AI Integration**: Generate SVG illustrations from text prompts using Google Gemini API.
- **Export**: Save your creations as PNG, JPG, or SVG.
- **Modern UI**: Glassmorphism design, responsive toolbar, and dark mode aesthetic.
- **Pixel Perfect**: Optimized for Mobile, Tablet, and Desktop.

##  Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Canvas Engine**: Fabric.js (v5)
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: Google Gemini API (`@google/genai`)
- **Utilities**: `uuid`, `unique-names-generator`

##  Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lumina-canvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Usage

| Tool | Shortcut | Description |
|------|----------|-------------|
| **Select** | `V` | Select and move objects |
| **Pan** | `Space` / Hand Icon | Drag to move canvas view |
| **Pen** | `P` | Freehand drawing |
| **Eraser** | `E` | Erase content |
| **Rectangle** | `R` | Draw rectangles |
| **Circle** | `C` | Draw circles |
| **Line** | `L` | Draw straight lines |
| **Arrow** | `A` | Draw arrows |
| **Text** | `T` | Add text |
| **Undo** | `Ctrl + Z` | Undo last action |
| **Redo** | `Ctrl + Y` | Redo last action |
| **Zoom** | `Ctrl + Scroll` | Zoom in/out |

##  Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
