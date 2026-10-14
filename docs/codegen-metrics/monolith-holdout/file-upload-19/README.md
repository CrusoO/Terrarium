# Drop Gallery

A drag-and-drop image gallery for editors. Drop image files anywhere on the page to add them to the gallery.

## Features

- **Drag & drop** — drop one or multiple image files anywhere on the page
- **Click to browse** — click the drop zone or the "Add Images" button to open a file picker
- **Responsive grid** — images display in an auto-filling masonry-style grid
- **Lightbox** — click any image to view it full-size; press Escape or click outside to close
- **Remove images** — hover a card and click the × button to remove a single image
- **Clear all** — toolbar button with a two-step confirmation to remove all images
- **File validation** — non-image files are silently rejected with a shake animation
- **Memory safe** — object URLs are revoked when images are removed to prevent memory leaks
- **Session only** — images are not persisted; refreshing the page clears the gallery

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Supported Formats

JPG, PNG, GIF, WebP, SVG, AVIF — any file with an `image/*` MIME type.

## Tech Stack

- React 18 + Vite
- `URL.createObjectURL` for instant previews
- Pure CSS with custom properties — no UI library dependencies
