import fs from 'fs';

/**
 * Purpose:
 * Deletes the temporarily cloned repository directory from disk after the
 * analysis pipeline completes (or fails).
 *
 * Role in System:
 * Acts as the resource-management utility ensuring the backend never
 * accumulates stale clone directories. Called at both Step 8 (success) and
 * inside the catch block (failure), making it the pipeline's mandatory
 * teardown hook.
 *
 * Key Responsibility:
 * Performs a recursive, forced deletion of the cloned repo path using Node's
 * fs.rmSync. Handles non-existent paths gracefully and logs any deletion
 * failures without crashing the response.
 *
 * Important Insight:
 * Used by the analyze route in both success and error paths, making it the
 * only module called more than once per request. This file depends on 1
 * module (fs) and is used by 1 file (routes/analyze.js).
 * It likely handles temp-file lifecycle, disk-space management, and
 * post-analysis cleanup safety.
 */
export function cleanup(clonePath) {
  try {
    if (clonePath && fs.existsSync(clonePath)) {
      fs.rmSync(clonePath, { recursive: true, force: true });
      console.log(`🧹 Cleaned up: ${clonePath}`);
    }
  } catch (error) {
    console.error(`⚠️ Cleanup failed for ${clonePath}:`, error.message);
  }
}
