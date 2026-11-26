import { useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  ActiveTab,
  AdminInviteRecord,
  AdminUserRecord,
  DEFAULT_EVENT_CONFIG,
  EventConfig,
  inviteIdForEmail,
  MAX_ADMIN_NOTE_LENGTH,
  MAX_AUTHOR_NAME_LENGTH,
  MAX_DEPARTMENT_LENGTH,
  MAX_INVITE_EMAIL_LENGTH,
  MAX_REJECTION_REASON_LENGTH,
  OFFICE_LABELS,
  OfficeId,
  ScoredSubmission,
  StickerSubmission,
  TOTAL_STICKERS,
  UserProfile,
} from './types';
import { computeScoredData } from './utils/scoring';
import { Header } from './components/Header';
import { WelcomeGate } from './components/WelcomeGate';
import { HomeView } from './components/HomeView';
import { LeaderboardView } from './components/LeaderboardView';
import { StickerCheckinView } from './components/StickerCheckinView';
import { PhotoGalleryView } from './components/PhotoGalleryView';
import { AdminRulesView } from './components/AdminRulesView';
import { SubmissionModal } from './components/SubmissionModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { ProfileModal } from './components/ProfileModal';

const BOOTSTRAP_ADMIN_EMAIL = 'yasmineye.cgtec@gmail.com';

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminInvites, setAdminInvites] = useState<AdminInviteRecord[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [eventConfig, setEventConfig] = useState<EventConfig>(DEFAULT_EVENT_CONFIG);
  const [submissions, setSubmissions] = useState<StickerSubmission[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadModalDay, setUploadModalDay] = useState<number>(1);
  const [editingSubmission, setEditingSubmission] =
    useState<StickerSubmission | null>(null);
  const [lightboxState, setLightboxState] = useState<{
    submission: ScoredSubmission;
    allowUnblurred: boolean;
  } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setIsAdmin(false);
        setAdminUsers([]);
        setAdminInvites([]);
        setRegisteredUsers([]);
        setUserProfile(null);
        setSubmissions([]);
        setLoadingData(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Resolve admin status & user profile when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    let cancelled = false;
    const initUser = async () => {
      const normalizedEmail = user.email?.trim().toLowerCase() || '';
      let adminFlag =
        user.emailVerified && normalizedEmail === BOOTSTRAP_ADMIN_EMAIL;

      if (!adminFlag) {
        const adminPath = `admins/${user.uid}`;
        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          if (adminSnap.exists()) {
            adminFlag = true;
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, adminPath);
        }
      }

      if (!adminFlag && user.emailVerified && normalizedEmail) {
        const inviteId = inviteIdForEmail(normalizedEmail);
        if (inviteId && inviteId.length <= MAX_INVITE_EMAIL_LENGTH) {
          const invitePath = `adminInvites/${inviteId}`;
          try {
            const inviteSnap = await getDoc(doc(db, 'adminInvites', inviteId));
            if (
              inviteSnap.exists() &&
              inviteSnap.data().email === normalizedEmail
            ) {
              adminFlag = true;
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, invitePath);
          }
        }
      }

      if (!cancelled) {
        setIsAdmin(adminFlag);
      }

      const profilePath = `users/${user.uid}`;
      try {
        const profileSnap = await getDoc(doc(db, 'users', user.uid));
        if (profileSnap.exists()) {
          if (!cancelled) {
            setUserProfile(profileSnap.data() as UserProfile);
          }
        } else {
          const fallbackName = (
            user.displayName ||
            user.email?.split('@')[0] ||
            '同仁'
          ).slice(0, 60);
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: fallbackName,
            department: '',
            office: 'taipei',
          };
          await setDoc(doc(db, 'users', user.uid), {
            ...newProfile,
            updatedAt: serverTimestamp(),
          });
          if (!cancelled) {
            setUserProfile(newProfile);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, profilePath);
      }
    };

    void initUser();
    return () => {
      cancelled = true;
    };
  }, [authReady, user]);

  // Public real-time listener for eventConfig/main (active before and after sign-in)
  useEffect(() => {
    if (!authReady) return;

    const configPath = 'eventConfig/main';
    const unsubConfig = onSnapshot(
      doc(db, 'eventConfig', 'main'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as EventConfig;
          setEventConfig({
            ...DEFAULT_EVENT_CONFIG,
            ...data,
            stickerNames:
              Array.isArray(data.stickerNames) &&
              data.stickerNames.length === TOTAL_STICKERS
                ? data.stickerNames
                : DEFAULT_EVENT_CONFIG.stickerNames,
            stickerHints:
              Array.isArray(data.stickerHints) &&
              data.stickerHints.length === TOTAL_STICKERS
                ? data.stickerHints
                : DEFAULT_EVENT_CONFIG.stickerHints,
            stickerHintsTaipei:
              Array.isArray(data.stickerHintsTaipei) &&
              data.stickerHintsTaipei.length === TOTAL_STICKERS
                ? data.stickerHintsTaipei
                : Array.isArray(data.stickerHints) &&
                    data.stickerHints.length === TOTAL_STICKERS
                  ? data.stickerHints
                  : DEFAULT_EVENT_CONFIG.stickerHintsTaipei,
            stickerHintsHsinchu:
              Array.isArray(data.stickerHintsHsinchu) &&
              data.stickerHintsHsinchu.length === TOTAL_STICKERS
                ? data.stickerHintsHsinchu
                : DEFAULT_EVENT_CONFIG.stickerHintsHsinchu,
          });
        } else {
          setEventConfig(DEFAULT_EVENT_CONFIG);
        }
      },
      (err) => {
        if (!auth.currentUser) {
          console.warn('Public eventConfig read fallback:', err);
          setEventConfig(DEFAULT_EVENT_CONFIG);
          return;
        }
        handleFirestoreError(err, OperationType.GET, configPath);
      }
    );

    return () => {
      unsubConfig();
    };
  }, [authReady]);

  // Real-time Firestore listener for submissions (only active when authenticated)
  useEffect(() => {
    if (!authReady || !user) return;

    setLoadingData(true);

    if (isAdmin) {
      const unsubAll = onSnapshot(
        collection(db, 'submissions'),
        (snap) => {
          const list: StickerSubmission[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<StickerSubmission, 'id'>),
          }));
          setSubmissions(list);
          setLoadingData(false);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, 'submissions');
        }
      );

      return () => {
        unsubAll();
      };
    }

    let validMap = new Map<string, StickerSubmission>();
    let myMap = new Map<string, StickerSubmission>();
    let validLoaded = false;
    let myLoaded = false;

    const syncMerged = () => {
      const merged = new Map<string, StickerSubmission>();
      for (const [id, item] of validMap) {
        merged.set(id, item);
      }
      for (const [id, item] of myMap) {
        merged.set(id, item);
      }
      setSubmissions(Array.from(merged.values()));
      if (validLoaded && myLoaded) {
        setLoadingData(false);
      }
    };

    const unsubValid = onSnapshot(
      query(collection(db, 'submissions'), where('status', '==', 'valid')),
      (snap) => {
        const nextMap = new Map<string, StickerSubmission>();
        for (const d of snap.docs) {
          nextMap.set(d.id, {
            id: d.id,
            ...(d.data() as Omit<StickerSubmission, 'id'>),
          });
        }
        validMap = nextMap;
        validLoaded = true;
        syncMerged();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'submissions');
      }
    );

    const unsubMine = onSnapshot(
      query(collection(db, 'submissions'), where('uid', '==', user.uid)),
      (snap) => {
        const nextMap = new Map<string, StickerSubmission>();
        for (const d of snap.docs) {
          nextMap.set(d.id, {
            id: d.id,
            ...(d.data() as Omit<StickerSubmission, 'id'>),
          });
        }
        myMap = nextMap;
        myLoaded = true;
        syncMerged();
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'submissions');
      }
    );

    return () => {
      unsubValid();
      unsubMine();
    };
  }, [authReady, user, isAdmin]);

  // Admin-only listeners for co-admin registry & user directory
  useEffect(() => {
    if (!authReady || !user || !isAdmin) {
      setAdminUsers([]);
      setAdminInvites([]);
      setRegisteredUsers([]);
      return;
    }

    const unsubAdmins = onSnapshot(
      collection(db, 'admins'),
      (snap) => {
        setAdminUsers(
          snap.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as Omit<AdminUserRecord, 'uid'>),
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'admins');
      }
    );

    const unsubInvites = onSnapshot(
      collection(db, 'adminInvites'),
      (snap) => {
        setAdminInvites(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<AdminInviteRecord, 'id'>),
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'adminInvites');
      }
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        setRegisteredUsers(
          snap.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as Omit<UserProfile, 'uid'>),
          }))
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
    );

    return () => {
      unsubAdmins();
      unsubInvites();
      unsubUsers();
    };
  }, [authReady, user, isAdmin]);

  const { byOffice, allScoredSubmissions } = useMemo(
    () => computeScoredData(submissions, eventConfig),
    [submissions, eventConfig]
  );

  // Current user's own (non-proxy) valid & rejected submissions mapped by stickerDay (1..7)
  const mySubmissionsByDay = useMemo(() => {
    const map: Record<number, ScoredSubmission> = {};
    if (!user) return map;
    for (const sub of allScoredSubmissions) {
      if (sub.uid === user.uid && !sub.isProxy) {
        map[sub.stickerDay] = sub;
      }
    }
    return map;
  }, [allScoredSubmissions, user]);

  const myRejectedByDay = useMemo(() => {
    const map: Record<number, StickerSubmission> = {};
    if (!user) return map;
    for (const sub of submissions) {
      if (sub.uid === user.uid && !sub.isProxy && sub.status === 'rejected') {
        map[sub.stickerDay] = sub;
      }
    }
    return map;
  }, [submissions, user]);

  const defaultAuthorName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    '';
  const defaultDepartment = userProfile?.department || '';
  const userOffice: OfficeId =
    userProfile?.office === 'hsinchu' ? 'hsinchu' : 'taipei';

  const handleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google 登入失敗';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError(`登入失敗：${msg}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleOpenUpload = (
    day?: number,
    existing: StickerSubmission | null = null
  ) => {
    const nextDay =
      day ??
      ([1, 2, 3, 4, 5, 6, 7].find((d) => !mySubmissionsByDay[d]) || 1);
    const matchedExisting =
      existing ??
      mySubmissionsByDay[nextDay] ??
      myRejectedByDay[nextDay] ??
      null;
    setUploadModalDay(nextDay);
    setEditingSubmission(matchedExisting);
    setUploadModalOpen(true);
  };

  const handleSaveProfile = async (
    name: string,
    department: string,
    office: OfficeId
  ) => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name,
        department,
        office,
        email: user.email || '',
        updatedAt: serverTimestamp(),
      });
      setUserProfile((prev) =>
        prev
          ? { ...prev, displayName: name, department, office }
          : {
              uid: user.uid,
              email: user.email || '',
              displayName: name,
              department,
              office,
            }
      );

      // Sync updated participant name, department & office across existing self-submissions
      const ownSubs = Object.values(mySubmissionsByDay);
      if (ownSubs.length > 0) {
        await Promise.all(
          ownSubs.map((sub) =>
            updateDoc(doc(db, 'submissions', sub.id), {
              authorName: name,
              department,
              office,
              updatedAt: serverTimestamp(),
            })
          )
        );
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleSubmitSticker = async (payload: {
    stickerDay: number;
    authorName: string;
    department: string;
    office: OfficeId;
    note: string;
    imageDataUrl: string;
    photoChanged: boolean;
    isProxy: boolean;
    editingId: string | null;
  }) => {
    if (!user) return;

    const safeAuthorName = (
      payload.authorName ||
      defaultAuthorName ||
      user.email?.split('@')[0] ||
      '同仁'
    )
      .trim()
      .slice(0, MAX_AUTHOR_NAME_LENGTH);
    const safeDepartment = (payload.department ?? defaultDepartment)
      .trim()
      .slice(0, MAX_DEPARTMENT_LENGTH);
    const docId = payload.editingId || `${user.uid}_day${payload.stickerDay}`;
    const path = `submissions/${docId}`;

    let existingStatus: 'valid' | 'rejected' | null =
      submissions.find((s) => s.id === docId)?.status ?? null;

    if (!existingStatus) {
      try {
        const snap = await getDoc(doc(db, 'submissions', docId));
        if (snap.exists()) {
          const data = snap.data() as Partial<StickerSubmission>;
          existingStatus = data.status === 'rejected' ? 'rejected' : 'valid';
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    }

    if (existingStatus) {
      try {
        if (existingStatus === 'rejected') {
          await updateDoc(doc(db, 'submissions', docId), {
            status: 'valid',
            rejectionReason: '',
            authorName: safeAuthorName,
            department: safeDepartment,
            office: userOffice,
            note: payload.note,
            imageDataUrl: payload.imageDataUrl,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'submissions', docId), {
            authorName: safeAuthorName,
            department: safeDepartment,
            office: userOffice,
            note: payload.note,
            imageDataUrl: payload.imageDataUrl,
            updatedAt: serverTimestamp(),
            ...(payload.photoChanged ? { createdAt: serverTimestamp() } : {}),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
      return;
    }

    try {
      await setDoc(doc(db, 'submissions', docId), {
        uid: user.uid,
        authorName: safeAuthorName,
        department: safeDepartment,
        office: userOffice,
        stickerDay: payload.stickerDay,
        imageDataUrl: payload.imageDataUrl,
        note: payload.note,
        status: 'valid',
        rejectionReason: '',
        isProxy: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleDeleteSubmission = async (sub: StickerSubmission) => {
    const path = `submissions/${sub.id}`;
    try {
      await deleteDoc(doc(db, 'submissions', sub.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleSaveConfig = async (nextConfig: EventConfig) => {
    if (!user) return;
    const path = 'eventConfig/main';
    try {
      await setDoc(doc(db, 'eventConfig', 'main'), {
        title: nextConfig.title,
        subtitle: nextConfig.subtitle,
        basePoints: nextConfig.basePoints,
        topN: nextConfig.topN,
        topNBonus: nextConfig.topNBonus,
        eventStartDate: nextConfig.eventStartDate || '',
        stickerNames: nextConfig.stickerNames,
        stickerHints: nextConfig.stickerHints,
        stickerHintsTaipei:
          nextConfig.stickerHintsTaipei || nextConfig.stickerHints,
        stickerHintsHsinchu:
          nextConfig.stickerHintsHsinchu || nextConfig.stickerHints,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleToggleSubmissionStatus = async (
    sub: StickerSubmission,
    nextStatus: 'valid' | 'rejected',
    rejectionReason?: string
  ) => {
    const path = `submissions/${sub.id}`;
    try {
      await updateDoc(doc(db, 'submissions', sub.id), {
        status: nextStatus,
        rejectionReason:
          nextStatus === 'rejected'
            ? (rejectionReason || '').trim().slice(0, MAX_REJECTION_REASON_LENGTH)
            : '',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddCoAdminByEmail = async (email: string, note: string) => {
    if (!user) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (
      !normalizedEmail ||
      normalizedEmail.length < 3 ||
      normalizedEmail.length > MAX_INVITE_EMAIL_LENGTH ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      throw new Error('請輸入有效的 Google Email 地址。');
    }
    if (normalizedEmail === BOOTSTRAP_ADMIN_EMAIL) {
      throw new Error('此信箱已是系統預設主管理員。');
    }

    const inviteId = inviteIdForEmail(normalizedEmail);
    const path = `adminInvites/${inviteId}`;
    try {
      await setDoc(doc(db, 'adminInvites', inviteId), {
        email: normalizedEmail,
        note: note.trim().slice(0, MAX_ADMIN_NOTE_LENGTH),
        invitedBy: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleGrantCoAdminByUid = async (
    targetUser: UserProfile,
    note: string
  ) => {
    if (!user) return;
    const normalizedEmail = targetUser.email.trim().toLowerCase();
    if (normalizedEmail === BOOTSTRAP_ADMIN_EMAIL) {
      throw new Error('此信箱已是系統預設主管理員。');
    }
    const path = `admins/${targetUser.uid}`;
    try {
      await setDoc(doc(db, 'admins', targetUser.uid), {
        uid: targetUser.uid,
        note: (
          note.trim() ||
          `${targetUser.displayName}${targetUser.email ? ` (${targetUser.email})` : ''}`
        ).slice(0, MAX_ADMIN_NOTE_LENGTH),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleRevokeCoAdmin = async (options: {
    uid?: string;
    inviteId?: string;
    email?: string;
  }) => {
    if (!user) return;
    const currentEmail = user.email?.trim().toLowerCase() || '';
    if (
      options.uid === user.uid ||
      (options.email && options.email.toLowerCase() === currentEmail)
    ) {
      throw new Error('無法移除自己目前的管理員權限。');
    }
    if (options.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL) {
      throw new Error('系統預設主管理員不可移除。');
    }

    if (options.uid) {
      const path = `admins/${options.uid}`;
      try {
        await deleteDoc(doc(db, 'admins', options.uid));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }

    if (options.inviteId) {
      const path = `adminInvites/${options.inviteId}`;
      try {
        await deleteDoc(doc(db, 'adminInvites', options.inviteId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      <Header
        brandTitle={eventConfig.title}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isAuthenticated={Boolean(user)}
        isSigningIn={isSigningIn}
        onPrimaryAction={() => {
          if (user) {
            handleOpenUpload();
          } else {
            void handleSignIn();
          }
        }}
      />

      {!authReady ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-4">
            <div className="h-8 w-64 bg-[#F3F6F4] rounded-lg animate-pulse" />
            <div className="h-64 bg-white border border-[#E5EAE7] rounded-xl animate-pulse" />
          </div>
        </main>
      ) : !user ? (
        <div className="flex-1">
          <WelcomeGate
            config={eventConfig}
            onSignIn={handleSignIn}
            isSigningIn={isSigningIn}
            authError={authError}
          />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            {activeTab !== 'home' ? (
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] font-display tracking-tight text-balance">
                  {activeTab === 'leaderboard' && '台北 · 新竹分區總分排行榜'}
                  {activeTab === 'upload' && '我的 7 日薑餅人打卡卡'}
                  {activeTab === 'gallery' && '全公司貼紙照片保存牆'}
                  {activeTab === 'rules' && '活動計分規則與兩地線索'}
                </h1>
                <p className="text-sm text-[#4B5563] mt-1">
                  {activeTab === 'leaderboard' &&
                    `台北與新竹分開排名頒獎；每張基礎 ${eventConfig.basePoints} 分，各區前 ${eventConfig.topN} 名加碼 +${eventConfig.topNBonus} 分`}
                  {activeTab === 'upload' &&
                    '選擇每日找到的薑餅人貼紙上傳照片，系統將依您設定的辦公室分流計分'}
                  {activeTab === 'gallery' &&
                    '可依台北或新竹辦公室篩選照片，點擊可放大檢視或下載保存原圖'}
                  {activeTab === 'rules' &&
                    '查看完整計分公式與台北、新竹兩地 7 張貼紙尋找線索'}
                </p>
              </div>
            ) : (
              <div />
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280] font-mono-num">
              <span>
                參賽名稱：{defaultAuthorName} · {OFFICE_LABELS[userOffice]}
                {isAdmin ? ' · 活動管理員' : ''}
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="text-[#155E3A] font-semibold hover:underline"
              >
                設定參賽名稱
              </button>
              {activeTab !== 'home' && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('home')}
                    className="text-[#B91C1C] font-semibold hover:underline"
                  >
                    回到首頁
                  </button>
                </>
              )}
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[#526058] hover:text-[#111827] hover:underline"
              >
                登出帳號
              </button>
            </div>
          </div>

          {activeTab === 'home' && (
            <HomeView
              config={eventConfig}
              authorName={defaultAuthorName}
              userOffice={userOffice}
              mySubmissionsByDay={mySubmissionsByDay}
              myRejectedByDay={myRejectedByDay}
              byOffice={byOffice}
              totalValidCount={allScoredSubmissions.length}
              onNavigate={setActiveTab}
              onOpenUpload={(day) => handleOpenUpload(day, null)}
              onOpenProfile={() => setProfileModalOpen(true)}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              config={eventConfig}
              byOffice={byOffice}
              defaultOffice={userOffice}
              loading={loadingData}
              onOpenUpload={(day) => handleOpenUpload(day, null)}
              onInspectPhoto={(sub) =>
                setLightboxState({ submission: sub, allowUnblurred: false })
              }
            />
          )}

          {activeTab === 'upload' && (
            <StickerCheckinView
              config={eventConfig}
              userEmail={user.email || ''}
              authorName={defaultAuthorName}
              department={defaultDepartment}
              userOffice={userOffice}
              mySubmissionsByDay={mySubmissionsByDay}
              myRejectedByDay={myRejectedByDay}
              onSaveProfile={handleSaveProfile}
              onOpenUpload={handleOpenUpload}
              onDeleteSubmission={handleDeleteSubmission}
              onInspectPhoto={(sub) =>
                setLightboxState({ submission: sub, allowUnblurred: true })
              }
              onSignOut={handleSignOut}
            />
          )}

          {activeTab === 'gallery' && (
            <PhotoGalleryView
              config={eventConfig}
              submissions={allScoredSubmissions}
              onInspectPhoto={(sub) =>
                setLightboxState({ submission: sub, allowUnblurred: false })
              }
              onOpenUpload={(day) => handleOpenUpload(day, null)}
            />
          )}

          {activeTab === 'rules' && (
            <AdminRulesView
              config={eventConfig}
              userOffice={userOffice}
              isAdmin={isAdmin}
              currentUserUid={user.uid}
              currentUserEmail={user.email || ''}
              bootstrapAdminEmail={BOOTSTRAP_ADMIN_EMAIL}
              allSubmissions={submissions}
              adminUsers={adminUsers}
              adminInvites={adminInvites}
              registeredUsers={registeredUsers}
              onSaveConfig={handleSaveConfig}
              onToggleSubmissionStatus={handleToggleSubmissionStatus}
              onDeleteSubmission={handleDeleteSubmission}
              onAddCoAdminByEmail={handleAddCoAdminByEmail}
              onGrantCoAdminByUid={handleGrantCoAdminByUid}
              onRevokeCoAdmin={handleRevokeCoAdmin}
            />
          )}
        </main>
      )}

      <footer className="border-t border-[#E5EAE7] bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B7280]">
          <span>{eventConfig.title} · 台北 / 新竹雙辦公室聖誕尋寶活動</span>
          <span>
            規則：7 張貼紙 · 各區每日前 {eventConfig.topN} 名 +
            {eventConfig.topNBonus} 分
          </span>
        </div>
      </footer>

      <SubmissionModal
        isOpen={uploadModalOpen}
        initialDay={uploadModalDay}
        existingSubmission={editingSubmission}
        defaultAuthorName={defaultAuthorName}
        defaultDepartment={defaultDepartment}
        defaultOffice={userOffice}
        config={eventConfig}
        mySubmissionsByDay={mySubmissionsByDay}
        myRejectedByDay={myRejectedByDay}
        onClose={() => setUploadModalOpen(false)}
        onSubmit={handleSubmitSticker}
      />

      <PhotoLightbox
        submission={lightboxState?.submission ?? null}
        config={eventConfig}
        allowUnblurred={lightboxState?.allowUnblurred ?? false}
        onClose={() => setLightboxState(null)}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        currentName={defaultAuthorName}
        currentDepartment={defaultDepartment}
        currentOffice={userOffice}
        userEmail={user?.email || ''}
        onClose={() => setProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
