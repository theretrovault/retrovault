import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Photo Lookup is temporarily disabled.
// Tesseract.js worker threads cause uncaught exceptions that crash the Next.js
// production process in this runtime. Re-enable after isolating OCR to a
// long-running sidecar process outside Next.js.
export async function POST() {
  return NextResponse.json(
    { error: 'Photo Lookup is temporarily unavailable. Please type the title manually.' },
    { status: 503 }
  );
}
