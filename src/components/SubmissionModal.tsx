import React, { useEffect, useState } from 'react';
import { AlertTriangle, ImagePlus, MessageSquareHeart, Upload, X } from 'lucide-react';
import {
  EventConfig,
  MAX_AUTHOR_NAME_LENGTH,
  MAX_IMAGE_DATA_URL_LENGTH,
  MAX_NOTE_LENGTH,
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
  mySubmissionsByDay?: Record<number, StickerSubmission>;
  myRejectedByDay?: Record<number, StickerSubmission>;
  onClose: () => void;
  onSubmit: (payload: {
    stickerDay: number;
    authorName: string;
    department: string;
    office: OfficeId;
    note: string;
    imageDataUrl: string;
    photoChanged: boolean;
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
  mySubmissionsByDay = {},
  myRejectedByDay = {},
  onClose,
  onSubmit,
}: SubmissionModalProps) {
  const [stickerDay, setStickerDay] = useState(initialDay);
  const [note, setNote] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const [imageInfo, setImageInfo] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeExisting: StickerSubmission | null =
    existingSubmission ??
    mySubmissionsByDay[stickerDay] ??
    myRejectedByDay[stickerDay] ??
    null;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    const initialTarget =
      existingSubmission ??
      mySubmissionsByDay[initialDay] ??
      myRejectedByDay[initialDay] ??
      null;
    if (initialTarget) {
      setStickerDay(initialTarget.stickerDay);
      setNote(initialTarget.note || '');
      if (initialTarget.status === 'rejected') {
        setImageDataUrl('');
        setPhotoChanged(false);
        setImageInfo('');
      } else {
        setImageDataUrl(initialTarget.imageDataUrl);
        setPhotoChanged(false);
        setImageInfo('目前保留原照片（點擊此區可更換新照片）');
      }
    } else {
      setStickerDay(initialDay);
      setNote('');
      setImageDataUrl('');
      setPhotoChanged(true);
      setImageInfo('');
    }
  }, [isOpen, initialDay, existingSubmission]);

  if (!isOpen) return null;

  const isRejectedResubmit = activeExisting?.status === 'rejected';
  const isValidEdit = activeExisting?.status === 'valid';

  const handleSelectDay = (day: number) => {
    if (existingSubmission) return;
    setError(null);
    setStickerDay(day);
    const target = mySubmissionsByDay[day] ?? myRejectedByDay[day] ?? null;
    if (target) {
      setNote(target.note || '');
      if (target.status === 'rejected') {
        if (!photoChanged) {
          setImageDataUrl('');
          setImageInfo('');
        }
      } else if (!photoChanged || !imageDataUrl) {
        setImageDataUrl(target.imageDataUrl);
        setPhotoChanged(false);
        setImageInfo('目前保留原照片（點擊此區可更換新照片）');
      }
    } else {
      if (!photoChanged) {
        setImageDataUrl('');
        setImageInfo('');
      }
      setPhotoChanged(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCompressing(true);
    try {
      const result = await compressImageFile(file);
      setImageDataUrl(result.dataUrl);
      setPhotoChanged(true);
      setImageInfo(
        `已選取新照片（${result.width}×${result.height}px · 約 ${Math.round(
          result.approxBytes / 1024
        )} KB）`
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
    const trimmedNote = note.trim();

    if (!trimmedName || trimmedName.length > MAX_AUTHOR_NAME_LENGTH) {
      setError('請先至右上角「設定參賽名稱」完成參賽名稱與辦公室設定。');
      return;
    }
    if (trimmedNote.length > MAX_NOTE_LENGTH) {
      setError(`給同事的留言不可超過 ${MAX_NOTE_LENGTH} 字。`);
      return;
    }
    if (isRejectedResubmit && !photoChanged) {
      setError('原本的照片已被設為無效，請上傳一張新的有效貼紙照片。');
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
        note: trimmedNote,
        imageDataUrl,
        photoChanged: Boolean(!activeExisting || photoChanged || isRejectedResubmit),
        isProxy: false,
        editingId: activeExisting ? activeExisting.id : null,
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
              {isRejectedResubmit
                ? '重新上傳有效貼紙照片'
                : isValidEdit
                  ? '更換打卡照片與留言'
                  : '上傳薑餅人貼紙照片'}
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

          {isRejectedResubmit && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] space-y-1"
            >
              <p className="font-bold">此張貼紙先前已被管理員設為無效：</p>
              <p>
                原因：{activeExisting?.rejectionReason || '未填寫原因'}
              </p>
              <p className="text-[#7F1D1D]">
                請重新拍攝並上傳清楚的指定貼紙照片，送出後將以最新上傳時間重新計分。
              </p>
            </div>
          )}

          {isValidEdit && (
            <div className="p-3.5 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">更換照片時間重新計算提醒</p>
                <p>
                  {photoChanged
                    ? '您已選取新照片！送出後上傳時間將更新為「最新送出時間」，並重新計算當日名次與速報加碼。'
                    : '若您更換新照片，上傳時間也會一併更新並重新計算當日名次（僅修改留言不會改變原打卡時間）。'}
                </p>
              </div>
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
                    onClick={() => handleSelectDay(day)}
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
                    {compressing
                      ? '圖片壓縮處理中...'
                      : imageInfo || '點擊可更換照片'}
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

          <div>
            <label
              htmlFor="colleague-note-input"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#111827] mb-1.5"
            >
              <MessageSquareHeart className="w-4 h-4 text-[#B91C1C]" />
              <span>給同事的留言（選填）</span>
            </label>
            <textarea
              id="colleague-note-input"
              rows={2}
              maxLength={MAX_NOTE_LENGTH}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例如：祝大家聖誕快樂！這隻薑餅人超可愛～"
              className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A] resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] mt-1">
              <span>留言會與照片一起顯示在「貼紙照片牆」（請勿劇透貼紙位置喔）</span>
              <span className="font-mono-num">
                {note.length}/{MAX_NOTE_LENGTH}
              </span>
            </div>
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
                  : isRejectedResubmit
                    ? '重新送出並計分'
                    : isValidEdit
                      ? photoChanged
                        ? '確認更換並重算時間'
                        : '儲存留言'
                      : '送出並計分'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
