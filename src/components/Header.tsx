import { ActiveTab } from '../types';

interface HeaderProps {
  brandTitle: string;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isAuthenticated: boolean;
  onPrimaryAction: () => void;
  isSigningIn: boolean;
}

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'home', label: '首頁' },
  { id: 'leaderboard', label: '總分排行榜' },
  { id: 'upload', label: '每日打卡' },
  { id: 'gallery', label: '貼紙照片牆' },
  { id: 'rules', label: '規則與管理' },
];

export function Header({
  brandTitle,
  activeTab,
  onSelectTab,
  isAuthenticated,
  onPrimaryAction,
  isSigningIn,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E5EAE7]">
      <div aria-hidden="true" className="flex h-[3px] w-full">
        <div className="w-1/2 bg-[#155E3A]" />
        <div className="w-1/2 bg-[#B91C1C]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="text-lg font-bold tracking-tight text-[#155E3A] hover:text-[#0F472B] transition-colors font-display whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155E3A] rounded"
        >
          {brandTitle}
        </button>

        {/* Zone 2: Clean single-line navigation links */}
        {isAuthenticated ? (
          <nav
            aria-label="主導覽列"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#155E3A] ${
                    active
                      ? 'text-[#155E3A] border-[#155E3A] font-semibold'
                      : 'text-[#526058] border-transparent hover:text-[#111827] hover:border-[#D1DDD6]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={isSigningIn}
            onClick={onPrimaryAction}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C] focus-visible:ring-offset-2"
          >
            {isAuthenticated
              ? '上傳貼紙照片'
              : isSigningIn
                ? '登入中...'
                : 'Google 登入'}
          </button>
        </div>
      </div>

      {/* Mobile navigation strip */}
      {isAuthenticated && (
        <nav
          aria-label="行動版導覽列"
          className="md:hidden border-t border-[#E5EAE7] px-3 py-1.5 flex items-center justify-between gap-1 overflow-x-auto bg-white"
        >
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#155E3A] text-white'
                    : 'text-[#526058] hover:text-[#111827] hover:bg-[#F3F7F4]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
