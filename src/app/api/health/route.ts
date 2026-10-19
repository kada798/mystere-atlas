import { NextResponse } from 'next/server';

export async function GET() {
  // Set a server-side breakpoint here, then use the development health button.
  return NextResponse.json({ status: 'ok', application: 'mystere-atlas' });
}
