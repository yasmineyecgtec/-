import { useMemo, useState } from 'react';
import { Camera, Download, Search } from 'lucide-react';
import {
  EventConfig,
  OFFICE_LABELS,
  OFFICE_SHORT_LABELS,
  OfficeId,
  ScoredSubmission,
  TOTAL_STICKERS,
} from '../types';
import { downloadDataUrl } from '../utils/imageUtils';
import { formatTimestamp } from '../utils/scoring';

interface PhotoGalleryViewProps {
  config: EventConfig;
  submissions: ScoredSubmission[];
  onInspectPhoto: (submission: ScoredSubmission) => void;
  onOpenUpload: (day?: number) => void;
}

export function PhotoGalleryView({
  config,
  submissions,
  onInspectPhoto,
  onOpenUpload,
}: PhotoGalleryViewProps) {
  const [officeFilter, setOfficeFilter] = useState<OfficeId | 'all'>('all');
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...submissions]
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .filter((sub) => {
        if (officeFilter !== 'all' && sub.office !== officeFilter) return false;
        if (dayFilter !== 'all' && sub.stickerDay !== dayFilter) return false;
        if (!q) return true;
        return (
          sub.authorName.toLowerCase().includes(q) ||
          sub.department.toLowerCase().includes(q)
        );
      });
  }, [submissions, officeFilter, dayFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5EAE7] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Office filter */}
          <div className="inline-flex items-center p-1 bg-[#F3F6F4] rounded-lg self-start">
            <button
              type="button"
              onClick={() => setOfficeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                officeFilter === 'all'
                  ? 'bg-white text-[#155E3A] shadow-xs'
                  : 'text-[#526058] hover:text-[#111827]'
              }`}
            >
              全部辦公室（{submissions.length}）
            </button>
            {(['taipei', 'hsinchu'] as OfficeId[]).map((officeKey) => (
              <button
                key={officeKey}
                type="button"
                onClick={() => setOfficeFilter(officeKey)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  officeFilter === officeKey
                    ? 'bg-white text-[#155E3A] shadow-xs'
                    : 'text-[#526058] hover:text-[#111827]'
                }`}
              >
                {OFFICE_LABELS[officeKey]}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋參賽名稱或部門..."
              className="w-full pl-9 pr-3 py-1.5 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
            />
          </div>
        </div>

        {/* Day filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-[#E5EAE7]">
          <button
            type="button"
            onClick={() => setDayFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              dayFilter === 'all'
                ? 'bg-[#155E3A] text-white'
                : 'bg-[#F3F6F4] text-[#4B5563] hover:bg-[#E5EAE7]'
            }`}
          >
            全部 7 款
          </button>
          {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
            const day = idx + 1;
            const active = dayFilter === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setDayFilter(day)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 font-mono-num ${
                  active
                    ? 'bg-[#155E3A] text-white'
                    : 'bg-[#F3F6F4] text-[#4B5563] hover:bg-[#E5EAE7]'
                }`}
              >
                Day {day}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#E5EAE7] rounded-xl p-12 text-center">
          <Camera className="w-10 h-10 text-[#D1DDD6] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#111827] mb-1">
            目前沒有符合條件的貼紙照片
          </h3>
          <p className="text-sm text-[#4B5563] mb-5">
            上傳找到的薑餅人貼紙現場照片，與同事分享尋寶成果。
          </p>
          <button
            type="button"
            onClick={() => onOpenUpload(dayFilter === 'all' ? 1 : dayFilter)}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors"
          >
            上傳貼紙照片
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((sub) => {
            const officeShort = OFFICE_SHORT_LABELS[sub.office];
            const safeName = sub.authorName.replace(
              /[^\w\u4e00-\u9fff-]+/g,
              '_'
            );
            const filename = `薑餅人_${officeShort}_Day${sub.stickerDay}_${safeName}.jpg`;

            return (
              <article
                key={sub.id}
                className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => onInspectPhoto(sub)}
                    className="w-full aspect-4/3 bg-[#F3F6F4] overflow-hidden block relative group"
                  >
                    <img
                      src={sub.imageDataUrl}
                      alt={`${sub.authorName} 上傳的 Day ${sub.stickerDay} 貼紙`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-left text-white">
                      <p className="text-xs font-mono-num">
                        {officeShort} · Day {sub.stickerDay} · 第 {sub.dayRank} 名 · +
                        {sub.totalPointsEarned} 分
                      </p>
                    </div>
                  </button>

                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#111827] truncate">
                        {sub.authorName} · {officeShort}
                        {sub.department ? ` · ${sub.department}` : ''}
                      </h3>
                      <span className="text-xs text-[#6B7280] font-mono-num shrink-0">
                        {formatTimestamp(sub.createdAtMs)}
                      </span>
                    </div>
                    <p className="text-xs text-[#155E3A] font-medium mt-1 truncate">
                      {config.stickerNames[sub.stickerDay - 1] ||
                        `Day ${sub.stickerDay}`}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-[#E5EAE7] flex items-center justify-between gap-2 bg-white">
                  <button
                    type="button"
                    onClick={() => onInspectPhoto(sub)}
                    className="text-xs font-semibold text-[#B91C1C] hover:text-[#991B1B]"
                  >
                    放大檢視
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDataUrl(sub.imageDataUrl, filename)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#155E3A] bg-white border border-[#D1DDD6] hover:border-[#155E3A] hover:bg-[#F8FBF9] rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>保存圖片</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
