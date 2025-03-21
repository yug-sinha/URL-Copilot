import './globals.css';

export const metadata = {
  title: 'URL Copilot',
  description: 'Chat with content extracted from URLs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-black text-gray-200">{children}</body>
    </html>
  );
}
