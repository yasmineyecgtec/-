import React, { useEffect, useState } from 'react';
import { UserCheck, X } from 'lucide-react';
import {
  MAX_AUTHOR_NAME_LENGTH,
  MAX_DEPARTMENT_LENGTH,
  OFFICE_LABELS,
  OfficeId,
} from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  currentName: string;
  currentDepartment: string;
  currentOffice: OfficeId;
  userEmail: string;
  onClose: () => void;
  onSave: (name: string, department: string, office: OfficeId) => Promise<void>;
}

export function ProfileModal({
  isOpen,
  currentName,
  currentDepartment,
  currentOffice,
  userEmail,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [department, setDepartment] = useState(currentDepartment);
  const [office, setOffice] = useState<OfficeId>(currentOffice);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(currentName);
    setDepartment(currentDepartment);
    setOffice(currentOffice);
    setError(null);
  }, [isOpen, currentName, currentDepartment, currentOffice]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedDept = department.trim();

    if (!trimmedName || trimmedName.length > MAX_AUTHOR_NAME_LENGTH) {
      setError(`請輸入有效的參賽名稱（1–${MAX_AUTHOR_NAME_LENGTH} 字）。`);
      return;
    }
    if (trimmedDept.length > MAX_DEPARTMENT_LENGTH) {
      setError(`部門名稱不可超過 ${MAX_DEPARTMENT_LENGTH} 字。`);
      return;
    }

    setSaving(true);
    try {
      await onSave(trimmedName, trimmedDept, office);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存設定失敗，請稍後再試。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="設定參賽名稱與辦公室"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5EAE7] rounded-xl max-w-md w-full shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-white border-b border-[#E5EAE7] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#111827] font-display">
              設定參賽名稱與辦公室
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉設定視窗"
            className="p-2 text-[#526058] hover:text-[#111827] rounded-lg hover:bg-[#F3F6F4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">
              所屬辦公室（分流計分與頒獎） <span className="text-[#B91C1C]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['taipei', 'hsinchu'] as OfficeId[]).map((officeKey) => {
                const selected = office === officeKey;
                return (
                  <button
                    key={officeKey}
                    type="button"
                    onClick={() => setOffice(officeKey)}
                    className={`py-2.5 px-3 text-sm font-semibold rounded-lg border transition-colors ${
                      selected
                        ? 'bg-[#155E3A] text-white border-[#155E3A]'
                        : 'bg-white text-[#111827] border-[#D1DDD6] hover:border-[#155E3A]'
                    }`}
                  >
                    {OFFICE_LABELS[officeKey]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-[#6B7280] mt-1.5">
              台北與新竹兩邊貼紙藏匿位置不同，將分別統計與分開頒獎；建議活動期間設定一次後不要隨意更改，避免影響最後匯出統計。
            </p>
          </div>

          <div>
            <label
              htmlFor="profile-name-input"
              className="block text-sm font-medium text-[#111827] mb-1.5"
            >
              參賽名稱 <span className="text-[#B91C1C]">*</span>
            </label>
            <input
              id="profile-name-input"
              type="text"
              required
              autoFocus
              maxLength={MAX_AUTHOR_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：王小明 或 小明"
              className="w-full px-3.5 py-2 text-sm text-[#111827] bg-white border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A] focus:border-[#155E3A]"
            />
            <p className="text-xs text-[#6B7280] mt-1.5">
              請設定一次固定名稱作為排行榜與最後匯出表單登記使用，活動期間請勿隨意更改。
            </p>
          </div>

          <div>
            <label
              htmlFor="profile-dept-input"
              className="block text-sm font-medium text-[#111827] mb-1.5"
            >
              部門 / 團隊（選填）
            </label>
            <input
              id="profile-dept-input"
              type="text"
              maxLength={MAX_DEPARTMENT_LENGTH}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="例如：產品設計部"
              className="w-full px-3.5 py-2 text-sm text-[#111827] bg-white border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A] focus:border-[#155E3A]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5EAE7]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#4B5563] bg-white border border-[#D1DDD6] hover:bg-[#F8FBF9] rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] disabled:opacity-60 rounded-lg transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>{saving ? '儲存更新中...' : '儲存參賽設定'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
