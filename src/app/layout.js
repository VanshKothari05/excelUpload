import './globals.css';

export const metadata = {
  title: 'Excel Merger App',
  description: 'Merge and manage Excel files with MongoDB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
