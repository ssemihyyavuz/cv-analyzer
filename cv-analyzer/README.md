# CV Analyzer Frontend

This is the frontend application for CV Analyzer, built with [Next.js](https://nextjs.org) 14.

## Development

First, run the development server:

```bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

## Features

- Modern UI with Tailwind CSS
- Real-time CV analysis feedback
- Multi-language support (English/Turkish)
- Job description matching
- Responsive design

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Context for state management
- [Geist](https://vercel.com/font) font family

## Project Structure

```
app/
├── api/
│   └── upload/
│       └── route.ts    # File upload endpoint
└── results/
    └── page.tsx        # Analysis results page

components/
├── animated-text.tsx   # Text animation
├── file-uploader.tsx   # File upload with job description
├── language-context.tsx # Language management
├── language-selector.tsx # Language UI
└── nav-links.tsx       # Navigation
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Main Project Repository](https://github.com/yourusername/cv-analyzer)
