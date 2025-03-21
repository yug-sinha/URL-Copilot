import './globals.css';

export const metadata = {
  title: 'URL Chatbot',
  description: 'Chat with data from a URL',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
