import fs from 'fs';

/**
 * Delete temp cloned repository folder after analysis
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
