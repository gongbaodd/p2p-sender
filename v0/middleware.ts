import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware sets up the PeerJS server endpoint
export function middleware(request: NextRequest) {
  // For the PeerJS server endpoint, we'll proxy to our API route
  if (request.nextUrl.pathname.startsWith("/peer")) {
    // In a real implementation, this would proxy to a PeerJS server
    // For this example, we'll just pass it through
    return NextResponse.next()
  }

  return NextResponse.next()
}

