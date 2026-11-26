import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  AdminInviteRecord,
  AdminUserRecord,
  DEFAULT_EVENT_CONFIG,
  EventConfig,
  MAX_ADMIN_NOTE_LENGTH,
  MAX_INVITE_EMAIL_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
  MAX_SUBTITLE_LENGTH,
  MAX_TITLE_LENGTH,
  OFFICE_LABELS,
  OFFICE_SHORT_LABELS,
  OfficeId,
  StickerSubmission,
  TOTAL_STICKERS,
  UserProfile,
} from '../types';
import {
  formatEventSubtitle,
  getOfficeHints,
  resolveSubmissionOffice,
  syncSubtitleWithBonus,
} from '../utils/scoring';
import { downloadStickerSvgAsPng } from '../utils/stickerPng';
import { GingerbreadStickerSvg } from './GingerbreadStickerSvg';

interface AdminRulesViewProps {
  config: EventConfig;
  userOffice: OfficeId;
  isAdmin: boolean;
  currentUserUid: string;
  currentUserEmail: string;
  bootstrapAdminEmail: string;
  allSubmissions: StickerSubmission[];
  adminUsers: AdminUserRecord[];
  adminInvites: AdminInviteRecord[];
  registeredUsers: UserProfile[];
  onSaveConfig: (nextConfig: EventConfig) => Promise<void>;
  onToggleSubmissionStatus: (
    sub: StickerSubmission,
    nextStatus: 'valid' | 'rejected',
    rejectionReason?: string
  ) => Promise<void>;
  onDeleteSubmission: (sub: StickerSubmission) => Promise<void>;
  onAddCoAdminByEmail: (email: string, note: string) => Promise<void>;
  onGrantCoAdminByUid: (user: UserProfile, note: string) => Promise<void>;
  onRevokeCoAdmin: (options: {
    uid?: string;
    inviteId?: string;
    email?: string;
  }) => Promise<void>;
}

export function AdminRulesView({
  config,
  userOffice,
  isAdmin,
  currentUserUid,
  currentUserEmail,
  bootstrapAdminEmail,
  allSubmissions,
  adminUsers,
  adminInvites,
  registeredUsers,
  onSaveConfig,
  onToggleSubmissionStatus,
  onDeleteSubmission,
  onAddCoAdminByEmail,
  onGrantCoAdminByUid,
  onRevokeCoAdmin,
}: AdminRulesViewProps) {
  const [hintOffice, setHintOffice] = useState<OfficeId>(userOffice);
  const [modOfficeFilter, setModOfficeFilter] = useState<OfficeId | 'all'>('all');

  const [title, setTitle] = useState(config.title);
  const [subtitle, setSubtitle] = useState(() => formatEventSubtitle(config));
  const [basePoints, setBasePoints] = useState(config.basePoints);
  const [topN, setTopN] = useState(config.topN);
  const [topNBonus, setTopNBonus] = useState(config.topNBonus);
  const [eventStartDate, setEventStartDate] = useState(
    config.eventStartDate || ''
  );
  const [stickerNames, setStickerNames] = useState<string[]>(config.stickerNames);
  const [hintsTaipei, setHintsTaipei] = useState<string[]>(
    getOfficeHints(config, 'taipei')
  );
  const [hintsHsinchu, setHintsHsinchu] = useState<string[]>(
    getOfficeHints(config, 'hsinchu')
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectTargetSub, setRejectTargetSub] =
    useState<StickerSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [selectedExistingUid, setSelectedExistingUid] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [revokingKey, setRevokingKey] = useState<string | null>(null);
  const [downloadingDay, setDownloadingDay] = useState<number | 'all' | null>(
    null
  );
  const [stickerDownloadError, setStickerDownloadError] = useState<
    string | null
  >(null);

  useEffect(() => {
    setHintOffice(userOffice);
  }, [userOffice]);

  useEffect(() => {
    setTitle(config.title);
    setSubtitle(formatEventSubtitle(config));
    setBasePoints(config.basePoints);
    setTopN(config.topN);
    setTopNBonus(config.topNBonus);
    setEventStartDate(config.eventStartDate || '');
    setStickerNames(config.stickerNames);
    setHintsTaipei(getOfficeHints(config, 'taipei'));
    setHintsHsinchu(
      Array.isArray(config.stickerHintsHsinchu) &&
        config.stickerHintsHsinchu.length === TOTAL_STICKERS
        ? config.stickerHintsHsinchu
        : DEFAULT_EVENT_CONFIG.stickerHintsHsinchu || config.stickerHints
    );
  }, [config]);

  const displayedHints = getOfficeHints(config, hintOffice);

  const filteredModSubmissions = allSubmissions.filter((sub) => {
    if (modOfficeFilter === 'all') return true;
    return resolveSubmissionOffice(sub) === modOfficeFilter;
  });

  const userByUid = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of registeredUsers) {
      map.set(u.uid, u);
    }
    return map;
  }, [registeredUsers]);

  const userByEmail = useMemo(() => {
    const map = new Map<string, UserProfile>();
    for (const u of registeredUsers) {
      const email = u.email?.trim().toLowerCase();
      if (email) map.set(email, u);
    }
    return map;
  }, [registeredUsers]);

  const coAdminRows = useMemo(() => {
    const rows: {
      key: string;
      uid?: string;
      inviteId?: string;
      email: string;
      displayName?: string;
      office?: OfficeId;
      note: string;
      hasLoggedIn: boolean;
      isSelf: boolean;
    }[] = [];

    const handledUids = new Set<string>();
    const normalizedBootstrap = bootstrapAdminEmail.toLowerCase();
    const normalizedSelfEmail = currentUserEmail.trim().toLowerCase();

    for (const inv of adminInvites) {
      const email = inv.email.trim().toLowerCase();
      if (!email || email === normalizedBootstrap) continue;
      const matchedUser = userByEmail.get(email);
      if (matchedUser) {
        handledUids.add(matchedUser.uid);
      }
      const matchedAdminDoc = matchedUser
        ? adminUsers.find((a) => a.uid === matchedUser.uid)
        : undefined;
      rows.push({
        key: `invite-${inv.id}`,
        uid: matchedAdminDoc?.uid,
        inviteId: inv.id,
        email,
        displayName: matchedUser?.displayName,
        office: matchedUser?.office,
        note: inv.note || matchedAdminDoc?.note || '',
        hasLoggedIn: Boolean(matchedUser),
        isSelf:
          email === normalizedSelfEmail ||
          matchedUser?.uid === currentUserUid,
      });
    }

    for (const adm of adminUsers) {
      if (handledUids.has(adm.uid)) continue;
      const matchedUser = userByUid.get(adm.uid);
      const email = matchedUser?.email?.trim().toLowerCase() || '';
      if (email === normalizedBootstrap) continue;
      rows.push({
        key: `uid-${adm.uid}`,
        uid: adm.uid,
        email: email || `UID: ${adm.uid.slice(0, 10)}...`,
        displayName: matchedUser?.displayName,
        office: matchedUser?.office,
        note: adm.note || '',
        hasLoggedIn: true,
        isSelf:
          adm.uid === currentUserUid ||
          (Boolean(email) && email === normalizedSelfEmail),
      });
    }

    return rows;
  }, [
    adminInvites,
    adminUsers,
    bootstrapAdminEmail,
    currentUserEmail,
    currentUserUid,
    userByEmail,
    userByUid,
  ]);

  const nonAdminRegisteredUsers = useMemo(() => {
    const adminUidSet = new Set(adminUsers.map((a) => a.uid));
    const adminEmailSet = new Set(
      adminInvites.map((i) => i.email.trim().toLowerCase())
    );
    adminEmailSet.add(bootstrapAdminEmail.toLowerCase());
    return registeredUsers.filter((u) => {
      const email = u.email?.trim().toLowerCase() || '';
      return !adminUidSet.has(u.uid) && !adminEmailSet.has(email);
    });
  }, [adminInvites, adminUsers, bootstrapAdminEmail, registeredUsers]);

  const handleAddCoAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminNotice(null);
    setAdminSaving(true);
    try {
      await onAddCoAdminByEmail(inviteEmail, inviteNote);
      setAdminNotice(
        `已授權 ${inviteEmail.trim().toLowerCase()} 為共同管理員，對方使用此 Google 帳號登入後即可管理活動。`
      );
      setInviteEmail('');
      setInviteNote('');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : '新增共同管理員失敗');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleQuickGrantSubmit = async () => {
    if (!selectedExistingUid) return;
    const target = registeredUsers.find((u) => u.uid === selectedExistingUid);
    if (!target) return;
    setAdminError(null);
    setAdminNotice(null);
    setAdminSaving(true);
    try {
      await onGrantCoAdminByUid(target, inviteNote);
      setAdminNotice(`已將「${target.displayName}」設為共同管理員。`);
      setSelectedExistingUid('');
      setInviteNote('');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : '授權失敗');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(false);

    if (!title.trim()) {
      setError('活動名稱不可為空。');
      return;
    }

    const sanitizedTaipei = hintsTaipei.map((h) => h.trim().slice(0, 120));
    const sanitizedHsinchu = hintsHsinchu.map((h) => h.trim().slice(0, 120));

    const finalBasePoints = Math.max(
      0,
      Math.min(1000, Math.round(Number(basePoints)))
    );
    const finalTopN = Math.max(1, Math.min(50, Math.round(Number(topN))));
    const finalTopNBonus = Math.max(
      0,
      Math.min(2000, Math.round(Number(topNBonus)))
    );
    const finalSubtitle = syncSubtitleWithBonus(
      subtitle.trim(),
      finalTopN,
      finalTopNBonus
    ).slice(0, MAX_SUBTITLE_LENGTH);

    setSaving(true);
    try {
      await onSaveConfig({
        title: title.trim().slice(0, MAX_TITLE_LENGTH),
        subtitle: finalSubtitle,
        basePoints: finalBasePoints,
        topN: finalTopN,
        topNBonus: finalTopNBonus,
        eventStartDate: eventStartDate.trim(),
        stickerNames: stickerNames.map((n, i) =>
          (n.trim() || `Day ${i + 1}`).slice(0, 60)
        ),
        stickerHints: sanitizedTaipei,
        stickerHintsTaipei: sanitizedTaipei,
        stickerHintsHsinchu: sanitizedHsinchu,
      });
      setSavedNotice(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存活動設定失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Public Rules Summary */}
      <section className="bg-white border border-[#E5EAE7] rounded-xl p-6">
        <h2 className="text-xl font-bold text-[#111827] mb-2">
          計分與雙辦公室分流規則說明
        </h2>
        <p className="text-sm text-[#4B5563] mb-6">
          {formatEventSubtitle(config)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#E5EAE7] pt-5">
          <div>
            <p className="text-xs font-medium text-[#6B7280]">每張基礎找到分</p>
            <p className="text-xl font-bold text-[#111827] font-mono-num mt-1">
              +{config.basePoints} 分
            </p>
            <p className="text-xs text-[#4B5563] mt-1">
              找到並成功上傳貼紙照片即可獲得基礎分數。
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B7280]">台北 / 新竹各自最快加碼</p>
            <p className="text-xl font-bold text-[#B91C1C] font-mono-num mt-1">
              各區前 {config.topN} 名 +{config.topNBonus} 分
            </p>
            <p className="text-xs text-[#4B5563] mt-1">
              台北、新竹兩邊分開排名與頒獎，依該區伺服器收到照片時間順序認定。
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-[#6B7280]">累計最高總分</p>
            <p className="text-xl font-bold text-[#155E3A] font-mono-num mt-1">
              {(config.basePoints + config.topNBonus) * TOTAL_STICKERS} 分
            </p>
            <p className="text-xs text-[#4B5563] mt-1">
              集齊 {TOTAL_STICKERS} 張且全數搶進該區前 {config.topN} 名可達成滿分。
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-[#E5EAE7] pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-semibold text-[#111827]">
              7 張薑餅人貼紙清單與各區尋找線索
            </h3>
            <div className="inline-flex items-center p-1 bg-[#F3F6F4] rounded-lg">
              {(['taipei', 'hsinchu'] as OfficeId[]).map((officeKey) => (
                <button
                  key={officeKey}
                  type="button"
                  onClick={() => setHintOffice(officeKey)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    hintOffice === officeKey
                      ? 'bg-white text-[#155E3A] shadow-xs'
                      : 'text-[#526058] hover:text-[#111827]'
                  }`}
                >
                  {OFFICE_LABELS[officeKey]}線索
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#E5EAE7]">
            {Array.from({ length: TOTAL_STICKERS }, (_, idx) => (
              <div
                key={idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <GingerbreadStickerSvg day={idx + 1} className="w-9 h-9 shrink-0" />
                  <span className="font-semibold text-[#111827]">
                    {config.stickerNames[idx] || `Day ${idx + 1}`}
                  </span>
                </div>
                <span className="text-xs text-[#4B5563]">
                  {displayedHints[idx] || '待福委公布線索'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Management Panel */}
      {isAdmin && (
        <>
          <section className="bg-white border border-[#E5EAE7] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#155E3A]" />
              <h2 className="text-lg font-bold text-[#111827]">
                活動參數與兩地線索管理（管理員專用）
              </h2>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
              >
                {error}
              </div>
            )}

            {savedNotice && (
              <div className="mb-4 p-3 rounded-lg bg-[#F2F8F4] border border-[#155E3A]/30 text-sm text-[#155E3A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>活動規則與台北/新竹線索已更新，排行榜已重新計算。</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    活動標題
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={MAX_TITLE_LENGTH}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    活動說明副標題
                  </label>
                  <input
                    type="text"
                    maxLength={MAX_SUBTITLE_LENGTH}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    若保留「每日最快回傳前 N 名再拿 X 分速報加碼」句型，調整下方分數時會自動同步更新。
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    每張基礎分
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={basePoints}
                    onChange={(e) => setBasePoints(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm text-[#111827] font-mono-num border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    各區每日最快加分名額（前 N 名）
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={topN}
                    onChange={(e) => {
                      const nextTopN = Number(e.target.value);
                      setTopN(nextTopN);
                      if (Number.isFinite(nextTopN) && nextTopN >= 1) {
                        setSubtitle((prev) =>
                          syncSubtitleWithBonus(
                            prev,
                            Math.round(nextTopN),
                            Math.max(0, Math.round(Number(topNBonus) || 0))
                          )
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-sm text-[#111827] font-mono-num border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1">
                    前 N 名額外加分
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={2000}
                    value={topNBonus}
                    onChange={(e) => {
                      const nextBonus = Number(e.target.value);
                      setTopNBonus(nextBonus);
                      if (Number.isFinite(nextBonus) && nextBonus >= 0) {
                        setSubtitle((prev) =>
                          syncSubtitleWithBonus(
                            prev,
                            Math.max(1, Math.round(Number(topN) || 1)),
                            Math.round(nextBonus)
                          )
                        );
                      }
                    }}
                    className="w-full px-3 py-2 text-sm text-[#111827] font-mono-num border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label
                    htmlFor="event-start-date-input"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    活動第 1 天日期（選填，用於貼紙照片牆逐日解鎖）
                  </label>
                  <input
                    id="event-start-date-input"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-[#111827] font-mono-num border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  />
                  <p className="text-[11px] text-[#6B7280] mt-1">
                    設定後，Day 1 清楚照片於第二天 00:00 顯示、Day 2 於第三天顯示，以此類推；若留白則依每張照片上傳隔天 00:00 解鎖。
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-[#E5EAE7] pt-4">
                <p className="text-xs font-semibold text-[#111827]">
                  各日貼紙名稱與台北 / 新竹各自線索（共 {TOTAL_STICKERS} 張）
                </p>
                {Array.from({ length: TOTAL_STICKERS }, (_, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-center pb-2 border-b border-[#F3F6F4] last:border-b-0"
                  >
                    <span className="lg:col-span-1 text-xs font-mono-num font-bold text-[#155E3A]">
                      Day {idx + 1}
                    </span>
                    <input
                      type="text"
                      maxLength={60}
                      value={stickerNames[idx] || ''}
                      onChange={(e) => {
                        const next = [...stickerNames];
                        next[idx] = e.target.value;
                        setStickerNames(next);
                      }}
                      placeholder={`Day ${idx + 1} 貼紙名稱`}
                      className="lg:col-span-3 px-3 py-1.5 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                    />
                    <input
                      type="text"
                      maxLength={120}
                      value={hintsTaipei[idx] || ''}
                      onChange={(e) => {
                        const next = [...hintsTaipei];
                        next[idx] = e.target.value;
                        setHintsTaipei(next);
                      }}
                      placeholder={`台北 Day ${idx + 1} 線索`}
                      className="lg:col-span-4 px-3 py-1.5 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                    />
                    <input
                      type="text"
                      maxLength={120}
                      value={hintsHsinchu[idx] || ''}
                      onChange={(e) => {
                        const next = [...hintsHsinchu];
                        next[idx] = e.target.value;
                        setHintsHsinchu(next);
                      }}
                      placeholder={`新竹 Day ${idx + 1} 線索`}
                      className="lg:col-span-4 px-3 py-1.5 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] disabled:opacity-60 rounded-lg transition-colors"
                >
                  {saving ? '儲存中...' : '儲存活動設定'}
                </button>
              </div>
            </form>
          </section>

          {/* Co-Admin / Event Helpers Management */}
          <section className="bg-white border border-[#E5EAE7] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#155E3A]" />
                  <h2 className="text-lg font-bold text-[#111827]">
                    共同管理員與活動幫手權限
                  </h2>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  新增活動幫手的 Google Email 後，對方使用該帳號登入即可一起編輯活動規則、兩地線索與審核照片（即使對方尚未登入過也能預先授權）。
                </p>
              </div>
            </div>

            {adminError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
              >
                {adminError}
              </div>
            )}

            {adminNotice && (
              <div className="mb-4 p-3 rounded-lg bg-[#F2F8F4] border border-[#155E3A]/30 text-sm text-[#155E3A] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{adminNotice}</span>
              </div>
            )}

            <form
              onSubmit={handleAddCoAdminSubmit}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pb-5 border-b border-[#E5EAE7]"
            >
              <div className="md:col-span-5">
                <label
                  htmlFor="co-admin-email"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  活動幫手 Google Email <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="co-admin-email"
                  type="email"
                  required
                  maxLength={MAX_INVITE_EMAIL_LENGTH}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="helper@company.com"
                  className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                />
              </div>

              <div className="md:col-span-4">
                <label
                  htmlFor="co-admin-note"
                  className="block text-xs font-semibold text-[#111827] mb-1"
                >
                  職稱或負責辦公室備註（選填）
                </label>
                <input
                  id="co-admin-note"
                  type="text"
                  maxLength={MAX_ADMIN_NOTE_LENGTH}
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  placeholder="例如：新竹辦公室幫手"
                  className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={adminSaving}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#155E3A] hover:bg-[#0F472B] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{adminSaving ? '授權中...' : '新增共同管理員'}</span>
                </button>
              </div>
            </form>

            {nonAdminRegisteredUsers.length > 0 && (
              <div className="py-4 border-b border-[#E5EAE7] flex flex-col sm:flex-row sm:items-center gap-3">
                <span className="text-xs font-semibold text-[#4B5563] whitespace-nowrap">
                  或從已登入同仁快速選擇：
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <select
                    value={selectedExistingUid}
                    onChange={(e) => setSelectedExistingUid(e.target.value)}
                    aria-label="選擇已登入同仁"
                    className="flex-1 px-3 py-1.5 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#155E3A]"
                  >
                    <option value="">請選擇已登入同仁...</option>
                    {nonAdminRegisteredUsers.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName}（{u.email} ·{' '}
                        {u.office === 'hsinchu' ? '新竹' : '台北'}）
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedExistingUid || adminSaving}
                    onClick={() => void handleQuickGrantSubmit()}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#155E3A] bg-white border border-[#D1DDD6] hover:bg-[#F8FBF9] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    一鍵授權
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 divide-y divide-[#E5EAE7]">
              {/* Primary Bootstrap Admin */}
              <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">
                    {bootstrapAdminEmail}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    系統預設主管理員 · 完整權限
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#155E3A] shrink-0">
                  預設管理員
                </span>
              </div>

              {coAdminRows.length === 0 ? (
                <p className="py-4 text-xs text-[#6B7280]">
                  尚未新增其他共同管理員。輸入兩位活動幫手的 Google Email 即可共同管理活動。
                </p>
              ) : (
                coAdminRows.map((row) => (
                  <div
                    key={row.key}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[#111827] truncate">
                          {row.displayName
                            ? `${row.displayName}（${row.email}）`
                            : row.email}
                        </span>
                        {row.office && (
                          <span className="text-xs text-[#6B7280]">
                            · {OFFICE_SHORT_LABELS[row.office]}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        <span
                          className={
                            row.hasLoggedIn
                              ? 'text-[#155E3A] font-medium'
                              : 'text-[#6B7280]'
                          }
                        >
                          {row.hasLoggedIn
                            ? '已登入啟用'
                            : '已授權（待對方登入後生效）'}
                        </span>
                        {row.note ? ` · ${row.note}` : ''}
                      </p>
                    </div>

                    {row.isSelf ? (
                      <span className="text-xs text-[#6B7280] shrink-0">
                        目前登入帳號
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={revokingKey === row.key}
                        onClick={async () => {
                          setAdminError(null);
                          setAdminNotice(null);
                          setRevokingKey(row.key);
                          try {
                            await onRevokeCoAdmin({
                              uid: row.uid,
                              inviteId: row.inviteId,
                              email: row.email,
                            });
                            setAdminNotice(`已移除 ${row.email} 的管理權限。`);
                          } catch (err) {
                            setAdminError(
                              err instanceof Error ? err.message : '移除權限失敗'
                            );
                          } finally {
                            setRevokingKey(null);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#B91C1C] bg-white border border-[#FECACA] hover:bg-[#FEF2F2] disabled:opacity-50 rounded-lg transition-colors self-start sm:self-auto shrink-0"
                      >
                        {revokingKey === row.key ? '移除中...' : '移除權限'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Printable Sticker PNG Export (1-7) */}
          <section className="bg-white border border-[#E5EAE7] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">
                  7 款薑餅人貼紙 PNG 圖檔下載（標示 1–7）
                </h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  與網站 Day 1–7 完全同款，已自動加上 1–7 號標示與透明背景剪裁白邊（1024×1024 高解析度 PNG），可直接列印做成實體貼紙。
                </p>
              </div>
              <button
                type="button"
                disabled={downloadingDay !== null}
                onClick={async () => {
                  setStickerDownloadError(null);
                  setDownloadingDay('all');
                  try {
                    for (let day = 1; day <= TOTAL_STICKERS; day++) {
                      await downloadStickerSvgAsPng(
                        `printable-sticker-svg-${day}`,
                        `薑餅人貼紙_${day}.png`
                      );
                      await new Promise((r) => setTimeout(r, 220));
                    }
                  } catch (err) {
                    setStickerDownloadError(
                      err instanceof Error ? err.message : '下載貼紙 PNG 失敗'
                    );
                  } finally {
                    setDownloadingDay(null);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>
                  {downloadingDay === 'all'
                    ? '批次產生下載中...'
                    : '一鍵下載全部 7 張 PNG'}
                </span>
              </button>
            </div>

            {stickerDownloadError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
              >
                {stickerDownloadError}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Array.from({ length: TOTAL_STICKERS }, (_, idx) => {
                const day = idx + 1;
                const isDownloadingThis = downloadingDay === day;
                return (
                  <div
                    key={day}
                    className="border border-[#E5EAE7] rounded-lg p-3 bg-[#F7FAF8] flex flex-col items-center text-center justify-between"
                  >
                    <div className="w-24 h-24 flex items-center justify-center">
                      <GingerbreadStickerSvg
                        id={`printable-sticker-svg-${day}`}
                        day={day}
                        showNumberBadge
                        cutOutline
                        className="w-24 h-24"
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#111827] mt-2 line-clamp-1">
                      {config.stickerNames[idx] || `Day ${day}`}
                    </p>
                    <button
                      type="button"
                      disabled={downloadingDay !== null}
                      onClick={async () => {
                        setStickerDownloadError(null);
                        setDownloadingDay(day);
                        try {
                          await downloadStickerSvgAsPng(
                            `printable-sticker-svg-${day}`,
                            `薑餅人貼紙_${day}.png`
                          );
                        } catch (err) {
                          setStickerDownloadError(
                            err instanceof Error
                              ? err.message
                              : '下載貼紙 PNG 失敗'
                          );
                        } finally {
                          setDownloadingDay(null);
                        }
                      }}
                      className="mt-2.5 w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#155E3A] bg-white border border-[#D1DDD6] hover:border-[#155E3A] hover:bg-[#F2F8F4] disabled:opacity-50 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {isDownloadingThis ? '產生中...' : `下載 ${day}.png`}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#E5EAE7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">
                  上傳紀錄審核清單（共 {filteredModSubmissions.length} 筆）
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  可將誤傳或無效的照片標記為「已駁回」，駁回後不計入該區排行榜總分。
                </p>
              </div>

              <div className="inline-flex items-center p-1 bg-[#F3F6F4] rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setModOfficeFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    modOfficeFilter === 'all'
                      ? 'bg-white text-[#155E3A] shadow-xs'
                      : 'text-[#526058]'
                  }`}
                >
                  全部
                </button>
                {(['taipei', 'hsinchu'] as OfficeId[]).map((officeKey) => (
                  <button
                    key={officeKey}
                    type="button"
                    onClick={() => setModOfficeFilter(officeKey)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      modOfficeFilter === officeKey
                        ? 'bg-white text-[#155E3A] shadow-xs'
                        : 'text-[#526058]'
                    }`}
                  >
                    {OFFICE_SHORT_LABELS[officeKey]}
                  </button>
                ))}
              </div>
            </div>

            {filteredModSubmissions.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#6B7280]">
                尚無符合條件的上傳紀錄。
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#E5EAE7] bg-[#F7FAF8] text-xs font-semibold text-[#155E3A]">
                      <th className="py-3 px-4">辦公室</th>
                      <th className="py-3 px-4">日期</th>
                      <th className="py-3 px-4">照片</th>
                      <th className="py-3 px-4">參賽名稱</th>
                      <th className="py-3 px-4">狀態</th>
                      <th className="py-3 px-4 text-right">管理操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5EAE7]">
                    {filteredModSubmissions.map((sub) => {
                      const subOffice = resolveSubmissionOffice(sub);
                      return (
                        <tr key={sub.id} className="hover:bg-[#F8FBF9]">
                          <td className="py-3 px-4 text-xs font-semibold text-[#111827]">
                            {OFFICE_SHORT_LABELS[subOffice]}
                          </td>
                          <td className="py-3 px-4 font-mono-num text-[#111827]">
                            Day {sub.stickerDay}
                          </td>
                          <td className="py-3 px-4">
                            <img
                              src={sub.imageDataUrl}
                              alt={sub.authorName}
                              referrerPolicy="no-referrer"
                              className="w-12 h-9 object-cover rounded-md border border-[#E5EAE7]"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[#111827]">
                              {sub.authorName}
                            </span>
                            {sub.isProxy && (
                              <span className="ml-2 text-xs text-[#6B7280]">
                                (代傳)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs font-semibold ${
                                sub.status === 'valid'
                                  ? 'text-[#155E3A]'
                                  : 'text-[#B91C1C]'
                              }`}
                            >
                              {sub.status === 'valid' ? '有效計分' : '已駁回'}
                            </span>
                            {sub.status === 'rejected' && (
                              <p
                                title={sub.rejectionReason || ''}
                                className="text-[11px] text-[#6B7280] mt-0.5 max-w-[200px] truncate"
                              >
                                原因：{sub.rejectionReason || '未填寫原因'}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (sub.status === 'valid') {
                                  setRejectTargetSub(sub);
                                  setRejectReason('');
                                  setRejectError(null);
                                } else {
                                  void onToggleSubmissionStatus(sub, 'valid', '');
                                }
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-[#111827] border border-[#D1DDD6] rounded-md hover:bg-[#F8FBF9]"
                            >
                              {sub.status === 'valid' ? '設為無效' : '恢復有效'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSubmission(sub)}
                              aria-label={`刪除 ${sub.authorName} 的紀錄`}
                              className="p-1.5 text-[#6B7280] hover:text-[#B91C1C] inline-flex align-middle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Rejection reason modal */}
          {rejectTargetSub && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="輸入設為無效原因"
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => {
                if (!rejectSubmitting) setRejectTargetSub(null);
              }}
            >
              <div
                className="bg-white border border-[#E5EAE7] rounded-xl max-w-md w-full shadow-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-[#E5EAE7] flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#111827]">
                      設為無效並填寫原因
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {OFFICE_SHORT_LABELS[resolveSubmissionOffice(rejectTargetSub)]}{' '}
                      · Day {rejectTargetSub.stickerDay} ·{' '}
                      {rejectTargetSub.authorName}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={rejectSubmitting}
                    onClick={() => setRejectTargetSub(null)}
                    aria-label="關閉視窗"
                    className="p-1.5 text-[#526058] hover:text-[#111827] rounded-lg hover:bg-[#F3F6F4]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = rejectReason.trim();
                    if (!trimmed) {
                      setRejectError('請輸入無效原因，讓同仁知道如何重新上傳。');
                      return;
                    }
                    setRejectError(null);
                    setRejectSubmitting(true);
                    try {
                      await onToggleSubmissionStatus(
                        rejectTargetSub,
                        'rejected',
                        trimmed
                      );
                      setRejectTargetSub(null);
                      setRejectReason('');
                    } catch (err) {
                      setRejectError(
                        err instanceof Error ? err.message : '操作失敗，請稍後再試。'
                      );
                    } finally {
                      setRejectSubmitting(false);
                    }
                  }}
                  className="p-5 space-y-4"
                >
                  {rejectError && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B]"
                    >
                      {rejectError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#F7FAF8] border border-[#E5EAE7]">
                    <img
                      src={rejectTargetSub.imageDataUrl}
                      alt={rejectTargetSub.authorName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-12 object-cover rounded border border-[#E5EAE7] shrink-0"
                    />
                    <div className="text-xs text-[#4B5563]">
                      <p className="font-semibold text-[#111827]">
                        {config.stickerNames[rejectTargetSub.stickerDay - 1] ||
                          `Day ${rejectTargetSub.stickerDay}`}
                      </p>
                      <p className="mt-0.5">
                        設為無效後將不計分，同仁可於打卡頁面查看原因並重新上傳。
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#111827] mb-1.5">
                      常用原因快速帶入：
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        '照片模糊無法辨識薑餅人款式',
                        '非本活動指定編號貼紙',
                        '非現場實拍或重複使用他人照片',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRejectReason(preset)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#374151] bg-[#F3F6F4] hover:bg-[#E5EAE7] rounded-md transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reject-reason-input"
                      className="block text-xs font-semibold text-[#111827] mb-1.5"
                    >
                      無效原因說明 <span className="text-[#B91C1C]">*</span>
                    </label>
                    <textarea
                      id="reject-reason-input"
                      rows={3}
                      required
                      maxLength={MAX_REJECTION_REASON_LENGTH}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="請說明為何此照片無效（同仁將可看到此說明）..."
                      className="w-full px-3 py-2 text-sm text-[#111827] border border-[#D1DDD6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B91C1C] resize-none"
                    />
                    <div className="text-right text-[11px] text-[#6B7280] mt-1 font-mono-num">
                      {rejectReason.length}/{MAX_REJECTION_REASON_LENGTH}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5EAE7]">
                    <button
                      type="button"
                      disabled={rejectSubmitting}
                      onClick={() => setRejectTargetSub(null)}
                      className="px-4 py-2 text-xs font-semibold text-[#4B5563] bg-white border border-[#D1DDD6] hover:bg-[#F8FBF9] rounded-lg"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={rejectSubmitting}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 rounded-lg"
                    >
                      {rejectSubmitting ? '處理中...' : '確認設為無效'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
