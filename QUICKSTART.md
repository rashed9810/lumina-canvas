# Lumina Canvas - Quick Start Guide

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   - Copy `.env.local.example` to `.env.local`
   - Get your API key from https://ai.google.dev
   - Add to `.env.local`:
     ```
     GEMINI_API_KEY=your_key_here
     ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

---

## Tools Available

### Drawing Tools
- **Pen** ✏️ - Free-hand drawing
- **Eraser** 🧹 - Erase drawn content
- **Rectangle** ⬜ - Draw rectangles (click to place)
- **Circle** ⭕ - Draw circles (click to place)
- **Line** 📏 - Draw straight lines (click start, then end point)
- **Text** 📝 - Add editable text (click to place)

### Other Features
- **Select** ↖️ - Select and move objects
- **Undo** ↶ - Undo last action (Ctrl+Z)
- **Redo** ↷ - Redo last action (Ctrl+Y)
- **Export** 💾 - Save as PNG (Ctrl+S)
- **Clear** 🗑️ - Clear entire canvas
- **AI Generator** ✨ - Generate SVG images from text

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Z` | Redo (Alt) |
| `Ctrl+S` | Export |
| `Delete` | Delete selected |
| `Backspace` | Delete selected |

---

## Tips & Tricks

### Multiplayer Mode
- Open the same URL in multiple browser tabs/windows
- See real-time cursor movements from other users
- All drawings sync instantly
- Use "Open in new tab" for testing

### AI Image Generation
- Describe the image you want, e.g., "A glowing futuristic tree"
- Wait for generation (may take 10-20 seconds)
- Generated SVG appears on canvas
- Can be moved and resized

### Image Import
- Drag any image file onto the canvas
- Supports PNG, JPG, GIF, WebP
- Image automatically scales to fit
- Syncs with other users

### Working with Text
- Click text tool, then click canvas to add text
- Default text "Type text" is editable
- Select and use Delete key to remove
- Change color before placing for custom text color

### Drawing Lines
- Click line tool
- Click once to set start point (tooltip shows "Click to set end point")
- Click again to draw the line
- Width and color can be adjusted before drawing

---

## Troubleshooting

### AI Generation Not Working
- ✅ Check `.env.local` has correct GEMINI_API_KEY
- ✅ Verify API key is valid at https://ai.google.dev
- ✅ Check browser console for error messages
- ✅ Ensure API key has billing enabled

### Changes Not Syncing
- ✅ Check both windows/tabs have the same URL
- ✅ Verify both are on the same network
- ✅ Try refreshing page (Ctrl+R)
- ✅ Check browser DevTools console for errors

### Image Import Issues
- ✅ Ensure file is a valid image (PNG, JPG, GIF, WebP)
- ✅ Try smaller file sizes if drag-drop hangs
- ✅ Check browser console for errors

### Performance Issues
- ✅ Undo history is limited to 50 states
- ✅ Large images may slow down the canvas
- ✅ Try exporting and starting fresh if laggy

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## API Integration

**Gemini API** is used for AI image generation:
- Model: `gemini-2.5-flash`
- Input: Text description
- Output: SVG code
- No cost for testing (with free tier API key)

---

## File Structure

```
lumina-canvas/
├── components/
│   ├── CanvasBoard.tsx    # Main drawing canvas
│   ├── Toolbar.tsx        # Tool buttons and controls
│   └── CursorOverlay.tsx  # Multiplayer cursor display
├── services/
│   ├── broadcastService.ts # Multiplayer sync
│   └── geminiService.ts    # AI image generation
├── App.tsx                # Main app component
├── types.ts               # TypeScript types
├── constants.ts           # App constants
├── index.tsx              # React root
├── index.html             # HTML template
├── vite.config.ts         # Vite config
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies
└── .env.local.example     # Environment template
```

---

## Performance Notes

- **Canvas History**: Limited to 50 states (prevents memory bloat)
- **Cursor Timeout**: Remote cursors fade after 5 seconds of inactivity
- **Drawing Optimization**: Decimate is set to 2 for smooth performance
- **SVG Auto-Scaling**: Large imported SVGs automatically scale down

---

## Support & Feedback

If you encounter any issues:
1. Check the browser console (F12 -> Console)
2. Verify environment configuration
3. Try refreshing the page
4. Clear browser cache if needed
5. Test in a different browser

---

## License & Credits

Built with:
- React 19.2
- Fabric.js 5.3.1
- Framer Motion 12.23
- Google Gemini AI
- Tailwind CSS
- Vite 6.2

Enjoy creating! 🎨✨
