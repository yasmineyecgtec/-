import { Download, X } from 'lucide-react';
import { EventConfig, OFFICE_LABELS, ScoredSubmission } from '../types';
import { downloadDataUrl } from '../utils/imageUtils';
import { formatTimestamp } from '../utils/scoring';

interface PhotoLightboxProps {
  submission: ScoredSubmission | null;
  config: EventConfig;
  onClose: () => void;
}

export function PhotoLightbox({
  submission,
  config,
  onClose,
}: PhotoLightboxProps) {
  if (!submission) return null;

  const stickerName =
    config.stickerNames[submission.stickerDay - 1] ||
    `Day ${submission.stickerDay}`;
  const officeLabel = OFFICE_LABELS[submission.office];
  const safeName = submission.authorName.replace(/[^\w\u4e00-\u9fff-]+/g, '_');
  const filename = `薑餅人_${officeLabel}_Day${submission.stickerDay}_${safeName}.jpg`;

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

        <div className="bg-[#F7FAF8] flex items-center justify-center max-h-[65vh] overflow-hidden p-3">
          <img
            src={submission.imageDataUrl}
            alt={`${submission.authorName} 上傳的 ${stickerName} 照片`}
            referrerPolicy="no-referrer"
            className="max-h-[62vh] w-auto object-contain rounded-lg"
          />
        </div>

        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#E5EAE7] bg-white">
          <div className="text-sm text-[#111827] min-w-0 flex-1">
            <p className="text-xs text-[#155E3A] font-semibold font-mono-num">
              獲得 {submission.totalPointsEarned} 分（基礎{' '}
              {submission.basePointsEarned} + 速報 {submission.bonusPointsEarned}）
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadDataUrl(submission.imageDataUrl, filename)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>下載保存圖片</span>
          </button>
        </div>
      </div>
    </div>
  );
}
