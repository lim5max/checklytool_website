'use client'

import { PropsWithChildren } from 'react'
import { usePathname } from 'next/navigation'

/**
 * HeaderGate hides global dashboard headers on specific subroutes
 * to allow page-level pixel-perfect headers from Figma.
 *
 * By default it hides on:
 * - /dashboard/checks/[id]
 * - /dashboard/checks/[id]/results
 * - /dashboard/checks/[id]/submit
 * - /dashboard/tests/[id]
 */
export default function HeaderGate({ children }: PropsWithChildren) {
  const pathname = usePathname()

  const hide =
    /^\/dashboard\/checks\/[^/]+(\/results|\/submit)?$/.test(pathname || '') ||
    /^\/dashboard\/tests\/[^/]+$/.test(pathname || '') ||
    pathname === '/dashboard/checks/create' ||
    pathname === '/dashboard/test-builder'

  if (hide) return null
  return <>{children}</>
}