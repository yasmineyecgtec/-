import type { Timestamp } from 'firebase/firestore';

export const TOTAL_STICKERS = 7;

export type OfficeId = 'taipei' | 'hsinchu';

export const OFFICE_LABELS: Record<OfficeId, string> = {
  taipei: '台北辦公室',
  hsinchu: '新竹辦公室',
};

export const OFFICE_SHORT_LABELS: Record<OfficeId, string> = {
  taipei: '台北',
  hsinchu: '新竹',
};

// Synchronized verbatim with firebase-blueprint.json volumetric constraints
export const MAX_AUTHOR_NAME_LENGTH = 60;
export const MAX_DEPARTMENT_LENGTH = 60;
export const MAX_NOTE_LENGTH = 200;
export const MAX_REJECTION_REASON_LENGTH = 200;
export const MAX_IMAGE_DATA_URL_LENGTH = 450000;
export const MAX_TITLE_LENGTH = 80;
export const MAX_SUBTITLE_LENGTH = 200;
export const MAX_ADMIN_NOTE_LENGTH = 120;
export const MAX_INVITE_EMAIL_LENGTH = 128;

export function inviteIdForEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
}

export interface EventConfig {
  title: string;
  subtitle: string;
  basePoints: number;
  topN: number;
  topNBonus: number;
  stickerNames: string[];
  stickerHints: string[];
  stickerHintsTaipei?: string[];
  stickerHintsHsinchu?: string[];
  eventStartDate?: string;
  updatedAt?: Timestamp | null;
  updatedBy?: string;
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  title: '聖誕薑餅人尋寶賽',
  subtitle:
    '台北、新竹兩邊辦公室分開尋寶與獨立計分頒獎！找到 7 張限定薑餅人貼紙並上傳照片，每日最快回傳前 10 名再拿 100 分速報加碼！',
  basePoints: 50,
  topN: 10,
  topNBonus: 100,
  eventStartDate: '',
  stickerNames: [
    'Day 1 · 微笑領結薑餅人',
    'Day 2 · 拐杖糖果薑餅人',
    'Day 3 · 聖誕毛帽薑餅人',
    'Day 4 · 紅綠圍巾薑餅人',
    'Day 5 · 驚喜禮物薑餅人',
    'Day 6 · 麋鹿頭飾薑餅人',
    'Day 7 · 閃亮金星薑餅人',
  ],
  stickerHints: [
    '台北線索：請留意茶水間與公共白板周邊。',
    '台北線索：休息區書架或咖啡機附近的小角落。',
    '台北線索：會議室門牌與玻璃隔間貼飾附近。',
    '台北線索：影印區、文具櫃或包裹收發桌旁。',
    '台北線索：聖誕樹裝飾與節慶佈置區附近。',
    '台北線索：電梯廳海報牆或樓層指標附近。',
    '台北線索：終極壓軸！入口接待區周邊仔細找找看。',
  ],
  stickerHintsTaipei: [
    '台北線索：請留意茶水間與公共白板周邊。',
    '台北線索：休息區書架或咖啡機附近的小角落。',
    '台北線索：會議室門牌與玻璃隔間貼飾附近。',
    '台北線索：影印區、文具櫃或包裹收發桌旁。',
    '台北線索：聖誕樹裝飾與節慶佈置區附近。',
    '台北線索：電梯廳海報牆或樓層指標附近。',
    '台北線索：終極壓軸！入口接待區周邊仔細找找看。',
  ],
  stickerHintsHsinchu: [
    '新竹線索：茶水吧台或飲水機周邊留意看看。',
    '新竹線索：交誼區沙發旁或書報架角落。',
    '新竹線索：大型會議室門框與白板筆架附近。',
    '新竹線索：事務機列印區與儲物櫃側面。',
    '新竹線索：聖誕佈置牆面與打卡區周邊。',
    '新竹線索：梯廳公告欄或門禁感應器附近。',
    '新竹線索：終極壓軸！大廳櫃台與入口走廊周邊。',
  ],
};

export interface StickerSubmission {
  id: string;
  uid: string;
  authorName: string;
  department: string;
  office?: OfficeId;
  stickerDay: number;
  imageDataUrl: string;
  note: string;
  status: 'valid' | 'rejected';
  rejectionReason?: string;
  isProxy: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ScoredSubmission extends StickerSubmission {
  office: OfficeId;
  createdAtMs: number;
  dayRank: number;
  isTopN: boolean;
  basePointsEarned: number;
  bonusPointsEarned: number;
  totalPointsEarned: number;
}

export interface LeaderboardEntry {
  participantKey: string;
  authorName: string;
  department: string;
  office: OfficeId;
  totalScore: number;
  baseScoreTotal: number;
  bonusScoreTotal: number;
  foundCount: number;
  topNCount: number;
  latestSubmissionMs: number;
  submissionsByDay: Record<number, ScoredSubmission>;
}

export interface OfficeScoredData {
  scoredSubmissions: ScoredSubmission[];
  submissionsByDay: Record<number, ScoredSubmission[]>;
  leaderboard: LeaderboardEntry[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  department?: string;
  office?: OfficeId;
  updatedAt?: Timestamp | null;
}

export interface AdminUserRecord {
  uid: string;
  note?: string;
  createdAt?: Timestamp | null;
}

export interface AdminInviteRecord {
  id: string;
  email: string;
  note?: string;
  invitedBy: string;
  createdAt?: Timestamp | null;
}

export type ActiveTab = 'home' | 'leaderboard' | 'upload' | 'gallery' | 'rules';
