"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarCheck2,
  ChevronRight,
  Copy,
  Dices,
  ExternalLink,
  Heart,
  Home,
  MapPin,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Screen = "home" | "add" | "notifications" | "completed" | "map" | "profile";
type HomeMode = "places" | "wishes";
type MapMode = "all" | "planned" | "done";
type WishCategory = "place" | "wish";
type NotificationType = "miss_you" | "thinking" | "custom" | "wish_done";

type WishItem = {
  id: string;
  title: string;
  description: string;
  category: WishCategory;
  location: string;
  link: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string;
  isPinned: boolean;
  plannedFor: string | null;
  status: "planned" | "done";
  createdAt: string;
};

type NotificationItem = {
  id: string;
  type: NotificationType;
  message: string;
  fromUser: string;
  toUser: string;
  createdAt: string;
  readAt: string | null;
};

type ToastItem = {
  id: string;
  title: string;
  tone: "success" | "error" | "info";
};

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
};

const WishesMap = dynamic(
  () => import("@/components/app/wishes-map").then((module) => module.WishesMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[16px] border border-white/60 bg-white/65 p-4 text-center text-sm text-slate-600">
        Загружаем карту...
      </div>
    ),
  },
);

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const initialCards: WishItem[] = [
  {
    id: "wish-1",
    title: "Романтический ужин",
    description: "Закат, красивый вид и вкусный десерт.",
    category: "place",
    location: "Ресторан у моря",
    link: "",
    latitude: 43.5853,
    longitude: 39.7231,
    imageUrl: "",
    isPinned: false,
    plannedFor: null,
    status: "planned",
    createdAt: new Date().toISOString(),
  },
  {
    id: "wish-2",
    title: "Париж на выходные",
    description: "Кофе, прогулка и немного магии.",
    category: "wish",
    location: "Париж, Франция",
    link: "",
    latitude: 48.8566,
    longitude: 2.3522,
    imageUrl: "",
    isPinned: false,
    plannedFor: null,
    status: "planned",
    createdAt: new Date().toISOString(),
  },
];

export function RomanticMobileApp() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const isSupabaseEnabled = Boolean(supabase);
  const [screen, setScreen] = useState<Screen>("home");
  const [homeMode, setHomeMode] = useState<HomeMode>("places");
  const [wishes, setWishes] = useState<WishItem[]>(initialCards);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authTab, setAuthTab] = useState<"signin" | "signup">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(null);
  const [randomWish, setRandomWish] = useState<WishItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [mapMode, setMapMode] = useState<MapMode>("all");
  const [loadError, setLoadError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "place" as WishCategory,
    location: "",
    link: "",
    latitude: "",
    longitude: "",
    plannedFor: "",
  });
  const [formError, setFormError] = useState("");
  const authRedirectUrl = useMemo(() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (fromEnv) {
      return fromEnv;
    }

    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    return undefined;
  }, []);

  const plannedWishes = wishes
    .filter((item) => item.status === "planned")
    .sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return left.isPinned ? -1 : 1;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  const doneWishes = wishes.filter((item) => item.status === "done");
  const homeCards = plannedWishes.filter((item) =>
    homeMode === "places" ? item.category === "place" : item.category === "wish",
  );
  const incomingNotifications = notifications
    .filter((item) => item.toUser === userId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  const unreadNotifications = incomingNotifications.filter((item) => !item.readAt).length;
  const mapWishes = wishes.filter(
    (item) =>
      item.category === "place" &&
      typeof item.latitude === "number" &&
      typeof item.longitude === "number",
  );
  const visibleMapWishes = mapWishes.filter((item) => {
    if (mapMode === "all") {
      return true;
    }
    return item.status === mapMode;
  });

  const loadWishes = useCallback(
    async (targetCoupleId: string) => {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("wishes")
        .select(
          "id,title,description,category,location_name,external_link,latitude,longitude,is_pinned,planned_for,status,created_at",
        )
        .eq("couple_id", targetCoupleId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const wishIds = (data ?? [])
        .map((item: Record<string, unknown>) => item.id as string)
        .filter(Boolean);
      let imageByWishId = new Map<string, string>();

      if (wishIds.length) {
        const { data: imageRows, error: imageError } = await supabase
          .from("wish_images")
          .select("wish_id,storage_path,sort_order")
          .in("wish_id", wishIds)
          .order("sort_order", { ascending: true });

        if (imageError) {
          throw imageError;
        }

        const nextImageMap = new Map<string, string>();
        for (const row of (imageRows ?? []) as Record<string, unknown>[]) {
          const wishId = (row.wish_id as string) ?? "";
          if (!wishId || nextImageMap.has(wishId)) {
            continue;
          }

          const path = (row.storage_path as string) ?? "";
          const publicUrl = supabase.storage.from("wishes").getPublicUrl(path).data
            .publicUrl;
          nextImageMap.set(wishId, publicUrl);
        }
        imageByWishId = nextImageMap;
      }

      const mapped = (data ?? []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        title: (item.title as string) ?? "",
        description: (item.description as string) ?? "",
        category: (item.category as WishCategory) ?? "wish",
        location: (item.location_name as string) ?? "",
        link: (item.external_link as string) ?? "",
        latitude: (item.latitude as number | null) ?? null,
        longitude: (item.longitude as number | null) ?? null,
        imageUrl: imageByWishId.get(item.id as string) ?? "",
        isPinned: (item.is_pinned as boolean) ?? false,
        plannedFor: (item.planned_for as string | null) ?? null,
        status: (item.status as "planned" | "done") ?? "planned",
        createdAt: (item.created_at as string) ?? new Date().toISOString(),
      }));

      setWishes(mapped);
      setLoadError("");
    },
    [supabase],
  );

  const loadNotifications = useCallback(
    async (targetCoupleId: string) => {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,message,from_user,to_user,created_at,read_at")
        .eq("couple_id", targetCoupleId)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const mapped = (data ?? []).map((item: Record<string, unknown>) => ({
        id: (item.id as string) ?? crypto.randomUUID(),
        type: ((item.type as NotificationType) ?? "custom") as NotificationType,
        message: (item.message as string) ?? "",
        fromUser: (item.from_user as string) ?? "",
        toUser: (item.to_user as string) ?? "",
        createdAt: (item.created_at as string) ?? new Date().toISOString(),
        readAt: (item.read_at as string | null) ?? null,
      }));

      setNotifications(mapped);
      setLoadError("");
    },
    [supabase],
  );

  const loadPartner = useCallback(
    async (targetCoupleId: string, activeUserId: string) => {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("couple_members")
        .select("user_id")
        .eq("couple_id", targetCoupleId);

      if (error) {
        throw error;
      }

      const partner = (data ?? []).find(
        (item: Record<string, unknown>) => item.user_id !== activeUserId,
      );
      setPartnerUserId((partner?.user_id as string | undefined) ?? null);
      setLoadError("");
    },
    [supabase],
  );

  const ensureUserSpace = useCallback(
    async (activeUserId: string, activeEmail: string) => {
      if (!supabase) {
        return null;
      }

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: activeUserId,
          email: activeEmail,
          display_name: activeEmail.split("@")[0] || "User",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw profileError;
      }

      const { data: existingMembership, error: membershipError } = await supabase
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", activeUserId)
        .maybeSingle();

      if (membershipError) {
        throw membershipError;
      }

      if (existingMembership?.couple_id) {
        return existingMembership.couple_id as string;
      }

      const { data: createdCouple, error: createCoupleError } = await supabase
        .from("couples")
        .insert({ created_by: activeUserId, status: "pending" })
        .select("id")
        .single();

      if (createCoupleError) {
        throw createCoupleError;
      }

      const newCoupleId = createdCouple.id as string;

      const { error: createMemberError } = await supabase
        .from("couple_members")
        .insert({
          couple_id: newCoupleId,
          user_id: activeUserId,
          role: "owner",
        });

      if (createMemberError) {
        throw createMemberError;
      }

      return newCoupleId;
    },
    [supabase],
  );

  const bootstrapFromSession = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUserId(null);
        setCoupleId(null);
        setWishes([]);
        return;
      }

      const activeUser = session.user;
      setUserId(activeUser.id);
      const targetCoupleId = await ensureUserSpace(
        activeUser.id,
        activeUser.email ?? "",
      );

      if (!targetCoupleId) {
        return;
      }

      setCoupleId(targetCoupleId);
      await loadWishes(targetCoupleId);
      await loadNotifications(targetCoupleId);
      await loadPartner(targetCoupleId, activeUser.id);
    } catch (error) {
      setLoadError("Не удалось загрузить данные. Проверь соединение и права Supabase.");
      setAuthMessage(
        error instanceof Error
          ? error.message
          : "Не удалось загрузить данные профиля.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [ensureUserSpace, loadNotifications, loadPartner, loadWishes, supabase]);

  function retryDataSync() {
    if (!supabase || !coupleId) {
      return;
    }
    setLoadError("");
    void loadWishes(coupleId);
    void loadNotifications(coupleId);
    if (userId) {
      void loadPartner(coupleId, userId);
    }
  }

  function showToast(title: string, tone: ToastItem["tone"] = "info") {
    const toastId = crypto.randomUUID();
    setToasts((prev) => [...prev, { id: toastId, title, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toastId));
    }, 2600);
  }

  async function copyToClipboard(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(successMessage, "success");
    } catch {
      showToast("Не удалось скопировать автоматически.", "error");
    }
  }

  useEffect(() => {
    if (!supabase) {
      return;
    }

    bootstrapFromSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      bootstrapFromSession();
    });

    return () => subscription.unsubscribe();
  }, [bootstrapFromSession, supabase]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error_code");
    const description = params.get("error_description");

    if (!errorCode) {
      return;
    }

    if (errorCode === "otp_expired") {
      setAuthMessage("Ссылка подтверждения истекла. Запроси новую и открой ее сразу.");
      return;
    }

    setAuthMessage(description ?? `Ошибка авторизации: ${errorCode}`);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const inviteFromUrl = params.get("invite");
    if (!inviteFromUrl) {
      return;
    }

    setJoinCode(inviteFromUrl);
    setScreen("profile");
    const toastId = crypto.randomUUID();
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        title: "Ссылка-приглашение распознана. Нажми «Присоединиться по коду».",
        tone: "info",
      },
    ]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toastId));
    }, 2600);
  }, []);

  useEffect(() => {
    if (!supabase || !coupleId) {
      return;
    }

    const channel = supabase
      .channel(`notifications-${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void loadNotifications(coupleId);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, loadNotifications, supabase]);

  useEffect(() => {
    if (!supabase || !coupleId) {
      return;
    }

    const channel = supabase
      .channel(`wishes-${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wishes",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void loadWishes(coupleId);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, loadWishes, supabase]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function resetForm() {
    setForm({
      title: "",
      description: "",
      category: "place",
      location: "",
      link: "",
      latitude: "",
      longitude: "",
      plannedFor: "",
    });
    setFormError("");
  }

  function onImagePicked(file: File | null) {
    setImageFile(file);
    if (!file) {
      setImagePreviewUrl("");
      return;
    }

    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  }

  function createWish() {
    const title = form.title.trim();
    if (title.length < 2) {
      setFormError("Название должно быть минимум 2 символа.");
      return;
    }

    if (form.link.trim()) {
      try {
        const parsed = new URL(form.link.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          setFormError("Ссылка должна начинаться с http:// или https://");
          return;
        }
      } catch {
        setFormError("Некорректная ссылка.");
        return;
      }
    }

    const newWish: WishItem = {
      id: crypto.randomUUID(),
      title,
      description: form.description.trim(),
      category: form.category,
      location: form.location.trim(),
      link: form.link.trim(),
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
      imageUrl: imagePreviewUrl,
      isPinned: false,
      plannedFor: form.plannedFor || null,
      status: "planned",
      createdAt: new Date().toISOString(),
    };

    if (form.latitude.trim() || form.longitude.trim()) {
      const lat = Number(form.latitude);
      const lng = Number(form.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setFormError("Координаты должны быть валидными: lat [-90..90], lng [-180..180].");
        return;
      }
    }

    if (!supabase || !coupleId || !userId) {
      setWishes((prev) => [newWish, ...prev]);
      resetForm();
      setImageFile(null);
      setImagePreviewUrl("");
      setScreen("home");
      setHomeMode(form.category === "place" ? "places" : "wishes");
      showToast("Желание создано.", "success");
      return;
    }

    void (async () => {
      setIsLoading(true);
      try {
        const { data: insertedWish, error } = await supabase
          .from("wishes")
          .insert({
          couple_id: coupleId,
          title,
          description: form.description.trim() || null,
          category: form.category,
          external_link: form.link.trim() || null,
          location_name: form.location.trim() || null,
          latitude: form.latitude.trim() ? Number(form.latitude) : null,
          longitude: form.longitude.trim() ? Number(form.longitude) : null,
          is_pinned: false,
          planned_for: form.plannedFor || null,
          status: "planned",
          created_by: userId,
          done_at: null,
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        if (imageFile && insertedWish?.id) {
          const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${coupleId}/${insertedWish.id}/${Date.now()}-${safeFileName}`;
          const { error: uploadError } = await supabase.storage
            .from("wishes")
            .upload(storagePath, imageFile, {
              upsert: false,
              contentType: imageFile.type || "image/jpeg",
            });

          if (uploadError) {
            throw uploadError;
          }

          const { error: imageInsertError } = await supabase.from("wish_images").insert({
            wish_id: insertedWish.id,
            storage_path: storagePath,
            sort_order: 0,
          });

          if (imageInsertError) {
            throw imageInsertError;
          }
        }

        await loadWishes(coupleId);
        resetForm();
        setImageFile(null);
        setImagePreviewUrl("");
        setScreen("home");
        setHomeMode(form.category === "place" ? "places" : "wishes");
        showToast("Желание успешно создано.", "success");
      } catch (error) {
        setFormError(
          error instanceof Error ? error.message : "Ошибка создания желания.",
        );
        showToast("Не удалось создать желание.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function togglePinned(id: string) {
    if (!supabase || !coupleId) {
      setWishes((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isPinned: !item.isPinned } : item,
        ),
      );
      return;
    }

    const target = wishes.find((item) => item.id === id);
    if (!target) {
      return;
    }

    void (async () => {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("wishes")
          .update({ is_pinned: !target.isPinned })
          .eq("id", id);
        if (error) {
          throw error;
        }
        await loadWishes(coupleId);
      } catch (error) {
        setAuthMessage(
          error instanceof Error ? error.message : "Ошибка закрепления желания.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function pickRandomWish() {
    if (!plannedWishes.length) {
      setInviteMessage("Нет активных желаний для случайного выбора.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * plannedWishes.length);
    setRandomWish(plannedWishes[randomIndex]);
  }

  function deleteWish(id: string) {
    if (!supabase || !coupleId) {
      setWishes((prev) => prev.filter((item) => item.id !== id));
      showToast("Желание удалено.", "info");
      return;
    }

    void (async () => {
      setIsLoading(true);
      try {
        const { error } = await supabase.from("wishes").delete().eq("id", id);
        if (error) {
          throw error;
        }

        await loadWishes(coupleId);
        showToast("Желание удалено.", "info");
      } catch (error) {
        setAuthMessage(
          error instanceof Error ? error.message : "Ошибка удаления желания.",
        );
        showToast("Не удалось удалить желание.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function toggleDone(id: string) {
    if (!supabase || !coupleId) {
      setWishes((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: item.status === "planned" ? "done" : "planned" }
            : item,
        ),
      );
      showToast("Статус обновлен.", "success");
      return;
    }

    const target = wishes.find((item) => item.id === id);
    if (!target) {
      return;
    }

    const nextStatus = target.status === "planned" ? "done" : "planned";

    void (async () => {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("wishes")
          .update({
            status: nextStatus,
            done_at: nextStatus === "done" ? new Date().toISOString() : null,
          })
          .eq("id", id);

        if (error) {
          throw error;
        }

        await loadWishes(coupleId);
        showToast(nextStatus === "done" ? "Добавлено в «Были»." : "Возвращено в планы.", "success");
      } catch (error) {
        setAuthMessage(
          error instanceof Error ? error.message : "Ошибка обновления статуса.",
        );
        showToast("Не удалось изменить статус.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function signOut() {
    if (!supabase) {
      return;
    }

    void supabase.auth.signOut();
  }

  function sendNudge(type: NotificationType, customMessage?: string) {
    if (!supabase || !coupleId || !userId || !partnerUserId) {
      setInviteMessage("Пока нет второго участника пары для уведомлений.");
      showToast("Сначала свяжите аккаунты через приглашение.", "info");
      return;
    }

    setIsLoading(true);
    void (async () => {
      try {
        const message =
          customMessage ??
          (type === "miss_you"
            ? "Скучаю по тебе ❤️"
            : type === "thinking"
              ? "Думаю о тебе 💌"
              : "");

        const { error } = await supabase.from("notifications").insert({
          couple_id: coupleId,
          type,
          message: message || null,
          from_user: userId,
          to_user: partnerUserId,
        });

        if (error) {
          throw error;
        }
        showToast("Уведомление отправлено партнеру.", "success");
      } catch (error) {
        setInviteMessage(
          error instanceof Error ? error.message : "Не удалось отправить уведомление.",
        );
        showToast("Не удалось отправить уведомление.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function markNotificationRead(notificationId: string) {
    if (!supabase) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
      return;
    }

    void supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);
  }

  function createInviteCode() {
    if (!supabase || !coupleId || !userId) {
      return;
    }

    setInviteMessage("");
    setIsLoading(true);
    void (async () => {
      try {
        const rawToken = crypto.randomUUID().replaceAll("-", "");
        const tokenHash = await sha256Hex(rawToken);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

        const { error } = await supabase.from("couple_invites").insert({
          couple_id: coupleId,
          token_hash: tokenHash,
          created_by: userId,
          expires_at: expiresAt,
        });

        if (error) {
          throw error;
        }

        setInviteCode(rawToken);
        setInviteLink(
          authRedirectUrl
            ? `${authRedirectUrl}?invite=${encodeURIComponent(rawToken)}`
            : "",
        );
        setInviteMessage("Код приглашения создан. Срок действия: 7 дней.");
        showToast("Приглашение сгенерировано.", "success");
      } catch (error) {
        setInviteMessage(
          error instanceof Error ? error.message : "Не удалось создать приглашение.",
        );
        showToast("Ошибка генерации приглашения.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function joinByInviteCode() {
    if (!supabase) {
      return;
    }

    const cleanCode = joinCode.trim();
    if (!cleanCode) {
      setInviteMessage("Введи код приглашения.");
      return;
    }

    setInviteMessage("");
    setIsLoading(true);
    void (async () => {
      try {
        const { data, error } = await supabase.rpc("consume_couple_invite", {
          invite_token: cleanCode,
        });

        if (error) {
          throw error;
        }

        if (!data || typeof data !== "string") {
          throw new Error("Не удалось присоединиться по коду.");
        }

        setCoupleId(data);
        await loadWishes(data);
        setJoinCode("");
        setInviteMessage("Ты успешно присоединился(лась) к парному пространству.");
        showToast("Аккаунты успешно связаны.", "success");
      } catch (error) {
        setInviteMessage(
          error instanceof Error ? error.message : "Ошибка присоединения по коду.",
        );
        showToast("Не удалось присоединиться по коду.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function signInWithPassword() {
    if (!supabase) {
      return;
    }

    setAuthMessage("");
    setIsLoading(true);
    void (async () => {
      try {
        const cleanEmail = authEmail.trim().toLowerCase();
        if (!cleanEmail || authPassword.length < 6) {
          setAuthMessage("Введи email и пароль минимум из 6 символов.");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: authPassword,
        });

        if (!error) {
          setAuthMessage("Успешный вход.");
          showToast("С возвращением! Вход выполнен.", "success");
          return;
        }

        if (/Email not confirmed/i.test(error.message)) {
          setAuthMessage("Подтверди email из последнего письма и войди снова.");
          return;
        }

        if (/Invalid login credentials/i.test(error.message)) {
          setAuthMessage(
            "Неверный email или пароль. Если аккаунта нет, используй 'Отправить magic link' для регистрации/входа.",
          );
          return;
        }

        throw error;
      } catch (error) {
        setAuthMessage(
          error instanceof Error ? error.message : "Ошибка входа по паролю.",
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function signUpWithPassword() {
    if (!supabase) {
      return;
    }

    setAuthMessage("");
    setIsLoading(true);
    void (async () => {
      try {
        const cleanEmail = authEmail.trim().toLowerCase();
        const displayName = authDisplayName.trim();
        if (!cleanEmail || authPassword.length < 6 || displayName.length < 2) {
          setAuthMessage("Заполни имя, email и пароль (минимум 6 символов).");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: authPassword,
          options: {
            emailRedirectTo: authRedirectUrl,
            data: {
              display_name: displayName,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          showToast("Аккаунт создан! Проверь почту для подтверждения.", "success");
          setAuthMessage("Регистрация успешна. Подтверди email по ссылке из письма.");
          setAuthTab("signin");
          return;
        }
      } catch (error) {
        setAuthMessage(
          error instanceof Error ? error.message : "Ошибка регистрации.",
        );
        showToast("Не удалось зарегистрироваться.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  function sendMagicLink() {
    if (!supabase) {
      return;
    }

    setAuthMessage("");
    setIsLoading(true);
    void (async () => {
      try {
        const cleanEmail = authEmail.trim().toLowerCase();
        if (!cleanEmail) {
          setAuthMessage("Введи email для magic link.");
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            emailRedirectTo: authRedirectUrl,
          },
        });

        if (error) {
          throw error;
        }

        setAuthMessage("Magic link отправлен на почту.");
        showToast("Проверь почту: magic link отправлен.", "success");
      } catch (error) {
        setAuthMessage(
          error instanceof Error ? error.message : "Ошибка отправки magic link.",
        );
        showToast("Не удалось отправить magic link.", "error");
      } finally {
        setIsLoading(false);
      }
    })();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,#f5d0fe_0%,#e9d5ff_35%,#dbeafe_70%,#fde7f3_100%)] px-4 py-8">
      <motion.div
        className="pointer-events-none absolute -left-14 top-10 h-56 w-56 rounded-full bg-pink-300/30 blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-10 bottom-12 h-60 w-60 rounded-full bg-sky-300/25 blur-3xl"
        animate={{ x: [0, -28, 0], y: [0, 16, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-[28px] border border-white/55 bg-[linear-gradient(160deg,rgba(255,255,255,.72),rgba(255,255,255,.42))] p-4 shadow-[0_24px_80px_rgba(167,139,250,0.28)] backdrop-blur-2xl sm:p-6">
          {isSupabaseEnabled && !userId ? (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 rounded-[24px] border border-white/60 bg-white/60 p-4 shadow-[0_18px_48px_rgba(167,139,250,0.18)]"
            >
              <TopBar title="Добро пожаловать в Our Space" trailing={<UserRound className="h-4 w-4" />} />
              <div className="grid grid-cols-2 gap-2 rounded-full bg-white/70 p-1">
                <button
                  type="button"
                  onClick={() => setAuthTab("signin")}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition",
                    authTab === "signin"
                      ? "bg-white text-violet-700 shadow"
                      : "text-slate-500",
                  )}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab("signup")}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition",
                    authTab === "signup"
                      ? "bg-white text-violet-700 shadow"
                      : "text-slate-500",
                  )}
                >
                  Регистрация
                </button>
              </div>

              <AnimatePresence mode="wait">
                {authTab === "signin" ? (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    className="space-y-3"
                  >
                    <Field label="Email" value={authEmail} onChange={setAuthEmail} />
                    <Field
                      label="Пароль"
                      value={authPassword}
                      onChange={setAuthPassword}
                      type="password"
                    />
                    <button
                      onClick={signInWithPassword}
                      disabled={isLoading}
                      className="w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Войти
                    </button>
                    <button
                      onClick={sendMagicLink}
                      disabled={isLoading}
                      className="w-full rounded-full bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-60"
                    >
                      Войти через magic link
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-3"
                  >
                    <Field
                      label="Имя"
                      value={authDisplayName}
                      onChange={setAuthDisplayName}
                    />
                    <Field label="Email" value={authEmail} onChange={setAuthEmail} />
                    <Field
                      label="Пароль (мин. 6)"
                      value={authPassword}
                      onChange={setAuthPassword}
                      type="password"
                    />
                    <button
                      onClick={signUpWithPassword}
                      disabled={isLoading}
                      className="w-full rounded-full bg-[linear-gradient(135deg,#f9a8d4,#a78bfa)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Создать аккаунт
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {authMessage ? (
                <p className="rounded-[16px] bg-white/70 px-4 py-3 text-xs text-slate-600">
                  {authMessage}
                </p>
              ) : null}
            </motion.section>
          ) : null}

          {!isSupabaseEnabled || userId ? (
            <>
              {isSupabaseEnabled ? (
                <div className="mb-3 flex items-center justify-between rounded-[16px] bg-white/65 px-3 py-2 text-xs text-slate-600">
                  <span>{isLoading ? "Синхронизация..." : "Supabase подключен"}</span>
                  <button
                    onClick={signOut}
                    className="rounded-full bg-white px-3 py-1 text-slate-700"
                    type="button"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <div className="mb-3 rounded-[16px] bg-white/65 px-3 py-2 text-xs text-slate-600">
                  Demo mode: добавь `NEXT_PUBLIC_SUPABASE_URL` и
                  `NEXT_PUBLIC_SUPABASE_ANON_KEY` для реального backend.
                </div>
              )}
              {loadError ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-[16px] bg-rose-50/90 px-3 py-2 text-xs text-rose-700">
                  <span>{loadError}</span>
                  <button
                    type="button"
                    onClick={retryDataSync}
                    className="rounded-full bg-white px-3 py-1 font-medium text-rose-700"
                  >
                    Retry
                  </button>
                </div>
              ) : null}

          {screen === "home" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <button className="rounded-full bg-white/75 p-2 text-slate-600">
                  <Home className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Avatar label="А" />
                  <Avatar label="Н" />
                </div>
                <button className="rounded-full bg-white/75 p-2 text-slate-600">
                  <span className="relative inline-flex">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 ? (
                      <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">
                        {Math.min(unreadNotifications, 9)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </div>

              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  Привет, Артём! <span className="text-violet-500">✨</span>
                </h1>
                <p className="text-sm text-slate-600">Планируем мечты вместе.</p>
              </div>

              <div className="rounded-full bg-white/55 p-1 backdrop-blur-md">
                <div className="grid grid-cols-2 gap-1">
                  {(["places", "wishes"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setHomeMode(mode)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition",
                        homeMode === mode
                          ? "bg-white text-slate-900 shadow"
                          : "text-slate-500",
                      )}
                    >
                      {mode === "places" ? "Места" : "Хотелки"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-[20px] border border-white/50 bg-white/55 p-2">
                <motion.div
                  animate={{ backgroundPositionX: ["0%", "100%", "0%"] }}
                  transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                  className="h-20 rounded-[14px] bg-[linear-gradient(120deg,#f9a8d4,#d8b4fe,#bfdbfe,#f9a8d4)] bg-[length:220%_220%] opacity-80"
                />
                {mapWishes.slice(0, 4).map((item, index) => (
                  <motion.span
                    key={item.id}
                    className={cn(
                      "absolute inline-flex items-center justify-center",
                      item.status === "done" ? "text-emerald-500" : "text-pink-500",
                    )}
                    style={{ left: `${18 + index * 18}%`, top: `${34 + (index % 2) * 18}%` }}
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: [0.9, 1.06, 0.9], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2.5 + index * 0.4, repeat: Infinity }}
                  >
                    <MapPin className="h-5 w-5" />
                  </motion.span>
                ))}
              </div>

              <div className="space-y-3">
                  {isLoading ? <ListSkeleton count={2} /> : null}
                  {!isLoading && homeCards.length === 0 ? (
                    <article className="rounded-[22px] border border-dashed border-white/65 bg-white/55 p-5 text-center text-sm text-slate-600">
                      Пока здесь пусто. Добавь первое желание ✨
                    </article>
                  ) : null}
                  <motion.div
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    <AnimatePresence initial={false}>
                      {homeCards.map((card) => (
                        <motion.article
                          key={card.id}
                          variants={cardVariants}
                          exit="exit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="cursor-pointer rounded-[22px] border border-white/50 bg-white/60 p-3 shadow-[0_16px_44px_rgba(167,139,250,0.2)]"
                          onClick={() => setSelectedWish(card)}
                        >
                          {card.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={card.imageUrl}
                              alt={card.title}
                              className="h-20 w-full rounded-[14px] object-cover"
                            />
                          ) : (
                            <div className="h-20 rounded-[14px] bg-[linear-gradient(120deg,#a78bfa,#f9a8d4,#93c5fd)]" />
                          )}
                          <div className="mt-2 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{card.title}</p>
                              <p className="text-xs text-slate-500">
                                {card.location || card.description || "Новая мечта для двоих"}
                              </p>
                              {card.plannedFor ? (
                                <p className="mt-1 text-[11px] text-violet-600">
                                  План:{" "}
                                  {new Intl.DateTimeFormat("ru-RU", {
                                    day: "numeric",
                                    month: "short",
                                  }).format(new Date(card.plannedFor))}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1">
                              {card.isPinned ? (
                                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                                  PIN
                                </span>
                              ) : null}
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <PillButton
                              label="Выполнено ✅"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleDone(card.id);
                              }}
                            />
                            <PillButton
                              label={card.isPinned ? "Открепить" : "Закрепить"}
                              onClick={(event) => {
                                event.stopPropagation();
                                togglePinned(card.id);
                              }}
                            />
                            <PillButton
                              label="Удалить"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteWish(card.id);
                              }}
                            />
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  </motion.div>
              </div>
            </section>
          )}

          {screen === "add" && (
            <section className="space-y-3">
              <TopBar title="Новое желание" trailing={<Plus className="h-4 w-4" />} />
              <Field
                label="Название"
                value={form.title}
                onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
              />
              <Field
                label="Описание"
                value={form.description}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, description: value }))
                }
              />
              <select
                className="w-full rounded-[16px] border border-white/50 bg-white/65 px-4 py-3 text-base text-slate-700 outline-none"
                value={form.category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    category: event.target.value as WishCategory,
                  }))
                }
              >
                <option value="place">Категория · Место</option>
                <option value="wish">Категория · Хотелка</option>
              </select>
              <Field
                label="Локация"
                value={form.location}
                onChange={(value) => setForm((prev) => ({ ...prev, location: value }))}
              />
              <Field
                label="Ссылка"
                value={form.link}
                onChange={(value) => setForm((prev) => ({ ...prev, link: value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Широта (lat)"
                  value={form.latitude}
                  onChange={(value) => setForm((prev) => ({ ...prev, latitude: value }))}
                />
                <Field
                  label="Долгота (lng)"
                  value={form.longitude}
                  onChange={(value) => setForm((prev) => ({ ...prev, longitude: value }))}
                />
              </div>
              <Field
                label="Дата (опционально)"
                type="date"
                value={form.plannedFor}
                onChange={(value) => setForm((prev) => ({ ...prev, plannedFor: value }))}
              />
              <div className="rounded-[18px] border border-dashed border-white/60 bg-white/55 p-4 text-center text-sm text-slate-600">
                <label className="flex cursor-pointer flex-col items-center gap-2">
                  <span>+ Загрузить изображение</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => onImagePicked(event.target.files?.[0] ?? null)}
                  />
                </label>
                {imagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewUrl}
                    alt="preview"
                    className="mt-3 h-24 w-full rounded-[12px] object-cover"
                  />
                ) : null}
              </div>
              {formError ? (
                <p className="text-xs font-medium text-rose-600">{formError}</p>
              ) : null}
              <button
                onClick={createWish}
                disabled={isLoading}
                className="w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4,#fdba74)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(249,168,212,0.45)]"
              >
                Создать мечту ✨
              </button>
            </section>
          )}

          {screen === "notifications" && (
            <section className="space-y-3">
              <TopBar title="Уведомления" trailing={<Search className="h-4 w-4" />} />
              {isLoading ? <ListSkeleton count={2} /> : null}
              {!isLoading && incomingNotifications.length === 0 ? (
                <article className="rounded-[22px] border border-dashed border-white/65 bg-white/55 p-5 text-center text-sm text-slate-600">
                  Пока нет уведомлений. Отправь партнеру первое 💌
                </article>
              ) : null}
              <motion.div variants={listVariants} initial="hidden" animate="show" className="space-y-3">
                <AnimatePresence initial={false}>
                  {incomingNotifications.map((item) => (
                    <motion.button
                      key={item.id}
                      variants={cardVariants}
                      exit="exit"
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full rounded-[22px] border p-4 text-left shadow-[0_16px_44px_rgba(167,139,250,0.2)]",
                        item.readAt
                          ? "border-white/50 bg-white/60"
                          : "border-pink-200 bg-pink-50/70",
                      )}
                      onClick={() => markNotificationRead(item.id)}
                      type="button"
                    >
                      <div className="flex gap-3">
                        <Avatar label="Н" small />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.message ||
                              (item.type === "miss_you"
                                ? "Партнер скучает по тебе ❤️"
                                : item.type === "thinking"
                                  ? "Партнер думает о тебе 💌"
                                  : "Новое уведомление")}
                          </p>
                          <p className="text-sm text-slate-600">
                            {new Intl.DateTimeFormat("ru-RU", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(item.createdAt))}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}

          {screen === "completed" && (
            <section className="space-y-3">
              <TopBar title="Что мы уже сделали" trailing={<Heart className="h-4 w-4" />} />
              {doneWishes.length === 0 ? (
                <article className="rounded-[22px] border border-dashed border-white/65 bg-white/55 p-5 text-center text-sm text-slate-600">
                  Пока нет завершенных моментов. Отметь что-нибудь как выполненное.
                </article>
              ) : null}
              {doneWishes.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[22px] border border-white/50 bg-white/60 p-4 shadow-[0_16px_44px_rgba(167,139,250,0.2)]"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-violet-500">
                    {new Intl.DateTimeFormat("ru-RU", {
                      day: "numeric",
                      month: "long",
                    }).format(new Date(item.createdAt))}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
                  <div className="mt-2 h-24 rounded-[14px] bg-[linear-gradient(120deg,#a78bfa,#f9a8d4,#93c5fd)]" />
                  <p className="mt-2 text-sm text-slate-600">
                    {item.description || "Момент сохранен в вашей истории."}
                  </p>
                  <button
                    onClick={() => toggleDone(item.id)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    <CalendarCheck2 className="h-3.5 w-3.5" />
                    Вернуть в планы
                  </button>
                </article>
              ))}
            </section>
          )}

          {screen === "map" && (
            <section className="space-y-3">
              <TopBar title="Ваши желания" trailing={<MapPin className="h-4 w-4" />} />
              <div className="flex flex-wrap gap-2">
                {([
                  ["all", "Все"],
                  ["planned", "Хотим"],
                  ["done", "Были"],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setMapMode(mode)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium",
                      mapMode === mode
                        ? "bg-white text-violet-700 shadow"
                        : "bg-white/70 text-slate-600",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <WishesMap
                points={visibleMapWishes.map((item) => ({
                  id: item.id,
                  title: item.title,
                  location: item.location || "Без названия",
                  latitude: item.latitude ?? 0,
                  longitude: item.longitude ?? 0,
                  status: item.status,
                }))}
                onSelect={(id) => {
                  const found = wishes.find((item) => item.id === id);
                  if (found) {
                    setSelectedWish(found);
                  }
                }}
              />
              {mapWishes[0]?.latitude && mapWishes[0]?.longitude ? (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${mapWishes[0].latitude}&mlon=${mapWishes[0].longitude}#map=12/${mapWishes[0].latitude}/${mapWishes[0].longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Открыть карту в OSM
                </a>
              ) : null}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[14px] bg-white/70 px-3 py-2 text-slate-700">
                  Хотим побывать:{" "}
                  <span className="font-semibold">
                    {mapWishes.filter((item) => item.status === "planned").length}
                  </span>
                </div>
                <div className="rounded-[14px] bg-white/70 px-3 py-2 text-slate-700">
                  Уже были:{" "}
                  <span className="font-semibold">
                    {mapWishes.filter((item) => item.status === "done").length}
                  </span>
                </div>
              </div>
            </section>
          )}

          {screen === "profile" && (
            <section className="space-y-3">
              <TopBar title="Мы с Настей" trailing={<UserRound className="h-4 w-4" />} />
              <div className="rounded-[22px] border border-white/50 bg-white/60 p-4 text-center shadow-[0_16px_44px_rgba(167,139,250,0.2)]">
                <div className="mx-auto flex w-fit items-center gap-2">
                  <Avatar label="А" />
                  <Heart className="h-4 w-4 text-pink-500" />
                  <Avatar label="Н" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => sendNudge("miss_you")}
                    disabled={isLoading || !isSupabaseEnabled}
                    className="rounded-[14px] bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    Скучаю ❤️
                  </button>
                  <button
                    onClick={() => sendNudge("thinking")}
                    disabled={isLoading || !isSupabaseEnabled}
                    className="rounded-[14px] bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-60"
                  >
                    Думаю о тебе 💌
                  </button>
                </div>
                <button
                  onClick={pickRandomWish}
                  disabled={isLoading || !isSupabaseEnabled}
                  className="mt-3 w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Выбрать случайное 🎲
                </button>
                <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                  <div className="rounded-[14px] bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Всего желаний
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{wishes.length}</p>
                  </div>
                  <div className="rounded-[14px] bg-white/70 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      Выполнено
                    </p>
                    <p className="text-lg font-semibold text-slate-900">{doneWishes.length}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-left">
                  <button
                    onClick={createInviteCode}
                    disabled={isLoading || !isSupabaseEnabled}
                    className="w-full rounded-full bg-white/75 px-4 py-2 text-xs font-medium text-slate-700 disabled:opacity-60"
                    type="button"
                  >
                    Создать invite-код
                  </button>
                  {inviteCode ? (
                    <div className="rounded-[14px] bg-white/75 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        Invite code
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                        {inviteCode}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(inviteCode, "Invite-код скопирован.")
                          }
                          className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                        >
                          <Copy className="h-3 w-3" />
                          Скопировать код
                        </button>
                        {inviteLink ? (
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(inviteLink, "Ссылка-приглашение скопирована.")
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700"
                          >
                            <Copy className="h-3 w-3" />
                            Скопировать ссылку
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <Field
                    label="Ввести invite-код"
                    value={joinCode}
                    onChange={setJoinCode}
                  />
                  <button
                    onClick={joinByInviteCode}
                    disabled={isLoading || !isSupabaseEnabled}
                    className="w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    type="button"
                  >
                    Присоединиться по коду
                  </button>
                  {inviteMessage ? (
                    <p className="rounded-[14px] bg-white/75 px-3 py-2 text-xs text-slate-600">
                      {inviteMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          )}

          <AnimatePresence>
            {randomWish ? (
              <motion.div
                className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-4 backdrop-blur-sm sm:items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  className="w-full max-w-sm rounded-[24px] border border-white/60 bg-white/92 p-4 text-center shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
                >
                  <motion.div
                    className="mx-auto mb-3 w-fit text-violet-600"
                    animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    <Dices className="h-7 w-7" />
                  </motion.div>
                  <p className="text-sm text-slate-600">Случайный выбор на сегодня</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {randomWish.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {randomWish.location || randomWish.description || "Новая совместная идея"}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <PillButton
                      label="Открыть"
                      onClick={() => {
                        setSelectedWish(randomWish);
                        setRandomWish(null);
                      }}
                    />
                    <PillButton label="Еще" onClick={pickRandomWish} />
                    <PillButton label="Закрыть" onClick={() => setRandomWish(null)} />
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
            {selectedWish ? (
              <motion.div
                className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 p-4 backdrop-blur-sm sm:items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.98 }}
                  className="w-full max-w-md rounded-[24px] border border-white/60 bg-white/90 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.25)]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-lg font-semibold text-slate-900">{selectedWish.title}</p>
                    <button
                      type="button"
                      className="rounded-full bg-white/80 p-2 text-slate-600"
                      onClick={() => setSelectedWish(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {selectedWish.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedWish.imageUrl}
                      alt={selectedWish.title}
                      className="h-44 w-full rounded-[14px] object-cover"
                    />
                  ) : (
                    <div className="h-44 w-full rounded-[14px] bg-[linear-gradient(120deg,#a78bfa,#f9a8d4,#93c5fd)]" />
                  )}
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    <p>{selectedWish.description || "Описание пока не добавлено."}</p>
                    <p>
                      <span className="font-medium">Локация:</span>{" "}
                      {selectedWish.location || "Не указана"}
                    </p>
                    <p>
                      <span className="font-medium">Статус:</span>{" "}
                      {selectedWish.status === "done" ? "Уже были" : "Хотим побывать"}
                    </p>
                    {selectedWish.plannedFor ? (
                      <p>
                        <span className="font-medium">Дата:</span>{" "}
                        {new Intl.DateTimeFormat("ru-RU", {
                          day: "numeric",
                          month: "long",
                        }).format(new Date(selectedWish.plannedFor))}
                      </p>
                    ) : null}
                    {selectedWish.link ? (
                      <a
                        href={selectedWish.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-violet-700"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Открыть ссылку
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PillButton
                      label={
                        selectedWish.status === "done"
                          ? "Вернуть в планы"
                          : "Отметить как done"
                      }
                      onClick={() => {
                        toggleDone(selectedWish.id);
                        setSelectedWish(null);
                      }}
                    />
                    <PillButton
                      label="Удалить"
                      onClick={() => {
                        deleteWish(selectedWish.id);
                        setSelectedWish(null);
                      }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <BottomNav screen={screen} setScreen={setScreen} />
            </>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] mx-auto flex w-full max-w-md flex-col gap-2 px-4">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              className={cn(
                "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_40px_rgba(15,23,42,0.15)] backdrop-blur-xl",
                toast.tone === "success" &&
                  "border-emerald-200 bg-emerald-50/90 text-emerald-800",
                toast.tone === "error" &&
                  "border-rose-200 bg-rose-50/90 text-rose-800",
                toast.tone === "info" &&
                  "border-violet-200 bg-white/90 text-slate-700",
              )}
            >
              {toast.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}

function TopBar({ title, trailing }: { title: string; trailing: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-2xl font-semibold text-slate-900">{title}</p>
      <span className="rounded-full bg-white/75 p-2 text-slate-600">{trailing}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: "text" | "password" | "date";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={label}
      className="w-full rounded-[16px] border border-white/50 bg-white/65 px-4 py-3 text-base text-slate-700 outline-none placeholder:text-slate-500"
    />
  );
}

function PillButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700"
    >
      {label}
    </motion.button>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`sk-${idx}`}
          className="overflow-hidden rounded-[22px] border border-white/50 bg-white/55 p-3"
        >
          <div className="animate-pulse space-y-2">
            <div className="h-20 rounded-[14px] bg-white/65" />
            <div className="h-3 w-2/3 rounded bg-white/70" />
            <div className="h-3 w-1/2 rounded bg-white/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Avatar({ label, small = false }: { label: string; small?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-white/70 bg-white/75 font-semibold text-violet-700",
        small ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
      )}
    >
      {label}
    </div>
  );
}

function BottomNav({
  screen,
  setScreen,
}: {
  screen: Screen;
  setScreen: (value: Screen) => void;
}) {
  const items: Array<{ key: Screen; label: string; icon: React.ReactNode }> = [
    { key: "home", label: "Панель", icon: <Home className="h-4 w-4" /> },
    { key: "completed", label: "Выполнено", icon: <Heart className="h-4 w-4" /> },
    { key: "profile", label: "Профиль", icon: <UserRound className="h-4 w-4" /> },
  ];

  return (
    <div className="mt-5 space-y-2">
      <div className="grid grid-cols-3 gap-1 rounded-full border border-white/50 bg-white/60 p-1.5 backdrop-blur-xl">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setScreen(item.key)}
            className={cn(
              "flex items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium",
              screen === item.key
                ? "bg-white text-violet-600 shadow"
                : "text-slate-500",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setScreen("add")}
          className="rounded-full bg-white/75 px-3 py-1 text-xs text-slate-600"
        >
          + Add
        </button>
        <button
          type="button"
          onClick={() => setScreen("notifications")}
          className="rounded-full bg-white/75 px-3 py-1 text-xs text-slate-600"
        >
          Notifications
        </button>
        <button
          type="button"
          onClick={() => setScreen("map")}
          className="rounded-full bg-white/75 px-3 py-1 text-xs text-slate-600"
        >
          Map
        </button>
      </div>
    </div>
  );
}
