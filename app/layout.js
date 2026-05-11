import "./globals.css";

export const metadata = {
  title: "パーソナルジム口コミジェネレーター",
  description:
    "10個の質問に答えるだけで、パーソナルジム向けのGoogle口コミを自動生成できるWebアプリです。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
        {children}
      </body>
    </html>
  );
}
