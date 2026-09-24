import React, { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { UpdateInfo } from '../services/updateService';
import { updateService } from '../services/updateService';
import { OFFICIAL_APK_DOWNLOAD_URL } from '../config/version';

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  currentVersion: string;
  currentVersionCode?: number;
  isMandatory?: boolean;
  onClose?: () => void;
  onLater?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  updateInfo,
  currentVersion: _currentVersion,
  isMandatory = false,
  onClose,
  onLater,
}) => {
  const isForceUpdate = Boolean(updateInfo.forceUpdate || isMandatory);
  // Direct APK download link to prevent redirecting to external website pages that require refreshing
  const directApkUrl =
    (updateInfo as any).directApkUrl ||
    updateInfo.apkDownloadUrl ||
    updateInfo.apkUrl ||
    OFFICIAL_APK_DOWNLOAD_URL ||
    'https://cinevaultapk.online/downloads/CineVault.apk';

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(-1);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Listen to native download progress from AndroidDevice
  useEffect(() => {
    (window as any).onApkDownloadProgress = (progress: number) => {
      setIsDownloading(true);
      setDownloadProgress(progress);
    };
    return () => {
      delete (window as any).onApkDownloadProgress;
    };
  }, []);

  // Handle escape key only for non-mandatory updates
  useEffect(() => {
    if (isForceUpdate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleLaterClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isForceUpdate]);

  // Lock down Android back press when force update is active
  useEffect(() => {
    if (!isForceUpdate) return;
    const blockBack = () => {
      // Returning false tells MainActivity that web app does not handle internal back navigation,
      // triggering double-back-to-exit rather than ever revealing the app content.
      return false;
    };
    (window as any).handleAndroidBack = blockBack;
    return () => {
      if ((window as any).handleAndroidBack === blockBack) {
        delete (window as any).handleAndroidBack;
      }
    };
  }, [isForceUpdate]);

  const handleUpdateClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDownloading) return;

    try {
      const androidDevice = (window as any).AndroidDevice;
      if (androidDevice && typeof androidDevice.downloadAndInstallApk === 'function') {
        setIsDownloading(true);
        setDownloadProgress(0);
        androidDevice.downloadAndInstallApk(directApkUrl);
        return;
      } else if (androidDevice && typeof androidDevice.openExternalUrl === 'function') {
        androidDevice.openExternalUrl(directApkUrl);
        return;
      }
    } catch {}

    // Fallback for browser direct download without page refresh
    try {
      const link = document.createElement('a');
      link.href = directApkUrl;
      link.download = 'CineVault.apk';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      updateService.openUpdateUrl(directApkUrl);
    }
  };

  const handleLaterClick = () => {
    if (isForceUpdate) return;
    if (onLater) {
      onLater();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100000] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-md select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-dialog-title"
    >
      {/* Background click handler (if not mandatory) */}
      <div
        className="absolute inset-0"
        onClick={isForceUpdate ? undefined : handleLaterClick}
      />

      {/* Main Centered Content */}
      <div
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CineVault Logo in Elevated Cinema Card */}
        <div className="relative mb-6 flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 rounded-3xl bg-[#11141B] border border-[#2B303C]/80 shadow-[0_16px_48px_rgba(0,0,0,0.85)] p-4">
          {/* Subtle Ambient Gold Behind Logo */}
          <div className="absolute inset-0 rounded-3xl bg-[#D6A84F]/5 blur-xl pointer-events-none" />
          <img
            src="/logo-user.png"
            alt="CineVault"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
            draggable={false}
          />
        </div>

        {/* Title: Update Required or Update Available */}
        <div className="flex flex-col items-center">
          {isForceUpdate && (
            <span className="mb-2 text-[10px] tracking-[0.2em] uppercase font-bold text-[#E5BA60] bg-[#E5BA60]/10 border border-[#E5BA60]/30 px-3 py-1 rounded-full">
              Action Required • Mandatory Update
            </span>
          )}
          <h2
            id="update-dialog-title"
            className="text-2xl sm:text-[26px] font-black text-white tracking-tight leading-tight"
          >
            {isForceUpdate ? 'Update Required' : 'Update Available'}
          </h2>
        </div>

        {/* Subtitle */}
        <p className="mt-2 text-sm sm:text-base text-[#9CA3AF] font-medium leading-relaxed max-w-[280px]">
          {isForceUpdate
            ? 'To continue using CineVault, please update to the latest version.'
            : (updateInfo.updateMessage || 'Update The Apk To The Latest Version')}
        </p>

        {/* Version Chip */}
        <div className="mt-3 flex items-center justify-center">
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D6A84F]/10 border border-[#D6A84F]/30 text-[#D6A84F] font-semibold">
            v{updateInfo.latestVersionName} Available
          </span>
        </div>

        {/* Action Button: "Update Now" or Downloading Progress Bar */}
        <div className="mt-7 w-full max-w-[260px] space-y-3">
          {isDownloading ? (
            <div className="w-full py-3.5 px-5 rounded-2xl bg-[#15181D] border border-[#D6A84F]/50 shadow-[0_8px_24px_rgba(0,0,0,0.6)] flex flex-col items-center gap-2.5 animate-pulse">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E5BA60]">
                <Loader2 className="w-4 h-4 animate-spin text-[#E5BA60] shrink-0" />
                <span>
                  {downloadProgress >= 100
                    ? 'Installing update...'
                    : downloadProgress >= 0
                    ? `Downloading update ${downloadProgress}%`
                    : 'Downloading update...'}
                </span>
              </div>
              <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#D6A84F] to-[#E5BA60] rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(8, downloadProgress >= 0 ? downloadProgress : 40)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-mono">
                {downloadProgress >= 100 ? 'Opening installer...' : 'Direct fast download in background'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUpdateClick}
              className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-[#D6A84F] via-[#E5BA60] to-[#D6A84F] text-[#0B0D10] font-black text-base shadow-[0_10px_28px_rgba(214,168,79,0.35)] hover:shadow-[0_12px_32px_rgba(214,168,79,0.5)] active:scale-[0.97] transition-all flex items-center justify-center gap-2 cursor-pointer tracking-wide"
            >
              <Download className="w-5 h-5 text-[#0B0D10]" />
              <span>Update Now</span>
            </button>
          )}

          {/* Optional "Later" action for non-mandatory updates */}
          {!isForceUpdate && !isDownloading && (
            <button
              type="button"
              onClick={handleLaterClick}
              className="w-full py-2.5 text-xs font-semibold text-[#8E95A5] hover:text-white transition-colors cursor-pointer"
            >
              Later
            </button>
          )}
        </div>

        <p className="mt-4 text-[11px] text-[#6B7280]">
          Instant direct update • No web page refresh required
        </p>
      </div>
    </div>
  );
};
