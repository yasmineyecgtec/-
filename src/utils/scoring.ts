import {
  EventConfig,
  LeaderboardEntry,
  OFFICE_LABELS,
  OfficeId,
  OfficeScoredData,
  ScoredSubmission,
  StickerSubmission,
  TOTAL_STICKERS,
} from '../types';

export function resolveSubmissionOffice(sub: StickerSubmission): OfficeId {
  return sub.office === 'hsinchu' ? 'hsinchu' : 'taipei';
}

export function getOfficeHints(config: EventConfig, office: OfficeId): string[] {
  if (office === 'hsinchu') {
    if (
      Array.isArray(config.stickerHintsHsinchu) &&
      config.stickerHintsHsinchu.length === TOTAL_STICKERS
    ) {
      return config.stickerHintsHsinchu;
    }
    return config.stickerHints;
  }
  if (
    Array.isArray(config.stickerHintsTaipei) &&
    config.stickerHintsTaipei.length === TOTAL_STICKERS
  ) {
    return config.stickerHintsTaipei;
  }
  return config.stickerHints;
}

const DEFAULT_BONUS_CLAUSE_REGEX =
  /每日最快回傳前\s*\d+\s*名再拿\s*\d+\s*分速報加碼/;

export function isAutoSyncedSubtitle(subtitle: string): boolean {
  return typeof subtitle === 'string' && DEFAULT_BONUS_CLAUSE_REGEX.test(subtitle);
}

export function syncSubtitleWithBonus(
  subtitle: string,
  topN: number,
  topNBonus: number
): string {
  const safeSubtitle = typeof subtitle === 'string' ? subtitle : '';
  if (!DEFAULT_BONUS_CLAUSE_REGEX.test(safeSubtitle)) {
    return safeSubtitle;
  }
  return safeSubtitle.replace(
    DEFAULT_BONUS_CLAUSE_REGEX,
    `每日最快回傳前 ${topN} 名再拿 ${topNBonus} 分速報加碼`
  );
}

export function formatEventSubtitle(config: EventConfig): string {
  return syncSubtitleWithBonus(
    config?.subtitle ?? '',
    Number.isFinite(config?.topN) ? config.topN : 10,
    Number.isFinite(config?.topNBonus) ? config.topNBonus : 100
  );
}

function computeOfficeScoredData(
  officeSubmissions: StickerSubmission[],
  config: EventConfig,
  office: OfficeId
): OfficeScoredData {
  const validSubs = officeSubmissions.filter((s) => s.status === 'valid');

  const dayBuckets: Record<number, StickerSubmission[]> = {};
  for (let d = 1; d <= TOTAL_STICKERS; d++) {
    dayBuckets[d] = [];
  }

  for (const sub of validSubs) {
    if (sub.stickerDay >= 1 && sub.stickerDay <= TOTAL_STICKERS) {
      dayBuckets[sub.stickerDay].push(sub);
    }
  }

  const scoredSubmissions: ScoredSubmission[] = [];
  const submissionsByDay: Record<number, ScoredSubmission[]> = {};

  for (let d = 1; d <= TOTAL_STICKERS; d++) {
    const sorted = [...dayBuckets[d]].sort((a, b) => {
      const aMs = a.createdAt ? a.createdAt.toMillis() : Number.MAX_SAFE_INTEGER;
      const bMs = b.createdAt ? b.createdAt.toMillis() : Number.MAX_SAFE_INTEGER;
      if (aMs !== bMs) return aMs - bMs;
      return a.id.localeCompare(b.id);
    });

    submissionsByDay[d] = sorted.map((sub, idx) => {
      const dayRank = idx + 1;
      const isTopN = dayRank <= config.topN;
      const basePointsEarned = config.basePoints;
      const bonusPointsEarned = isTopN ? config.topNBonus : 0;
      const scored: ScoredSubmission = {
        ...sub,
        office,
        createdAtMs: sub.createdAt ? sub.createdAt.toMillis() : Date.now(),
        dayRank,
        isTopN,
        basePointsEarned,
        bonusPointsEarned,
        totalPointsEarned: basePointsEarned + bonusPointsEarned,
      };
      scoredSubmissions.push(scored);
      return scored;
    });
  }

  const participantMap = new Map<string, LeaderboardEntry>();

  for (const scored of scoredSubmissions) {
    const key = scored.isProxy
      ? `proxy:${office}:${scored.authorName.trim().toLowerCase()}`
      : `uid:${office}:${scored.uid}`;

    const existing = participantMap.get(key);
    if (!existing) {
      participantMap.set(key, {
        participantKey: key,
        authorName: scored.authorName.trim(),
        department: scored.department.trim(),
        office,
        totalScore: scored.totalPointsEarned,
        baseScoreTotal: scored.basePointsEarned,
        bonusScoreTotal: scored.bonusPointsEarned,
        foundCount: 1,
        topNCount: scored.isTopN ? 1 : 0,
        latestSubmissionMs: scored.createdAtMs,
        submissionsByDay: {
          [scored.stickerDay]: scored,
        },
      });
    } else {
      existing.totalScore += scored.totalPointsEarned;
      existing.baseScoreTotal += scored.basePointsEarned;
      existing.bonusScoreTotal += scored.bonusPointsEarned;
      if (!existing.submissionsByDay[scored.stickerDay]) {
        existing.foundCount += 1;
      }
      if (scored.isTopN) {
        existing.topNCount += 1;
      }
      if (scored.createdAtMs >= existing.latestSubmissionMs) {
        existing.latestSubmissionMs = scored.createdAtMs;
        existing.authorName = scored.authorName.trim();
        if (scored.department.trim()) {
          existing.department = scored.department.trim();
        }
      }
      existing.submissionsByDay[scored.stickerDay] = scored;
    }
  }

  const leaderboard = Array.from(participantMap.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.foundCount !== a.foundCount) return b.foundCount - a.foundCount;
    if (b.topNCount !== a.topNCount) return b.topNCount - a.topNCount;
    return a.latestSubmissionMs - b.latestSubmissionMs;
  });

  return { scoredSubmissions, submissionsByDay, leaderboard };
}

export function computeScoredData(
  submissions: StickerSubmission[],
  config: EventConfig
): {
  byOffice: Record<OfficeId, OfficeScoredData>;
  allScoredSubmissions: ScoredSubmission[];
} {
  const taipeiRaw = submissions.filter(
    (s) => resolveSubmissionOffice(s) === 'taipei'
  );
  const hsinchuRaw = submissions.filter(
    (s) => resolveSubmissionOffice(s) === 'hsinchu'
  );

  const taipei = computeOfficeScoredData(taipeiRaw, config, 'taipei');
  const hsinchu = computeOfficeScoredData(hsinchuRaw, config, 'hsinchu');

  return {
    byOffice: { taipei, hsinchu },
    allScoredSubmissions: [...taipei.scoredSubmissions, ...hsinchu.scoredSubmissions],
  };
}

export function formatTimestamp(ms: number): string {
  if (!ms || ms >= Number.MAX_SAFE_INTEGER) return '—';
  return new Intl.DateTimeFormat('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

export function exportLeaderboardCsv(
  leaderboard: LeaderboardEntry[],
  config: EventConfig,
  office: OfficeId
): void {
  const officeLabel = OFFICE_LABELS[office];
  const headers = [
    '辦公室',
    '名次',
    '參賽名稱',
    '部門',
    '總分',
    '已找到張數',
    `前${config.topN}名次數`,
    '基礎分小計',
    '速報加分小計',
    ...Array.from({ length: TOTAL_STICKERS }, (_, i) => `Day ${i + 1} 名次/得分`),
  ];

  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leaderboard.map((entry, index) => {
    const dayCells = Array.from({ length: TOTAL_STICKERS }, (_, i) => {
      const sub = entry.submissionsByDay[i + 1];
      if (!sub) return '未上傳';
      return `第${sub.dayRank}名 (${sub.totalPointsEarned}分)`;
    });
    return [
      officeLabel,
      index + 1,
      entry.authorName,
      entry.department || '-',
      entry.totalScore,
      `${entry.foundCount}/${TOTAL_STICKERS}`,
      entry.topNCount,
      entry.baseScoreTotal,
      entry.bonusScoreTotal,
      ...dayCells,
    ]
      .map(escapeCell)
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCell).join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `薑餅人尋寶賽_${officeLabel}_總分統計_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
