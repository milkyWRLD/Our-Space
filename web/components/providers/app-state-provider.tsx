"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { DEMO_STORAGE_KEY, demoState } from "@/lib/demo-data";
import { sanitizeUrl } from "@/lib/utils";
import type {
  AppState,
  AuthMode,
  NotificationType,
  PartnerNotification,
  UserProfile,
  Wish,
  WishFormValues,
} from "@/lib/types";

type AppStateContextValue = {
  state: AppState;
  currentUser: UserProfile | null;
  partnerUser: UserProfile | null;
  isConfigured: boolean;
  setAuthMode: (mode: AuthMode) => void;
  signIn: (email: string, mode: AuthMode) => void;
  switchUser: (userId: string) => void;
  addOrUpdateWish: (values: WishFormValues) => void;
  removeWish: (wishId: string) => void;
  toggleWishDone: (wishId: string, note?: string) => void;
  toggleWishLike: (wishId: string) => void;
  sendPartnerNotification: (type: NotificationType, message?: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  joinPartner: (email: string) => void;
  resetDemo: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createNotification(
  payload: Omit<PartnerNotification, "id" | "createdAt" | "read">,
): PartnerNotification {
  return {
    id: createId("notification"),
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  };
}

function getInitialState(): AppState {
  if (typeof window === "undefined") {
    return demoState;
  }

  const cached = window.localStorage.getItem(DEMO_STORAGE_KEY);

  if (!cached) {
    return demoState;
  }

  try {
    return JSON.parse(cached) as AppState;
  } catch {
    return demoState;
  }
}

function upsertUser(users: UserProfile[], email: string) {
  const existing = users.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (existing) {
    return existing;
  }

  const displayName = email.split("@")[0].slice(0, 16) || "You";

  return {
    id: createId("user"),
    email,
    displayName: displayName[0].toUpperCase() + displayName.slice(1),
    avatar: displayName[0]?.toUpperCase() || "Y",
    createdAt: new Date().toISOString(),
  };
}

function parseWishValues(values: WishFormValues, currentUserId: string): Wish {
  const now = new Date().toISOString();
  const images = values.imageUrls
    .split(/\r?\n|,/)
    .map((item) => sanitizeUrl(item.trim()))
    .filter(Boolean);
  const link = sanitizeUrl(values.link.trim());
  const hasLocation =
    values.locationName.trim() &&
    values.latitude.trim() &&
    values.longitude.trim();
  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);

  return {
    id: values.id || createId("wish"),
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    category: values.category,
    images,
    link: link || undefined,
    location: hasLocation
      ? {
          name: values.locationName.trim(),
          lat: Number.isFinite(latitude) ? latitude : 0,
          lng: Number.isFinite(longitude) ? longitude : 0,
        }
      : undefined,
    status: values.status,
    createdBy: currentUserId,
    createdAt: now,
    updatedAt: now,
    doneAt: values.status === "done" ? now : undefined,
    howItWent: values.howItWent.trim() || undefined,
    likedBy: [],
  };
}

export function AppStateProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<AppState>(getInitialState);
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const currentUser =
    state.users.find((user) => user.id === state.currentUserId) ?? null;
  const partnerUser =
    state.users.find((user) => user.id !== state.currentUserId) ?? null;

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      currentUser,
      partnerUser,
      isConfigured,
      setAuthMode(mode) {
        setState((prev) => ({ ...prev, authMode: mode }));
      },
      signIn(email, mode) {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          return;
        }

        setState((prev) => {
          const user = upsertUser(prev.users, cleanEmail);
          const userAlreadyExists = prev.users.some((item) => item.id === user.id);
          const users = userAlreadyExists ? prev.users : [...prev.users, user];
          const memberIds = prev.couple.memberIds.includes(user.id)
            ? prev.couple.memberIds
            : prev.couple.memberIds.length < 2
              ? [...prev.couple.memberIds, user.id]
              : prev.couple.memberIds;
          const status = memberIds.length === 2 ? "active" : "pending";

          return {
            ...prev,
            authMode: mode,
            currentUserId: user.id,
            users,
            couple: {
              ...prev.couple,
              memberIds,
              status,
            },
          };
        });
      },
      switchUser(userId) {
        setState((prev) => ({ ...prev, currentUserId: userId }));
      },
      addOrUpdateWish(values) {
        if (!state.currentUserId || !values.title.trim()) {
          return;
        }

        setState((prev) => {
          const existing = prev.wishes.find((wish) => wish.id === values.id);

          if (!existing) {
            return {
              ...prev,
              wishes: [
                parseWishValues(values, prev.currentUserId as string),
                ...prev.wishes,
              ],
            };
          }

          const images = values.imageUrls
            .split(/\r?\n|,/)
            .map((item) => sanitizeUrl(item.trim()))
            .filter(Boolean);
          const link = sanitizeUrl(values.link.trim());
          const latitude = Number(values.latitude);
          const longitude = Number(values.longitude);
          const hasLocation =
            values.locationName.trim() &&
            values.latitude.trim() &&
            values.longitude.trim();

          return {
            ...prev,
            wishes: prev.wishes.map((wish) =>
              wish.id === values.id
                ? {
                    ...wish,
                    title: values.title.trim(),
                    description: values.description.trim() || undefined,
                    category: values.category,
                    link: link || undefined,
                    images,
                    location: hasLocation
                      ? {
                          name: values.locationName.trim(),
                          lat: Number.isFinite(latitude) ? latitude : 0,
                          lng: Number.isFinite(longitude) ? longitude : 0,
                        }
                      : undefined,
                    status: values.status,
                    howItWent: values.howItWent.trim() || undefined,
                    doneAt:
                      values.status === "done"
                        ? wish.doneAt || new Date().toISOString()
                        : undefined,
                    updatedAt: new Date().toISOString(),
                  }
                : wish,
            ),
          };
        });
      },
      removeWish(wishId) {
        setState((prev) => ({
          ...prev,
          wishes: prev.wishes.filter((wish) => wish.id !== wishId),
        }));
      },
      toggleWishDone(wishId, note) {
        setState((prev) => {
          const wish = prev.wishes.find((item) => item.id === wishId);
          if (!wish || !prev.currentUserId || !partnerUser) {
            return prev;
          }

          const nextDone = wish.status !== "done";

          return {
            ...prev,
            wishes: prev.wishes.map((item) =>
              item.id === wishId
                ? {
                    ...item,
                    status: nextDone ? "done" : "planned",
                    doneAt: nextDone ? new Date().toISOString() : undefined,
                    howItWent:
                      nextDone && note?.trim()
                        ? note.trim()
                        : nextDone
                          ? item.howItWent
                          : undefined,
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
            notifications: [
              createNotification({
                type: "wish_done",
                fromUser: prev.currentUserId,
                toUser: partnerUser.id,
                message: nextDone ? `${wish.title} is now a memory.` : undefined,
              }),
              ...prev.notifications,
            ],
          };
        });
      },
      toggleWishLike(wishId) {
        setState((prev) => {
          if (!prev.currentUserId) {
            return prev;
          }

          const wish = prev.wishes.find((item) => item.id === wishId);
          if (!wish) {
            return prev;
          }

          const liked = wish.likedBy.includes(prev.currentUserId);
          const nextLikedBy = liked
            ? wish.likedBy.filter((userId) => userId !== prev.currentUserId)
            : [...wish.likedBy, prev.currentUserId];
          const notifications = !liked && wish.createdBy !== prev.currentUserId
            ? [
                createNotification({
                  type: "wish_liked",
                  fromUser: prev.currentUserId,
                  toUser: wish.createdBy,
                  message: `${wish.title} got a little heart.`,
                }),
                ...prev.notifications,
              ]
            : prev.notifications;

          return {
            ...prev,
            wishes: prev.wishes.map((item) =>
              item.id === wishId ? { ...item, likedBy: nextLikedBy } : item,
            ),
            notifications,
          };
        });
      },
      sendPartnerNotification(type, message) {
        setState((prev) => {
          if (!prev.currentUserId || !partnerUser) {
            return prev;
          }

          return {
            ...prev,
            notifications: [
              createNotification({
                type,
                message: message?.trim() || undefined,
                fromUser: prev.currentUserId,
                toUser: partnerUser.id,
              }),
              ...prev.notifications,
            ],
          };
        });
      },
      markNotificationRead(notificationId) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((item) =>
            item.id === notificationId ? { ...item, read: true } : item,
          ),
        }));
      },
      markAllNotificationsRead() {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((item) =>
            item.toUser === prev.currentUserId ? { ...item, read: true } : item,
          ),
        }));
      },
      joinPartner(email) {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          return;
        }

        setState((prev) => {
          const user = upsertUser(prev.users, cleanEmail);
          const userAlreadyExists = prev.users.some((item) => item.id === user.id);
          const users = userAlreadyExists ? prev.users : [...prev.users, user];
          const memberIds = prev.couple.memberIds.includes(user.id)
            ? prev.couple.memberIds
            : prev.couple.memberIds.length < 2
              ? [...prev.couple.memberIds, user.id]
              : prev.couple.memberIds;

          return {
            ...prev,
            users,
            couple: {
              ...prev.couple,
              memberIds,
              status: memberIds.length === 2 ? "active" : "pending",
            },
          };
        });
      },
      resetDemo() {
        setState(demoState);
      },
    }),
    [currentUser, isConfigured, partnerUser, state],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}
