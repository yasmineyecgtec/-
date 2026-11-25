import { useState } from 'react';
import { Camera, Check, Download, LogOut, Pencil, Trash2 } from 'lucide-react';
import {
  EventConfig,
  MAX_AUTHOR_NAME_LENGTH,
  MAX_DEPARTMENT_LENGTH,
  OFFICE_LABELS,
  OfficeId,
  ScoredSubmission,
  StickerSubmission,
  TOTAL_STICKERS,
} from '../types';
import { downloadDataUrl } from '../utils/imageUtils';
import { formatTimestamp, getOfficeHints } from '../utils/scoring';
import { GingerbreadStickerSvg } from './GingerbreadStickerSvg';

interface StickerCheckinViewProps {
  config: EventConfig;
  userEmail: string;
  authorName: string;
  department: string;
  userOffice: OfficeId;
  mySubmissionsByDay: Record<number, ScoredSubmission>;
  onSaveProfile: (
    name: string,
    department: string,
    office: OfficeId
  ) => Promise<void>;
  onOpenUpload: (day: number, existing: StickerSubmission | null) => void;
  onDeleteSubmission: (submission: StickerSubmission) => Promise<void>;
  onInspectPhoto: (submission: ScoredSubmission) => void;
  onSignOut: () => void;
}

export function StickerCheckinView({
  config,
  userEmail,
  authorName,
  department,
  userOffice,
  mySubmissionsByDay,
  onSaveProfile,
  onOpenUpload,
  onDeleteSubmission,
  onInspectPhoto,
  onSignOut,
}: StickerCheckinViewProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(authorName);
  const [deptInput, setDeptInput] = useState(department);
  const [officeInput, setOfficeInput] = useState<OfficeId>(userOffice);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const myFoundCount = Object.keys(mySubmissionsByDay).length;
  const myTotalScore = Object.values(mySubmissionsByDay).reduce(
    (sum, s) => sum + s.totalPointsEarned,
    0
  );
  const officeHints = getOfficeHints(config, userOffice);
  const officeLabel = OFFICE_LABELS[userOffice];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingProfile(true);
    try {
      await onSaveProfile(nameInput.trim(), deptInput.trim(), officeInput);
      setEditingProfile(false);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Colleague workspace profile strip */}
      <section className="bg-white border border-[#E5EAE7] rounded-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#6B7280]">
              我的參賽設定 · {officeLabel} · {userEmail}
            </p>
            <h2 className="text-xl font-bold text-[#111827] mt-1">
              {authorName || '未設定參賽名稱'}
              {department ? ` · ${department}` : ''}
            </h2>
            <p className="text-sm text-[#4B5563] mt-1 font-mono-num">
              已集滿 {myFoundCount} / {TOTAL_STICKERS} 張貼紙 · 個人累計總分{' '}
              <strong className="text-[#155E3A]">{myTotalScore} 分</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setNameInput(authorName);
                setDeptInput(department);
                setOfficeInput(userOffice);
                setEditingProfile((v) => !v);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#155E3A] bg-white border border-[#D1DDD6] hover:bg-[#F8FBF9] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>設定參賽名稱</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#526058] bg-[#F3F6F4] hover:bg-[#E5EAE7] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>登出帳號</span>
            </button>
          </div>
        </div>

        {editingProfile && (
          <form
            onSubmit={handleSave}
            className="mt-5 pt-5 border-t border-[#E5EAE7] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                所屬辦公室
              </label>
              <select
                value={officeInput}
                onChange={(e) => setOfficeInput(e.target.value as OfficeId)}
                className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
              >
                <option value="taipei">{OFFICE_LABELS.taipei}</option>
                <option value="hsinchu">{OFFICE_LABELS.hsinchu}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                參賽名稱
              </label>
              <input
                type="text"
                required
                maxLength={MAX_AUTHOR_NAME_LENGTH}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                部門 / 團隊
              </label>
              <input
                type="text"
                maxLength={MAX_DEPARTMENT_LENGTH}
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                placeholder="例如：行銷部"
                className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
              >
                {savingProfile ? '儲存中...' : '儲存設定'}
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-3 py-2 text-sm font-medium text-[#526058] hover:text-[#111827] whitespace-nowrap"
              >
                取消
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 7-Sticker Stamp Grid */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold text-[#111827]">
            {officeLabel} · 7 張薑餅人貼紙集章卡
          </h3>
          <span className="text-xs text-[#6B7280]">
            以下顯示「{officeLabel}」專屬尋找線索，依該區伺服器回傳時間獨立排名
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
            const day = idx + 1;
            const sub = mySubmissionsByDay[day];
            const stickerName = config.stickerNames[idx] || `Day ${day}`;
            const hint = officeHints[idx] || '';

            return (
              <article
                key={day}
                className={`bg-white border rounded-xl overflow-hidden flex flex-col justify-between ${
                  sub ? 'border-[#155E3A]/40' : 'border-[#E5EAE7]'
                }`}
              >
                <div>
                  <div className="p-4 border-b border-[#E5EAE7] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-[#6B7280] font-mono-num">
                        第 {day} 張 ·{' '}
                        {sub
                          ? `${OFFICE_LABELS[sub.office]}第 ${sub.dayRank} 名 (+${sub.totalPointsEarned}分)`
                          : '尚未尋獲'}
                      </p>
                      <h4 className="text-sm font-semibold text-[#111827] truncate mt-0.5">
                        {stickerName}
                      </h4>
                    </div>
                    {sub ? (
                      <span className="w-7 h-7 rounded-full bg-[#155E3A] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-7 h-7 rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-xs font-mono-num font-bold flex items-center justify-center shrink-0">
                        {day}
                      </span>
                    )}
                  </div>

                  {sub ? (
                    <button
                      type="button"
                      onClick={() => onInspectPhoto(sub)}
                      className="w-full aspect-4/3 bg-[#F3F6F4] overflow-hidden block relative group"
                    >
                      <img
                        src={sub.imageDataUrl}
                        alt={stickerName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-left text-white">
                        <p className="text-xs font-mono-num">
                          上傳於 {formatTimestamp(sub.createdAtMs)}
                        </p>
                        {sub.isTopN && (
                          <p className="text-xs font-semibold text-emerald-300 mt-0.5">
                            搶進{OFFICE_LABELS[sub.office]}前 {config.topN} 名 ·
                            速報加碼 +{sub.bonusPointsEarned} 分
                          </p>
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="p-4 flex items-center gap-4 bg-white">
                      <div className="w-24 h-24 rounded-lg bg-[#F7FAF8] border border-[#E5EAE7] flex items-center justify-center shrink-0">
                        <GingerbreadStickerSvg day={day} className="w-20 h-20" />
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {hint || '找到此款薑餅人貼紙後拍照回傳即可得分。'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-[#E5EAE7] flex items-center justify-between gap-2 bg-white">
                  {sub ? (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenUpload(day, sub)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111827] border border-[#D1DDD6] hover:bg-[#F8FBF9] rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>更換照片</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            downloadDataUrl(
                              sub.imageDataUrl,
                              `薑餅人_${OFFICE_LABELS[sub.office]}_Day${day}_${sub.authorName}.jpg`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#155E3A] border border-[#155E3A]/30 hover:bg-[#F2F8F4] rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>保存</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={deletingId === sub.id}
                        onClick={async () => {
                          setDeletingId(sub.id);
                          try {
                            await onDeleteSubmission(sub);
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        aria-label={`刪除 Day ${day} 上傳紀錄`}
                        className="p-1.5 text-[#6B7280] hover:text-[#B91C1C] rounded-md transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenUpload(day, null)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>上傳 Day {day} 照片</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
