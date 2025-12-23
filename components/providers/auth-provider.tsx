// components/providers/auth-provider.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
<<<<<<< HEAD
}
=======
}
>>>>>>> fa52777d31a38cfcd618ef6bdf81d4dfbc86ed76
