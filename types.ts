export enum Theme {
  Light = 'LIGHT',
  Dark = 'DARK',
  Gradient = 'GRADIENT'
}

export enum DownloadStatus {
  Idle = 'IDLE',
  Pending = 'PENDING',
  Downloading = 'DOWNLOADING',
  Done = 'DONE',
  Failed = 'FAILED'
}

export enum VideoQuality {
  HD_720P = '720p',
  FHD_1080P = '1080p',
  MAX_QUALITY = 'Highest Quality'
}

export interface DownloadTask {
  id: string;
  url: string;
  filename: string; // AI generated or default
  status: DownloadStatus;
  progress: number;
  quality: VideoQuality;
  error?: string;
  fileSize?: string;
}

export interface ThemeConfig {
  background: string;
  text: string;
  surface: string;
  border: string;
  primary: string;
  primaryHover: string;
  statusPending: string;
  statusSuccess: string;
  statusError: string;
}