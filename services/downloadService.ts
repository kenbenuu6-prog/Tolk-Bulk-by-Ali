import { DownloadStatus } from '../types';

// Simulation constants
const DOWNLOAD_SPEED_MS = 100; // Update every 100ms
const FAILURE_RATE = 0.05; // 5% chance of failure

export const simulateDownload = (
  taskId: string,
  onProgress: (id: string, progress: number) => void,
  onComplete: (id: string) => void,
  onFail: (id: string, error: string) => void
) => {
  let progress = 0;
  
  // Larger random initial delay (up to 4s) to stagger the start times 
  // and prevent file save dialogs from overlapping too much
  const initialDelay = Math.random() * 4000;
  
  // Varied download speed factor
  const speedFactor = 1 + Math.random() * 3;

  setTimeout(() => {
    const interval = setInterval(() => {
      progress += speedFactor;
      
      // Simulate random network stutter
      if (Math.random() > 0.9) progress -= 1;

      // Cap progress for this tick
      if (progress > 100) progress = 100;

      onProgress(taskId, Math.floor(progress));

      // Simulate failure mid-download
      if (progress > 30 && progress < 50 && Math.random() < (FAILURE_RATE / 20)) { 
        clearInterval(interval);
        onFail(taskId, "Network timeout.");
        return;
      }

      if (progress >= 100) {
        clearInterval(interval);
        onComplete(taskId);
      }
    }, DOWNLOAD_SPEED_MS);
  }, initialDelay);
};