import { Download, Lock, MessageSquareHeart, X } from 'lucide-react';
import { EventConfig, OFFICE_LABELS, ScoredSubmission } from '../types';
import { downloadDataUrl } from '../utils/imageUtils';
import { formatTimestamp, getStickerPhotoUnlockStatus } from '../utils/scoring';

interface PhotoLightboxProps {
  submission: ScoredSubmission | null;
  config: EventConfig;
  allowUnblurred?: boolean;
  onClose: () => void;
}

export function PhotoLightbox({
  submission,
  config,
  allowUnblurred = false,
  onClose,
}: PhotoLightboxProps) {
  if (!submission) return null;

  const stickerName =
    config.stickerNames[submission.stickerDay - 1] ||
    `Day ${submission.stickerDay}`;
  const officeLabel = OFFICE_LABELS[submission.office];
  const safeName = submission.authorName.replace(/[^\w\u4e00-\u9fff-]+/g, '_');
  const filename = `薑餅人_${officeLabel}_Day${submission.stickerDay}_${safeName}.jpg`;

  const unlockStatus = getStickerPhotoUnlockStatus(
    submission.stickerDay,
    submission.createdAtMs,
    config.eventStartDate
  );
  const isBlurred = !allowUnblurred && !unlockStatus.unlocked;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="貼紙照片大圖檢視"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5EAE7] rounded-xl max-w-2xl w-full overflow-hidden shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E5EAE7]">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#111827] truncate font-display">
              {submission.authorName} · {officeLabel}
              {submission.department ? ` · ${submission.department}` : ''}
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5 font-mono-num">
              {stickerName} · {officeLabel}第 {submission.dayRank} 名回傳 ·{' '}
              {formatTimestamp(submission.createdAtMs)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉預覽"
            className="p-2 text-[#526058] hover:text-[#111827] rounded-lg hover:bg-[#F3F6F4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#F7FAF8] flex items-center justify-center max-h-[65vh] overflow-hidden p-3 relative">
          <img
            src={submission.imageDataUrl}
            alt={
              isBlurred
                ? `${submission.authorName} 的 ${stickerName}（尚未解鎖）`
                : `${submission.authorName} 上傳的 ${stickerName} 照片`
            }
            referrerPolicy="no-referrer"
            className={`max-h-[62vh] w-auto object-contain rounded-lg transition-all ${
              isBlurred ? 'blur-[11px] scale-105 select-none pointer-events-none' : ''
            }`}
          />
          {isBlurred && (
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-6 text-white">
              <div className="w-11 h-11 rounded-full bg-black/50 border border-white/25 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-bold">
                防劇透保護中 · 清楚照片將於第二天顯示
              </p>
              <p className="text-xs text-white/85 mt-1 font-mono-num">
                預計 {unlockStatus.unlockLabel} 自動解鎖
              </p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5EAE7] bg-white">
          <div className="text-sm text-[#111827] min-w-0 flex-1 space-y-1.5">
            {submission.note && (
              <div className="flex items-start gap-2 bg-[#F7FAF8] border border-[#E5EAE7] rounded-lg px-3 py-2 text-xs text-[#111827]">
                <MessageSquareHeart className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                <p className="break-words leading-relaxed">{submission.note}</p>
              </div>
            )}
            <p className="text-xs text-[#155E3A] font-semibold font-mono-num">
              獲得 {submission.totalPointsEarned} 分（基礎{' '}
              {submission.basePointsEarned} + 速報 {submission.bonusPointsEarned}）
            </p>
          </div>

          {!isBlurred && (
            <button
              type="button"
              onClick={() => downloadDataUrl(submission.imageDataUrl, filename)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>下載保存圖片</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
