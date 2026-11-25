import { Award, Camera, Clock } from 'lucide-react';
import { EventConfig, TOTAL_STICKERS } from '../types';
import { formatEventSubtitle } from '../utils/scoring';
import { GingerbreadStickerSvg } from './GingerbreadStickerSvg';

interface WelcomeGateProps {
  config: EventConfig;
  onSignIn: () => void;
  isSigningIn: boolean;
  authError: string | null;
}

export function WelcomeGate({
  config,
  onSignIn,
  isSigningIn,
  authError,
}: WelcomeGateProps) {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Editorial split hero without decorative photo */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start pb-12 border-b border-[#E5EAE7]">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold text-[#155E3A] tracking-wide mb-3">
            台北 · 新竹雙辦公室分流企劃 · {TOTAL_STICKERS} 天尋寶挑戰
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#155E3A] leading-[1.15] tracking-tight mb-5 text-balance">
            {config.title}
          </h1>
          <p className="text-base text-[#4B5563] leading-relaxed mb-8 max-w-xl">
            {formatEventSubtitle(config)}
          </p>

          {authError && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
            >
              {authError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={onSignIn}
              className="px-6 py-3 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] focus-visible:ring-offset-2"
            >
              {isSigningIn ? '正在開啟 Google 登入...' : '使用 Google 帳號登入參加'}
            </button>
            <span className="text-xs text-[#6B7280]">
              登入後即可設定參賽名稱並選擇台北或新竹辦公室
            </span>
          </div>
        </div>

        {/* Clean architectural rule highlights */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAE7] rounded-xl divide-y divide-[#E5EAE7]">
          <div className="p-5 flex items-start gap-3.5">
            <Camera className="w-5 h-5 text-[#155E3A] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">
                分流台北 / 新竹並設定參賽名稱
              </h2>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                登入後選擇所屬辦公室與參賽名稱，找到貼紙即可拍照上傳與保存圖片。
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-3.5">
            <Clock className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">
                兩地獨立計算前 {config.topN} 名 +{config.topNBonus} 分
              </h2>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                台北與新竹藏匿點不同，每日各自統計最快回傳前 {config.topN} 名給予速報加碼。
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-3.5">
            <Award className="w-5 h-5 text-[#155E3A] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-semibold text-[#111827]">
                7 張累計總分榜與分開頒獎
              </h2>
              <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                台北榜、新竹榜獨立排名與統計總分，支援一鍵匯出兩地報表。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clean 7-character Gingerbread Sticker Lineup */}
      <section aria-label="7 款限定薑餅人貼紙角色" className="py-10 border-b border-[#E5EAE7]">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
          <h2 className="text-base font-semibold text-[#111827]">
            7 款限定薑餅人貼紙清單
          </h2>
          <span className="text-xs text-[#6B7280]">
            每天找出一款，拍下現場照片上傳打卡
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
            const day = idx + 1;
            const rawName = config.stickerNames[idx] || `Day ${day}`;
            const shortTitle = rawName.includes('·')
              ? rawName.split('·')[1].trim()
              : rawName;
            return (
              <div
                key={day}
                className="bg-white border border-[#E5EAE7] rounded-xl p-3.5 flex flex-col items-center text-center hover:border-[#155E3A]/40 transition-colors"
              >
                <GingerbreadStickerSvg day={day} className="w-12 h-12" />
                <span className="text-[11px] font-mono-num font-semibold text-[#155E3A] mt-2">
                  Day {day}
                </span>
                <span className="text-xs font-medium text-[#111827] line-clamp-1 mt-0.5">
                  {shortTitle}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full-width 3-column summary strip */}
      <section
        aria-label="活動計分摘要"
        className="pt-10 grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white border border-[#E5EAE7] rounded-xl p-6">
          <p className="text-xs font-medium text-[#6B7280] mb-1.5">雙辦公室分流賽制</p>
          <p className="text-xl font-bold text-[#111827] font-display">
            台北 · 新竹分開頒獎
          </p>
          <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
            兩邊辦公室貼紙藏匿線索與排行榜完全獨立，公平競爭各自獎項。
          </p>
        </div>

        <div className="bg-white border border-[#E5EAE7] rounded-xl p-6">
          <p className="text-xs font-medium text-[#6B7280] mb-1.5">每日速報加碼</p>
          <p className="text-xl font-bold text-[#B91C1C] font-mono-num">
            各區前 {config.topN} 名 +{config.topNBonus} 分
          </p>
          <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
            台北與新竹各自依伺服器時間排序，前 {config.topN} 名皆享速報加分。
          </p>
        </div>

        <div className="bg-white border border-[#E5EAE7] rounded-xl p-6">
          <p className="text-xs font-medium text-[#6B7280] mb-1.5">單張最高可獲</p>
          <p className="text-xl font-bold text-[#155E3A] font-mono-num">
            {config.basePoints + config.topNBonus} 分 / 張
          </p>
          <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">
            基礎找到分 {config.basePoints} 分加上速報加分，7 張滿分達{' '}
            {(config.basePoints + config.topNBonus) * TOTAL_STICKERS} 分。
          </p>
        </div>
      </section>
    </main>
  );
}
