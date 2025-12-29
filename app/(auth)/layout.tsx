// app/(auth)/layout.tsx
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
