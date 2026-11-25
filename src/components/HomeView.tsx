import { useEffect, useState } from 'react';
import { Award, Camera, Clock, Pencil, Trophy } from 'lucide-react';
import {
  ActiveTab,
  EventConfig,
  OFFICE_LABELS,
  OfficeId,
  OfficeScoredData,
  ScoredSubmission,
  TOTAL_STICKERS,
} from '../types';
import { formatEventSubtitle } from '../utils/scoring';
import { GingerbreadStickerSvg } from './GingerbreadStickerSvg';

interface HomeViewProps {
  config: EventConfig;
  authorName: string;
  userOffice: OfficeId;
  mySubmissionsByDay: Record<number, ScoredSubmission>;
  byOffice: Record<OfficeId, OfficeScoredData>;
  totalValidCount: number;
  onNavigate: (tab: ActiveTab) => void;
  onOpenUpload: (day?: number) => void;
  onOpenProfile: () => void;
}

export function HomeView({
  config,
  authorName,
  userOffice,
  mySubmissionsByDay,
  byOffice,
  totalValidCount,
  onNavigate,
  onOpenUpload,
  onOpenProfile,
}: HomeViewProps) {
  const [previewOffice, setPreviewOffice] = useState<OfficeId>(userOffice);

  useEffect(() => {
    setPreviewOffice(userOffice);
  }, [userOffice]);

  const myFoundCount = Object.keys(mySubmissionsByDay).length;
  const myTotalScore = Object.values(mySubmissionsByDay).reduce(
    (sum, s) => sum + s.totalPointsEarned,
    0
  );
  const topThree = byOffice[previewOffice].leaderboard.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Clean editorial header band without decorative photo */}
      <section className="pb-8 border-b border-[#E5EAE7]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#155E3A] tracking-wide mb-2.5">
              <span>
                歡迎回來，{authorName || '同仁'} · {OFFICE_LABELS[userOffice]}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onOpenProfile}
                className="inline-flex items-center gap-1 text-[#B91C1C] hover:text-[#991B1B] underline underline-offset-2 font-semibold"
              >
                <Pencil className="w-3 h-3" />
                <span>設定參賽名稱</span>
              </button>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#155E3A] leading-tight tracking-tight mb-3 text-balance">
              {config.title}
            </h1>
            <p className="text-base text-[#4B5563] leading-relaxed">
              {formatEventSubtitle(config)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenUpload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>立即上傳貼紙照片</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('leaderboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#155E3A] bg-white border border-[#D1DDD6] hover:bg-[#F5F9F6] rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trophy className="w-4 h-4 text-[#155E3A]" />
              <span>查看分區排行榜</span>
            </button>
          </div>
        </div>

        {/* Full-width 3-column metrics strip */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5EAE7] rounded-xl px-5 py-4">
            <p className="text-xs font-medium text-[#6B7280]">我的集章進度</p>
            <p className="text-2xl font-bold text-[#111827] font-mono-num mt-1">
              {myFoundCount} / {TOTAL_STICKERS} 張
            </p>
          </div>

          <div className="bg-white border border-[#E5EAE7] rounded-xl px-5 py-4">
            <p className="text-xs font-medium text-[#6B7280]">個人累計總分</p>
            <p className="text-2xl font-bold text-[#155E3A] font-mono-num mt-1">
              {myTotalScore} 分
            </p>
          </div>

          <div className="bg-white border border-[#E5EAE7] rounded-xl px-5 py-4">
            <p className="text-xs font-medium text-[#6B7280]">兩地有效總上傳</p>
            <p className="text-2xl font-bold text-[#B91C1C] font-mono-num mt-1">
              {totalValidCount} 張
            </p>
          </div>
        </div>
      </section>

      {/* 7-sticker collection progress strip */}
      <section className="bg-white border border-[#E5EAE7] rounded-xl p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold text-[#111827]">
            我的 7 款薑餅人收集進度
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="text-xs font-semibold text-[#155E3A] hover:underline"
          >
            前往每日打卡管理照片
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
            const day = idx + 1;
            const found = Boolean(mySubmissionsByDay[day]);
            return (
              <button
                key={day}
                type="button"
                onClick={() => onOpenUpload(day)}
                className={`rounded-lg p-3.5 border transition-colors flex flex-col items-center text-center ${
                  found
                    ? 'bg-[#F2F8F4] border-[#155E3A]/40'
                    : 'bg-white border-[#E5EAE7] hover:border-[#B91C1C]/40'
                }`}
              >
                <GingerbreadStickerSvg day={day} className="w-12 h-12" />
                <span className="text-xs font-mono-num font-semibold text-[#111827] mt-2">
                  Day {day}
                </span>
                <span
                  className={`text-[11px] mt-0.5 font-medium ${
                    found ? 'text-[#155E3A]' : 'text-[#6B7280]'
                  }`}
                >
                  {found ? '已收集' : '未打卡'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Top 3 live leaders by office + 3 clean action cards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E5EAE7] rounded-xl p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center p-1 bg-[#F3F6F4] rounded-lg">
              {(['taipei', 'hsinchu'] as OfficeId[]).map((officeKey) => (
                <button
                  key={officeKey}
                  type="button"
                  onClick={() => setPreviewOffice(officeKey)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    previewOffice === officeKey
                      ? 'bg-white text-[#155E3A] shadow-xs'
                      : 'text-[#526058] hover:text-[#111827]'
                  }`}
                >
                  {OFFICE_LABELS[officeKey]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('leaderboard')}
              className="text-xs font-semibold text-[#155E3A] hover:underline whitespace-nowrap shrink-0"
            >
              看完整排行
            </button>
          </div>

          {topThree.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-8 text-center">
              {OFFICE_LABELS[previewOffice]}尚無回傳紀錄，歡迎搶先上傳！
            </p>
          ) : (
            <div className="divide-y divide-[#E5EAE7]">
              {topThree.map((entry, idx) => (
                <div
                  key={entry.participantKey}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-mono-num font-bold text-sm w-6 ${
                        idx === 0 ? 'text-[#B91C1C]' : 'text-[#155E3A]'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">
                        {entry.authorName}
                      </p>
                      <p className="text-xs text-[#6B7280] font-mono-num">
                        {entry.foundCount}/{TOTAL_STICKERS} 張 · 前 {config.topN} 名{' '}
                        {entry.topNCount} 次
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-num font-bold text-[#111827] shrink-0">
                    {entry.totalScore} 分
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5EAE7] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <Camera className="w-5 h-5 text-[#155E3A] mb-3" />
              <h3 className="text-sm font-semibold text-[#111827]">
                7 張貼紙打卡
              </h3>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                依台北與新竹各自藏匿線索尋找貼紙，拍照回傳並設定參賽名稱。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="mt-5 text-left text-xs font-semibold text-[#155E3A] hover:underline"
            >
              前往每日打卡
            </button>
          </div>

          <div className="bg-white border border-[#E5EAE7] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <Clock className="w-5 h-5 text-[#B91C1C] mb-3" />
              <h3 className="text-sm font-semibold text-[#111827]">
                各區前 {config.topN} 名 +{config.topNBonus} 分
              </h3>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                台北、新竹各自計算每日最快前 {config.topN} 名速報加分，分開頒獎更公平。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('rules')}
              className="mt-5 text-left text-xs font-semibold text-[#B91C1C] hover:underline"
            >
              查看兩地線索與規則
            </button>
          </div>

          <div className="bg-white border border-[#E5EAE7] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <Award className="w-5 h-5 text-[#155E3A] mb-3" />
              <h3 className="text-sm font-semibold text-[#111827]">
                貼紙照片保存牆
              </h3>
              <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                可依台北或新竹辦公室篩選瀏覽尋寶實拍照片並下載保存。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('gallery')}
              className="mt-5 text-left text-xs font-semibold text-[#155E3A] hover:underline"
            >
              瀏覽照片牆
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
