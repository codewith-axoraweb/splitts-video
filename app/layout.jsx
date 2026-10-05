import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'AI Video Studio — Caption & Clip Splitter',
  description:
    'Upload a long video, split into short clips, burn AI captions, add watermark, and download ready-to-post clips.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-dark-600 py-4 text-center text-sm text-gray-500">
          AI Video Studio &copy; {new Date().getFullYear()} — FFmpeg + Whisper · Next.js
        </footer>
      </body>
    </html>
  );
}
