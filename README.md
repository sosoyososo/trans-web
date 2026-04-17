# Translation Compare

A web application for comparing original text with translations side-by-side, supporting multiple translation models including MiniMax and DeepSeek.

## Features

- **Text Segmentation**: Automatically split long text into segments based on configurable minimum/maximum character limits
- **Multiple Translation Models**: Support for MiniMax and DeepSeek translation APIs
- **Side-by-Side Comparison**: Original and translated text displayed in synchronized, aligned rows
- **Synchronized Scrolling**: Both columns scroll together for easy comparison
- **Auto-Translation**: Automatically translates segments after segmentation
- **Parallel Translation**: Efficient translation with configurable concurrent requests
- **Configurable Settings**: Adjust segment length parameters and API credentials
- **Local Storage**: Settings and API configuration persisted in browser

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS + shadcn/ui
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

## Usage

1. **Configure API Settings**: Click the Settings button to enter your translation API endpoint and API key
2. **Select Model**: Choose between MiniMax or DeepSeek translation model
3. **Set Segment Length**: Adjust minimum and maximum character limits for text segmentation
4. **Paste Text**: Enter or paste the text you want to translate
5. **Segment**: Click the Segment button to split text into segments
6. **Translate**: Click Translate All to translate all segments

## Project Structure

```
trans-web/
├── app/
│   ├── api/translate/    # Translation API route
│   ├── page.tsx          # Main page
│   └── layout.tsx        # Root layout
├── components/
│   ├── translation-panel.tsx  # Main translation interface
│   ├── settings-dialog.tsx    # API settings dialog
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── config-store.ts  # Settings persistence
│   ├── text-segmenter.ts # Text segmentation logic
│   └── utils.ts         # Utility functions
└── types/
    └── index.ts          # TypeScript type definitions
```

## API Configuration

### MiniMax

- Endpoint: `https://api.minimax.chat/v1/chat/completions`
- Model: `MiniMax-Text-01`

### DeepSeek

- Endpoint: `https://api.deepseek.com/chat/completions`
- Model: `deepseek-chat`

## License

MIT
