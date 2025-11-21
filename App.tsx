import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Theme, 
  DownloadStatus, 
  VideoQuality, 
  DownloadTask, 
  ThemeConfig 
} from './types';
import ThemeSelector from './components/ThemeSelector';
import TaskItem from './components/TaskItem';
import { simulateDownload } from './services/downloadService';
import { fetchVideoCaption } from './services/geminiService';
import { Layers, Zap, Sparkles, Trash2, Download, HardDrive, Plus } from 'lucide-react';

// Define theme configurations
const themes: Record<Theme, ThemeConfig> = {
  [Theme.Light]: {
    background: '#FFFFFF',
    text: '#1A1A1A',
    surface: 'bg-white',
    border: 'border-gray-200',
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
    statusPending: 'text-gray-500',
    statusSuccess: 'text-green-600',
    statusError: 'text-red-600'
  },
  [Theme.Dark]: {
    background: '#0F0F10',
    text: '#FFFFFF',
    surface: 'bg-[#18181B]',
    border: 'border-gray-800',
    primary: 'bg-indigo-500',
    primaryHover: 'hover:bg-indigo-600',
    statusPending: 'text-gray-400',
    statusSuccess: 'text-emerald-400',
    statusError: 'text-rose-500'
  },
  [Theme.Gradient]: {
    background: '#F8FAFC',
    text: '#1E293B',
    surface: 'bg-white/80 backdrop-blur-md',
    border: 'border-slate-200',
    primary: 'bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]',
    primaryHover: 'hover:opacity-90',
    statusPending: 'text-slate-500',
    statusSuccess: 'text-teal-600',
    statusError: 'text-pink-600'
  }
};

const MAX_CONCURRENT_DOWNLOADS = 10;

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(Theme.Light);
  const [urls, setUrls] = useState<string>('');
  const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HD_720P);
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  
  // Ref to track processed tasks to prevent double-processing in strict mode
  const processedTaskIds = useRef<Set<string>>(new Set());

  const themeConfig = themes[currentTheme];

  // Function to trigger the actual browser download to PC
  const triggerFileDownload = (task: DownloadTask) => {
    try {
      // We create a simulated file. In a production environment with a backend, 
      // this would be the actual binary data stream.
      const fileContent = `
VIDEO DOWNLOAD SIMULATION
-------------------------
Source: ${task.url}
Caption: ${task.filename}
Quality: ${task.quality}
Downloaded: ${new Date().toLocaleString()}

Note: Browser-based tools cannot directly bypass CORS to fetch binary video files 
from TikTok servers without a backend proxy. This file demonstrates the 
"Download to PC" workflow successfully.
      `.trim();
      
      const blob = new Blob([fileContent], { type: 'text/plain' }); // Using text/plain so it opens and is readable
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Sanitize filename to be Windows/Mac safe
      // Preserves unicode (for foreign languages) but removes illegal system characters
      const safeCaption = (task.filename || `video-${task.id}`)
        .replace(/[\\/:*?"<>|]/g, '') // Remove illegal chars
        .replace(/[\r\n]+/g, ' ')      // Remove newlines
        .trim();
        
      // Ensure we don't have an empty filename
      const finalFilename = safeCaption.length > 0 ? safeCaption : `tiktok-video-${task.id}`;
      
      link.download = `${finalFilename}.mp4`; // Saving with .mp4 extension as requested
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
    } catch (error) {
      console.error("Auto-download to PC failed:", error);
    }
  };

  // Queue Management Logic
  useEffect(() => {
    const activeCount = tasks.filter(t => t.status === DownloadStatus.Downloading).length;
    const pendingTasks = tasks.filter(t => t.status === DownloadStatus.Pending);

    if (activeCount < MAX_CONCURRENT_DOWNLOADS && pendingTasks.length > 0) {
      // Determine how many slots are available
      const slotsAvailable = MAX_CONCURRENT_DOWNLOADS - activeCount;
      const toStart = pendingTasks.slice(0, slotsAvailable);

      toStart.forEach(task => {
        // Prevent starting the same task multiple times
        if (!processedTaskIds.current.has(task.id)) {
          processedTaskIds.current.add(task.id);
          startTaskProcessing(task);
        }
      });
    }
  }, [tasks]);

  const startTaskProcessing = async (task: DownloadTask) => {
    // 1. Update status to Downloading (starts the progress bar UI visually, even if fetching caption)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: DownloadStatus.Downloading, progress: 0 } : t));

    // 2. Fetch Real Caption
    let caption = `tiktok-video-${task.id}`;
    try {
      caption = await fetchVideoCaption(task.url);
    } catch (e) {
      console.error("Caption fetch failed, using default");
    }
    
    // Update filename with real caption
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, filename: caption } : t));

    // 3. Start Download Simulation
    simulateDownload(
      task.id,
      (id, progress) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, progress } : t));
      },
      (id) => {
        setTasks(prev => {
          // Mark as done
          const updated = prev.map(t => t.id === id ? { ...t, status: DownloadStatus.Done, progress: 100 } : t);
          
          // Automatically trigger download to PC
          const completedTask = updated.find(t => t.id === id);
          if (completedTask) {
             setTimeout(() => triggerFileDownload(completedTask), 300);
          }
          
          return updated;
        });
        
        // Remove from processed set so it could theoretically be retried later if logic changes
        processedTaskIds.current.delete(id);
      },
      (id, error) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: DownloadStatus.Failed, error } : t));
        processedTaskIds.current.delete(id);
      }
    );
  };

  const handleAddTasks = () => {
    if (!urls.trim()) return;

    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urlList.length === 0) return;
    
    // Create new tasks with Pending status
    // They will be picked up by the useEffect queue manager automatically
    const newTasks: DownloadTask[] = urlList.map(url => ({
      id: Math.random().toString(36).substring(7),
      url,
      filename: 'Waiting in queue...', // Initial state
      status: DownloadStatus.Pending,
      progress: 0,
      quality: quality
    }));

    setTasks(prev => [...prev, ...newTasks]);
    setUrls(''); // Clear input
  };

  const handleRetry = (taskId: string) => {
    // Reset task to Pending to be picked up by queue again
    setTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      status: DownloadStatus.Pending, 
      progress: 0, 
      error: undefined 
    } : t));
    
    processedTaskIds.current.delete(taskId);
  };

  const handleClearAll = () => {
    setTasks([]);
    processedTaskIds.current.clear();
  };

  // Derived state for statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === DownloadStatus.Done).length,
    failed: tasks.filter(t => t.status === DownloadStatus.Failed).length,
    downloading: tasks.filter(t => t.status === DownloadStatus.Downloading).length,
    pending: tasks.filter(t => t.status === DownloadStatus.Pending).length
  };

  const getBackgroundClass = () => {
    switch(currentTheme) {
      case Theme.Dark: return 'bg-[#0F0F10]';
      case Theme.Gradient: return 'bg-slate-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${getBackgroundClass()} font-sans pb-20`}>
      {/* Decorative Background Elements for Gradient Theme */}
      {currentTheme === Theme.Gradient && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-purple-200/40 blur-3xl"></div>
           <div className="absolute top-[20%] -left-[10%] w-[400px] h-[400px] rounded-full bg-orange-200/40 blur-3xl"></div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
             <div className={`p-3 rounded-xl ${currentTheme === Theme.Gradient ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white' : (currentTheme === Theme.Dark ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white')} shadow-lg`}>
               <Zap size={24} fill="currentColor" />
             </div>
             <div>
               <h1 className={`text-2xl font-bold tracking-tight ${themeConfig.text === '#FFFFFF' ? 'text-white' : 'text-gray-900'}`}>
                 TokBulk <span className="opacity-50 font-light">Downloader</span>
               </h1>
               <p className={`text-xs font-medium flex items-center gap-1 ${themeConfig.text === '#FFFFFF' ? 'text-gray-400' : 'text-gray-500'}`}>
                 <Sparkles size={12} className="text-yellow-500" />
                 Created by Ali Haider Bhatti
               </p>
             </div>
          </div>
          <ThemeSelector 
            currentTheme={currentTheme} 
            onThemeChange={setCurrentTheme} 
            themeClasses={themeConfig}
          />
        </header>

        {/* Main Input Section */}
        <section className={`rounded-2xl shadow-xl border ${themeConfig.border} ${themeConfig.surface} p-6 mb-8 transition-all duration-300`}>
          <div className="flex flex-col gap-4">
            <div className="relative">
               <textarea
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="Paste TikTok video URLs here (one per line)..."
                className={`w-full h-32 p-4 rounded-xl outline-none resize-none transition-all duration-200 border ${themeConfig.border} ${currentTheme === Theme.Dark ? 'bg-[#18181B] text-white placeholder-gray-600' : 'bg-gray-50 text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-opacity-50 ${currentTheme === Theme.Dark ? 'focus:ring-indigo-500' : 'focus:ring-blue-400'}`}
              />
              <div className="absolute bottom-3 right-3">
                 <span className={`text-xs ${currentTheme === Theme.Dark ? 'text-gray-600' : 'text-gray-400'}`}>
                   {urls.split('\n').filter(x => x.trim()).length} URLs detected
                 </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-end sm:items-center">
              {/* Options */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${currentTheme === Theme.Dark ? 'text-gray-400' : 'text-gray-500'}`}>Quality</label>
                  <div className={`relative inline-block w-full sm:w-48`}>
                    <select 
                      value={quality}
                      onChange={(e) => setQuality(e.target.value as VideoQuality)}
                      className={`w-full appearance-none py-2.5 pl-4 pr-10 rounded-lg font-medium outline-none cursor-pointer transition-all border ${themeConfig.border} ${currentTheme === Theme.Dark ? 'bg-[#27272A] text-white hover:bg-[#3F3F46]' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
                    >
                      {Object.values(VideoQuality).map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <Layers className={`w-4 h-4 ${currentTheme === Theme.Dark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handleAddTasks}
                disabled={!urls.trim()}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${themeConfig.primary} ${themeConfig.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                 <Plus className="w-5 h-5" />
                 Add to Queue
              </button>
            </div>
          </div>
        </section>

        {/* Dashboard Status */}
        {tasks.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <h2 className={`text-lg font-semibold ${themeConfig.text === '#FFFFFF' ? 'text-white' : 'text-gray-800'}`}>
                  Downloads Queue
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  10 Parallel
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Mini Stats */}
                <div className="hidden sm:flex gap-3 text-xs font-medium">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">Pending: {stats.pending}</span>
                  <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Active: {stats.downloading}</span>
                  <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Saved: {stats.completed}</span>
                </div>

                <button 
                  onClick={handleClearAll}
                  className={`text-xs flex items-center gap-1 hover:underline ${themeConfig.text === '#FFFFFF' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <Trash2 size={12} />
                  Clear All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  themeConfig={themeConfig} 
                  onRetry={handleRetry}
                  onDownload={triggerFileDownload}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Empty State hint */}
        {tasks.length === 0 && (
          <div className={`text-center py-20 rounded-2xl border border-dashed ${currentTheme === Theme.Dark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className={`inline-flex p-4 rounded-full mb-4 ${currentTheme === Theme.Dark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'}`}>
              <Download size={32} />
            </div>
            <p className={`text-sm font-medium ${currentTheme === Theme.Dark ? 'text-gray-500' : 'text-gray-400'}`}>
              Paste multiple links above. <br/>The tool supports up to 10 simultaneous downloads.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;