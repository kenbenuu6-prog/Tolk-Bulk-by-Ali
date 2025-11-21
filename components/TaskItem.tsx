import React from 'react';
import { DownloadTask, DownloadStatus, ThemeConfig } from '../types';
import { CheckCircle, AlertCircle, RotateCcw, Download, Film, Loader2 } from 'lucide-react';

interface TaskItemProps {
  task: DownloadTask;
  themeConfig: ThemeConfig;
  onRetry: (id: string) => void;
  onDownload: (task: DownloadTask) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, themeConfig, onRetry, onDownload }) => {
  const isDark = themeConfig.text === '#FFFFFF';

  const getStatusIcon = () => {
    switch (task.status) {
      case DownloadStatus.Done:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case DownloadStatus.Failed:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case DownloadStatus.Downloading:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case DownloadStatus.Pending:
        return <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />;
      default:
        return <div className="w-2 h-2 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case DownloadStatus.Done: return themeConfig.statusSuccess;
      case DownloadStatus.Failed: return themeConfig.statusError;
      case DownloadStatus.Downloading: return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`group relative overflow-hidden rounded-xl border ${themeConfig.border} ${themeConfig.surface} p-4 transition-all duration-300 hover:shadow-md`}>
      {/* Progress Background for Downloading State */}
      {task.status === DownloadStatus.Downloading && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 ease-out opacity-50" 
          style={{ width: `${task.progress}%` }}
        />
      )}

      <div className="flex items-center justify-between">
        {/* Icon & Info */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Film className={`w-6 h-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {task.filename || task.url}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                {task.quality}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">{task.url}</p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-4 pl-4">
          <div className="flex flex-col items-end">
             <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${getStatusColor()}`}>
               {task.status === DownloadStatus.Downloading ? `${task.progress}%` : task.status}
               {getStatusIcon()}
             </span>
             {task.error && (
               <span className="text-[10px] text-red-400 max-w-[120px] truncate">{task.error}</span>
             )}
          </div>

          {task.status === DownloadStatus.Failed && (
            <button 
              onClick={() => onRetry(task.id)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              title="Retry"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          
          {task.status === DownloadStatus.Done && (
             <button 
              onClick={() => onDownload(task)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              title="Download File"
             >
              <Download className="w-4 h-4" />
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;