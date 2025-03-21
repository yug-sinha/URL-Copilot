import "./globals.css";

export const metadata = {
  title: "URL Copilot",
  description: "Chat with your Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
