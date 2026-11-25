import React, { useEffect, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import {
  EventConfig,
  MAX_AUTHOR_NAME_LENGTH,
  MAX_IMAGE_DATA_URL_LENGTH,
  OFFICE_LABELS,
  OfficeId,
  StickerSubmission,
  TOTAL_STICKERS,
} from '../types';
import { compressImageFile } from '../utils/imageUtils';

interface SubmissionModalProps {
  isOpen: boolean;
  initialDay: number;
  existingSubmission: StickerSubmission | null;
  defaultAuthorName: string;
  defaultDepartment: string;
  defaultOffice: OfficeId;
  config: EventConfig;
  onClose: () => void;
  onSubmit: (payload: {
    stickerDay: number;
    authorName: string;
    department: string;
    office: OfficeId;
    note: string;
    imageDataUrl: string;
    isProxy: boolean;
    editingId: string | null;
  }) => Promise<void>;
}

export function SubmissionModal({
  isOpen,
  initialDay,
  existingSubmission,
  defaultAuthorName,
  defaultDepartment,
  defaultOffice,
  config,
  onClose,
  onSubmit,
}: SubmissionModalProps) {
  const [stickerDay, setStickerDay] = useState(initialDay);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageInfo, setImageInfo] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (existingSubmission) {
      setStickerDay(existingSubmission.stickerDay);
      setImageDataUrl(existingSubmission.imageDataUrl);
      setImageInfo('已載入目前圖片（可選擇新照片更換）');
    } else {
      setStickerDay(initialDay);
      setImageDataUrl('');
      setImageInfo('');
    }
  }, [isOpen, initialDay, existingSubmission]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const result = await compressImageFile(file);
      setImageDataUrl(result.dataUrl);
      setImageInfo(
        `已壓縮最佳化：${result.width}×${result.height}px · 約 ${Math.round(
          result.approxBytes / 1024
        )} KB`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '圖片處理失敗');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = defaultAuthorName.trim();
    const trimmedDept = defaultDepartment.trim();

    if (!trimmedName || trimmedName.length > MAX_AUTHOR_NAME_LENGTH) {
      setError('請先至右上角「設定參賽名稱」完成參賽名稱與辦公室設定。');
      return;
    }
    if (
      !imageDataUrl ||
      imageDataUrl.length < 30 ||
      imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH
    ) {
      setError('請上傳一張薑餅人貼紙照片。');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        stickerDay,
        authorName: trimmedName,
        department: trimmedDept,
        office: defaultOffice,
        note: '',
        imageDataUrl,
        isProxy: false,
        editingId: existingSubmission ? existingSubmission.id : null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳失敗，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="上傳薑餅人貼紙照片"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5EAE7] rounded-xl max-w-xl w-full shadow-lg my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E5EAE7] bg-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              {existingSubmission ? '更換打卡照片' : '上傳薑餅人貼紙照片'}
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              上傳時刻以伺服器紀錄為準，台北與新竹分開計算前 {config.topN} 名 +
              {config.topNBonus} 分
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-2 text-[#526058] hover:text-[#111827] rounded-lg hover:bg-[#F3F6F4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              {error}
            </div>
          )}

          {/* Read-only summary of configured participant identity */}
          <div className="px-4 py-3 rounded-lg bg-[#F7FAF8] border border-[#E5EAE7] flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-[#155E3A]">
              參賽身分：{defaultAuthorName || '未設定'}
              {defaultDepartment ? ` · ${defaultDepartment}` : ''} ·{' '}
              {OFFICE_LABELS[defaultOffice]}
            </p>
            <p className="text-[11px] text-[#6B7280]">
              系統將依您於「設定參賽名稱」設定的名稱與辦公室直接計分，無需重複填寫。
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              選擇尋獲的薑餅人貼紙（共 {TOTAL_STICKERS} 張）
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
                const day = idx + 1;
                const selected = stickerDay === day;
                const locked = Boolean(existingSubmission);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={locked}
                    onClick={() => setStickerDay(day)}
                    className={`py-2 px-1 text-xs font-mono-num font-bold rounded-lg border transition-colors ${
                      selected
                        ? 'bg-[#155E3A] text-white border-[#155E3A]'
                        : 'bg-white text-[#111827] border-[#D1DDD6] hover:bg-[#F8FBF9]'
                    } ${locked && !selected ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Day {day}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#6B7280] mt-2">
              目前選擇：{config.stickerNames[stickerDay - 1] || `Day ${stickerDay}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1.5">
              上傳貼紙現場照片 <span className="text-[#B91C1C]">*</span>
            </label>
            <label className="flex flex-col items-center justify-center border border-dashed border-[#D1DDD6] hover:border-[#155E3A] rounded-xl p-4 cursor-pointer bg-[#F7FAF8] hover:bg-[#F2F8F4] transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
              {imageDataUrl ? (
                <div className="w-full flex flex-col items-center">
                  <img
                    src={imageDataUrl}
                    alt="貼紙照片預覽"
                    referrerPolicy="no-referrer"
                    className="max-h-48 w-auto rounded-lg object-contain border border-[#E5EAE7] mb-2"
                  />
                  <span className="text-xs text-[#155E3A] font-semibold">
                    {compressing ? '圖片壓縮處理中...' : imageInfo || '點擊可更換照片'}
                  </span>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <ImagePlus className="w-8 h-8 text-[#155E3A] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#111827]">
                    {compressing ? '圖片壓縮處理中...' : '點擊選擇或拍攝照片'}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    支援手機相機與電腦圖片，自動最佳化保存
                  </p>
                </div>
              )}
            </label>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5EAE7]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-[#4B5563] bg-white border border-[#D1DDD6] hover:bg-[#F8FBF9] rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || compressing}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>
                {submitting
                  ? '儲存上傳中...'
                  : existingSubmission
                    ? '儲存更新'
                    : '送出並計分'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
