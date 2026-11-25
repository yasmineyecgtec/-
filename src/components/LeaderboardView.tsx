import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Search, Trophy } from 'lucide-react';
import {
  EventConfig,
  OFFICE_LABELS,
  OfficeId,
  OfficeScoredData,
  ScoredSubmission,
  TOTAL_STICKERS,
} from '../types';
import { exportLeaderboardCsv, formatTimestamp } from '../utils/scoring';

interface LeaderboardViewProps {
  config: EventConfig;
  byOffice: Record<OfficeId, OfficeScoredData>;
  defaultOffice: OfficeId;
  loading: boolean;
  onOpenUpload: (day?: number) => void;
  onInspectPhoto: (submission: ScoredSubmission) => void;
}

export function LeaderboardView({
  config,
  byOffice,
  defaultOffice,
  loading,
  onOpenUpload,
  onInspectPhoto,
}: LeaderboardViewProps) {
  const [selectedOffice, setSelectedOffice] = useState<OfficeId>(defaultOffice);
  const [viewMode, setViewMode] = useState<'total' | 'daily'>('total');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOffice(defaultOffice);
  }, [defaultOffice]);

  const officeData = byOffice[selectedOffice];
  const { leaderboard, submissionsByDay, scoredSubmissions } = officeData;
  const officeLabel = OFFICE_LABELS[selectedOffice];

  const filteredLeaderboard = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return leaderboard.filter((entry) => {
      if (onlyCompleted && entry.foundCount < TOTAL_STICKERS) return false;
      if (!q) return true;
      return (
        entry.authorName.toLowerCase().includes(q) ||
        entry.department.toLowerCase().includes(q)
      );
    });
  }, [leaderboard, searchQuery, onlyCompleted]);

  const dailyList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = submissionsByDay[selectedDay] || [];
    if (!q) return list;
    return list.filter(
      (s) =>
        s.authorName.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [submissionsByDay, selectedDay, searchQuery]);

  const leader = leaderboard[0];

  return (
    <div className="space-y-6">
      {/* Office Track Switcher */}
      <section
        aria-label="選擇辦公室排行榜"
        className="bg-white border border-[#E5EAE7] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-base font-semibold text-[#111827]">
            分流賽區：{officeLabel}
          </h2>
          <p className="text-xs text-[#4B5563] mt-0.5">
            台北與新竹兩地貼紙位置不同且分開頒獎，每日各自獨立計算前 {config.topN} 名速報加分。
          </p>
        </div>

        <div className="inline-flex items-center p-1 bg-[#F3F6F4] rounded-lg self-start sm:self-auto">
          {(['taipei', 'hsinchu'] as OfficeId[]).map((officeKey) => {
            const active = selectedOffice === officeKey;
            const count = byOffice[officeKey].leaderboard.length;
            return (
              <button
                key={officeKey}
                type="button"
                onClick={() => {
                  setSelectedOffice(officeKey);
                  setExpandedKey(null);
                }}
                className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 font-mono-num ${
                  active
                    ? 'bg-[#155E3A] text-white'
                    : 'text-[#526058] hover:text-[#111827]'
                }`}
              >
                {OFFICE_LABELS[officeKey]}（{count} 人）
              </button>
            );
          })}
        </div>
      </section>

      {/* KPI summary strip for selected office */}
      <section
        aria-label={`${officeLabel}活動即時總覽`}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white border border-[#E5EAE7] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6B7280]">{officeLabel}參與人數</p>
          <p className="text-2xl font-bold text-[#111827] mt-1 font-mono-num">
            {leaderboard.length} 位
          </p>
        </div>

        <div className="bg-white border border-[#E5EAE7] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6B7280]">{officeLabel}回傳照片</p>
          <p className="text-2xl font-bold text-[#111827] mt-1 font-mono-num">
            {scoredSubmissions.length} 張
          </p>
        </div>

        <div className="bg-white border border-[#E5EAE7] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6B7280]">本區速報加碼門檻</p>
          <p className="text-2xl font-bold text-[#B91C1C] mt-1 font-mono-num">
            前 {config.topN} 名 +{config.topNBonus}
          </p>
        </div>

        <div className="bg-white border border-[#E5EAE7] rounded-xl p-5">
          <p className="text-xs font-medium text-[#6B7280]">{officeLabel}目前領先</p>
          <p className="text-2xl font-bold text-[#155E3A] mt-1 truncate font-mono-num">
            {leader ? `${leader.authorName} · ${leader.totalScore} 分` : '尚無紀錄'}
          </p>
        </div>
      </section>

      {/* Toolbar & Table */}
      <section className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E5EAE7] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 bg-[#F3F6F4] rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('total')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'total'
                    ? 'bg-white text-[#155E3A] shadow-xs'
                    : 'text-[#526058] hover:text-[#111827]'
                }`}
              >
                {officeLabel}總分榜
              </button>
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  viewMode === 'daily'
                    ? 'bg-white text-[#155E3A] shadow-xs'
                    : 'text-[#526058] hover:text-[#111827]'
                }`}
              >
                每日最快前 {config.topN} 名
              </button>
            </div>

            {viewMode === 'total' && (
              <button
                type="button"
                onClick={() => setOnlyCompleted((v) => !v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  onlyCompleted
                    ? 'bg-[#155E3A] text-white border-[#155E3A]'
                    : 'bg-white text-[#4B5563] border-[#D1DDD6] hover:bg-[#F8FBF9]'
                }`}
              >
                僅顯示集滿 {TOTAL_STICKERS} 張
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:flex-initial sm:w-60">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋參賽名稱或部門..."
                className="w-full pl-9 pr-3 py-1.5 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
              />
            </div>

            <button
              type="button"
              disabled={leaderboard.length === 0}
              onClick={() =>
                exportLeaderboardCsv(leaderboard, config, selectedOffice)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#155E3A] bg-white border border-[#D1DDD6] hover:bg-[#F8FBF9] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出{officeLabel} CSV</span>
            </button>
          </div>
        </div>

        {/* Daily selector strip when in daily mode */}
        {viewMode === 'daily' && (
          <div className="px-4 sm:px-5 py-3 bg-[#F7FAF8] border-b border-[#E5EAE7] flex items-center gap-2 overflow-x-auto">
            {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
              const day = idx + 1;
              const count = (submissionsByDay[day] || []).length;
              const active = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 font-mono-num ${
                    active
                      ? 'bg-[#155E3A] text-white border-[#155E3A]'
                      : 'bg-white text-[#4B5563] border-[#D1DDD6] hover:border-[#B91C1C]/40'
                  }`}
                >
                  Day {day}（{count} 人）
                </button>
              );
            })}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, idx) => (
              <div
                key={idx}
                className="h-12 bg-[#F3F6F4] rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : viewMode === 'total' ? (
          filteredLeaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-10 h-10 text-[#D1DDD6] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#111827] mb-1">
                {leaderboard.length === 0
                  ? `${officeLabel}目前還沒有同仁回傳貼紙照片`
                  : '找不到符合條件的同仁'}
              </h3>
              <p className="text-sm text-[#4B5563] mb-5">
                {leaderboard.length === 0
                  ? `快成為${officeLabel}第一位找到薑餅人貼紙並搶下速報 +${config.topNBonus} 分的同仁吧！`
                  : '請嘗試清除搜尋關鍵字或篩選條件。'}
              </p>
              {leaderboard.length === 0 && (
                <button
                  type="button"
                  onClick={() => onOpenUpload(1)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors"
                >
                  立即上傳第一張貼紙
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5EAE7] bg-[#F7FAF8] text-xs font-semibold text-[#155E3A]">
                    <th className="py-3 px-4 w-16">名次</th>
                    <th className="py-3 px-4">參賽名稱 / 部門</th>
                    <th className="py-3 px-4">7 張貼紙集章進度</th>
                    <th className="py-3 px-4 text-right">找到張數</th>
                    <th className="py-3 px-4 text-right">前 {config.topN} 名次數</th>
                    <th className="py-3 px-4 text-right">累積總分</th>
                    <th className="py-3 px-4 w-12" aria-label="展開明細" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAE7] text-sm">
                  {filteredLeaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    const isExpanded = expandedKey === entry.participantKey;
                    return (
                      <Fragment key={entry.participantKey}>
                        <tr
                          onClick={() =>
                            setExpandedKey(
                              isExpanded ? null : entry.participantKey
                            )
                          }
                          className="hover:bg-[#F8FBF9] cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono-num font-bold">
                            <span
                              className={
                                rank === 1
                                  ? 'text-[#B91C1C]'
                                  : rank <= 3
                                    ? 'text-[#155E3A]'
                                    : 'text-[#6B7280]'
                              }
                            >
                              #{rank}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#111827]">
                              {entry.authorName}
                            </div>
                            <div className="text-xs text-[#6B7280]">
                              {entry.department || '未填寫部門'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {Array.from(
                                { length: TOTAL_STICKERS },
                                (_, dIdx) => {
                                  const day = dIdx + 1;
                                  const sub = entry.submissionsByDay[day];
                                  if (!sub) {
                                    return (
                                      <span
                                        key={day}
                                        title={`Day ${day} 尚未回傳`}
                                        className="w-7 h-7 rounded-md border border-[#E5EAE7] bg-white text-[#9CA3AF] text-xs font-mono-num flex items-center justify-center"
                                      >
                                        {day}
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onInspectPhoto(sub);
                                      }}
                                      title={`Day ${day} · ${officeLabel}第 ${sub.dayRank} 名 (+${sub.totalPointsEarned}分) · 點擊看照片`}
                                      className={`w-7 h-7 rounded-md text-xs font-mono-num font-bold flex items-center justify-center transition-colors ${
                                        sub.isTopN
                                          ? 'bg-[#155E3A] text-white hover:bg-[#0F472B]'
                                          : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEE2E2]'
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono-num text-[#111827]">
                            {entry.foundCount} / {TOTAL_STICKERS}
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono-num text-[#111827]">
                            {entry.topNCount} 次
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <span className="font-mono-num font-bold text-base text-[#111827]">
                              {entry.totalScore}
                            </span>
                            <span className="text-xs text-[#6B7280] ml-1">
                              分
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#6B7280]">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 inline" />
                            ) : (
                              <ChevronDown className="w-4 h-4 inline" />
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr
                            key={`${entry.participantKey}-details`}
                            className="bg-[#F7FAF8]"
                          >
                            <td colSpan={7} className="p-4 sm:p-5">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-[#4B5563]">
                                <span>
                                  {entry.authorName}（{officeLabel}）的尋寶照片與每日得分明細（基礎分小計{' '}
                                  <strong className="font-mono-num text-[#111827]">
                                    {entry.baseScoreTotal}
                                  </strong>{' '}
                                  + 速報加分小計{' '}
                                  <strong className="font-mono-num text-[#155E3A]">
                                    {entry.bonusScoreTotal}
                                  </strong>
                                  ）
                                </span>
                                <span className="font-mono-num text-[#6B7280]">
                                  最近回傳：{formatTimestamp(entry.latestSubmissionMs)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                                {Array.from(
                                  { length: TOTAL_STICKERS },
                                  (_, dIdx) => {
                                    const day = dIdx + 1;
                                    const sub = entry.submissionsByDay[day];
                                    if (!sub) {
                                      return (
                                        <div
                                          key={day}
                                          className="border border-dashed border-[#D1DDD6] rounded-lg p-3 text-center flex flex-col items-center justify-center min-h-[120px] bg-white"
                                        >
                                          <span className="text-xs font-mono-num text-[#6B7280]">
                                            Day {day}
                                          </span>
                                          <span className="text-xs text-[#9CA3AF] mt-1">
                                            未上傳
                                          </span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <button
                                        key={day}
                                        type="button"
                                        onClick={() => onInspectPhoto(sub)}
                                        className="group text-left bg-white border border-[#E5EAE7] hover:border-[#155E3A] rounded-lg overflow-hidden transition-colors"
                                      >
                                        <div className="aspect-4/3 bg-[#F3F6F4] overflow-hidden">
                                          <img
                                            src={sub.imageDataUrl}
                                            alt={`${entry.authorName} Day ${day}`}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          />
                                        </div>
                                        <div className="p-2">
                                          <div className="flex items-center justify-between text-xs font-mono-num">
                                            <span className="font-semibold text-[#111827]">
                                              Day {day}
                                            </span>
                                            <span
                                              className={
                                                sub.isTopN
                                                  ? 'text-[#155E3A] font-bold'
                                                  : 'text-[#B91C1C] font-semibold'
                                              }
                                            >
                                              +{sub.totalPointsEarned}
                                            </span>
                                          </div>
                                          <div className="text-[11px] text-[#6B7280] font-mono-num mt-0.5">
                                            第 {sub.dayRank} 名
                                            {sub.isTopN ? ' · 速報加碼' : ''}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : /* Daily speed ranking mode */ dailyList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-bold text-[#111827] mb-1">
              {officeLabel} ·{' '}
              {config.stickerNames[selectedDay - 1] || `Day ${selectedDay}`}{' '}
              尚無回傳紀錄
            </p>
            <p className="text-sm text-[#4B5563] mb-5">
              本區前 {config.topN} 名上傳此款貼紙照片的同仁皆可額外獲得 +
              {config.topNBonus} 分。
            </p>
            <button
              type="button"
              onClick={() => onOpenUpload(selectedDay)}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-lg transition-colors"
            >
              搶先上傳 Day {selectedDay} 貼紙
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5EAE7] bg-[#F7FAF8] text-xs font-semibold text-[#155E3A]">
                  <th className="py-3 px-4 w-24">{officeLabel}順位</th>
                  <th className="py-3 px-4">照片</th>
                  <th className="py-3 px-4">參賽名稱 / 部門</th>
                  <th className="py-3 px-4">伺服器上傳時間</th>
                  <th className="py-3 px-4 text-right">單張得分</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAE7] text-sm">
                {dailyList.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => onInspectPhoto(sub)}
                    className="hover:bg-[#F8FBF9] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono-num font-bold">
                      <span
                        className={
                          sub.isTopN ? 'text-[#155E3A]' : 'text-[#B91C1C]'
                        }
                      >
                        第 {sub.dayRank} 名
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <img
                        src={sub.imageDataUrl}
                        alt={`${sub.authorName} Day ${sub.stickerDay}`}
                        referrerPolicy="no-referrer"
                        className="w-14 h-10 object-cover rounded-md border border-[#E5EAE7] bg-white"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#111827]">
                        {sub.authorName}
                      </div>
                      <div className="text-xs text-[#6B7280]">
                        {sub.department || '未填寫部門'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono-num text-xs text-[#6B7280]">
                      {formatTimestamp(sub.createdAtMs)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num">
                      <span className="font-bold text-[#111827]">
                        +{sub.totalPointsEarned}
                      </span>
                      <span className="block text-[11px] text-[#6B7280]">
                        {sub.isTopN
                          ? `基礎 ${sub.basePointsEarned} + 速報 ${sub.bonusPointsEarned}`
                          : `基礎 ${sub.basePointsEarned}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
