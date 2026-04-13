/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and production).
 * Used to initialize the in-process scheduler.
 */

export async function register() {
  // Only run on the server side (not in the edge runtime or browser)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
