"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Heart,
  Link2,
  MapPin,
  MessageCircleHeart,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAppState } from "@/components/providers/app-state-provider";
import type {
  NotificationType,
  PartnerNotification,
  Wish,
  WishCategory,
  WishFormValues,
} from "@/lib/types";
import {
  buildInviteLink,
  categoryLabel,
  cn,
  formatDate,
  relativeGreeting,
} from "@/lib/utils";

const DynamicLocationMap = dynamic(
  () =>
    import("@/components/app/location-map").then((module) => module.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-[28px] border border-white/30 bg-white/60 p-6 text-sm text-slate-600 shadow-[0_20px_80px_rgba(124,58,237,0.12)] backdrop-blur-xl">
        Loading shared map...
      </div>
    ),
  },
);

const wishSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().trim().min(2, "Give the idea a short title."),
    description: z.string(),
    category: z.enum(["wish", "place", "trip"]),
    link: z.string(),
    imageUrls: z.string(),
    locationName: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    status: z.enum(["planned", "done"]),
    howItWent: z.string(),
  })
  .superRefine((value, ctx) => {
    const locationFields = [
      value.locationName.trim(),
      value.latitude.trim(),
      value.longitude.trim(),
    ];
    const someLocationFilled = locationFields.some(Boolean);
    const allLocationFilled = locationFields.every(Boolean);

    if (someLocationFilled && !allLocationFilled) {
      ctx.addIssue({
        code: "custom",
        path: ["locationName"],
        message: "Provide the name and both coordinates together.",
      });
    }

    if (value.link.trim()) {
      try {
        const parsed = new URL(value.link);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          ctx.addIssue({
            code: "custom",
            path: ["link"],
            message: "Only http and https links are allowed.",
          });
        }
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["link"],
          message: "Use a valid URL starting with http or https.",
        });
      }
    }
  });

type WishFormSchema = z.infer<typeof wishSchema>;

const defaultWishValues: WishFormSchema = {
  title: "",
  description: "",
  category: "wish",
  link: "",
  imageUrls: "",
  locationName: "",
  latitude: "",
  longitude: "",
  status: "planned",
  howItWent: "",
};

type FilterMode = "all" | WishCategory;
type ViewMode = "grid" | "map" | "done";

const categoryOptions: Array<{ value: FilterMode; label: string }> = [
  { value: "all", label: "All" },
  { value: "wish", label: "Wishlist" },
  { value: "place", label: "Places" },
  { value: "trip", label: "Trips" },
];

const nudgeOptions: Array<{ type: NotificationType; label: string }> = [
  { type: "miss_you", label: "Miss you" },
  { type: "thinking", label: "Thinking of you" },
  { type: "hug", label: "Want a hug" },
];

function getWishValues(wish?: Wish): WishFormValues {
  if (!wish) {
    return defaultWishValues;
  }

  return {
    id: wish.id,
    title: wish.title,
    description: wish.description ?? "",
    category: wish.category,
    link: wish.link ?? "",
    imageUrls: wish.images.join("\n"),
    locationName: wish.location?.name ?? "",
    latitude: wish.location?.lat.toString() ?? "",
    longitude: wish.location?.lng.toString() ?? "",
    status: wish.status,
    howItWent: wish.howItWent ?? "",
  };
}

export function OurSpaceApp() {
  const {
    state,
    currentUser,
    partnerUser,
    isConfigured,
    setAuthMode,
    signIn,
    switchUser,
    addOrUpdateWish,
    removeWish,
    toggleWishDone,
    toggleWishLike,
    sendPartnerNotification,
    markNotificationRead,
    markAllNotificationsRead,
    joinPartner,
    resetDemo,
  } = useAppState();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [modalWish, setModalWish] = useState<Wish | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("partner@ourspace.dev");
  const [authEmail, setAuthEmail] = useState(currentUser?.email ?? "luna@ourspace.dev");

  const notificationsForCurrentUser = state.notifications.filter(
    (notification) => notification.toUser === currentUser?.id,
  );
  const unreadCount = notificationsForCurrentUser.filter(
    (notification) => !notification.read,
  ).length;

  const filteredWishes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return state.wishes
      .filter((wish) => (filter === "all" ? true : wish.category === filter))
      .filter((wish) =>
        viewMode === "done" ? wish.status === "done" : wish.status !== "done",
      )
      .filter((wish) => {
        if (!normalizedQuery) {
          return true;
        }

        return [wish.title, wish.description, wish.location?.name]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedQuery));
      })
      .sort((left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      );
  }, [filter, query, state.wishes, viewMode]);

  const timelineWishes = useMemo(
    () =>
      state.wishes
        .filter((wish) => wish.status === "done")
        .sort(
          (left, right) =>
            new Date(right.doneAt ?? right.updatedAt).getTime() -
            new Date(left.doneAt ?? left.updatedAt).getTime(),
        ),
    [state.wishes],
  );

  const form = useForm<WishFormSchema>({
    resolver: zodResolver(wishSchema),
    defaultValues: defaultWishValues,
  });

  function openCreateWish() {
    form.reset(defaultWishValues);
    setModalWish(null);
    setIsModalOpen(true);
  }

  function openEditWish(wish: Wish) {
    form.reset(getWishValues(wish));
    setModalWish(wish);
    setIsModalOpen(true);
  }

  function handleSubmit(values: WishFormValues) {
    addOrUpdateWish(values);
    setIsModalOpen(false);
    setModalWish(null);
    form.reset(defaultWishValues);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fceff9_0%,#eef2ff_45%,#e0f7fa_100%)] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[32px] border border-white/40 bg-white/30 p-5 shadow-[0_20px_100px_rgba(167,139,250,0.22)] backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                <Sparkles className="h-3.5 w-3.5" />
                Our Space
              </span>
              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                  A private shared space for plans, places, memories and little
                  emotional nudges.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  This implementation ships with a fully interactive demo mode
                  powered by local storage. Add Supabase environment variables to
                  wire the same experience to a real backend.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-[28px] border border-white/40 bg-white/55 p-4 text-sm text-slate-600 sm:min-w-[320px]">
              <p className="font-medium text-slate-900">
                Runtime mode: {isConfigured ? "Supabase-ready" : "Demo fallback"}
              </p>
              <p>
                Couple status:{" "}
                <span className="font-semibold text-violet-700">
                  {state.couple.status}
                </span>
              </p>
              <p>
                Invite link:{" "}
                <span className="font-medium text-slate-800">
                  {buildInviteLink(state.couple.inviteCode)}
                </span>
              </p>
              <button
                className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                type="button"
                onClick={resetDemo}
              >
                Reset demo data
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_2fr_1.1fr]">
          <div className="space-y-6">
            <GlassCard title="Auth and pairing" subtitle="Email + password or magic link">
              <div className="flex gap-2">
                {(["password", "magic-link"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 ease-in-out hover:scale-[1.02]",
                      state.authMode === mode
                        ? "bg-violet-600 text-white"
                        : "bg-white/80 text-slate-600",
                    )}
                    type="button"
                    onClick={() => setAuthMode(mode)}
                  >
                    {mode === "password" ? "Password" : "Magic link"}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/80 px-4 py-3 outline-none ring-0 transition-shadow focus:shadow-[0_0_0_4px_rgba(167,139,250,0.18)]"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <button
                className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                type="button"
                onClick={() => signIn(authEmail, state.authMode)}
              >
                {state.authMode === "password" ? "Sign in / register" : "Send magic link"}
              </button>
              <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  Current session: {currentUser?.displayName ?? "Guest"}
                </p>
                <p className="mt-1">
                  The second partner can join from the invite link or be simulated
                  below in demo mode.
                </p>
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Partner email
                <input
                  className="mt-2 w-full rounded-2xl border border-white/50 bg-white/80 px-4 py-3 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(249,168,212,0.18)]"
                  value={partnerEmail}
                  onChange={(event) => setPartnerEmail(event.target.value)}
                  placeholder="partner@example.com"
                />
              </label>
              <button
                className="mt-4 w-full rounded-2xl bg-pink-500 px-4 py-3 font-medium text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                type="button"
                onClick={() => joinPartner(partnerEmail)}
              >
                Join partner from invite
              </button>
            </GlassCard>

            <GlassCard title="Partner profile" subtitle="Micro-notifications that keep the emotional layer alive">
              <div className="rounded-[24px] bg-white/65 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-lg font-semibold text-white">
                    {partnerUser?.avatar ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {partnerUser?.displayName ?? "Waiting for partner"}
                    </p>
                    <p className="text-sm text-slate-600">
                      {partnerUser?.email ?? "Invite not accepted yet"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {nudgeOptions.map((option) => (
                    <button
                      key={option.type}
                      className="rounded-2xl bg-white px-4 py-3 text-left font-medium text-slate-800 transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                      type="button"
                      onClick={() => sendPartnerNotification(option.type)}
                      disabled={!partnerUser}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className="mt-4 min-h-24 w-full rounded-2xl border border-white/50 bg-white/80 px-4 py-3 text-sm outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(147,197,253,0.18)]"
                  value={customMessage}
                  onChange={(event) => setCustomMessage(event.target.value)}
                  maxLength={160}
                  placeholder="Leave a tiny custom note..."
                />
                <button
                  className="mt-3 w-full rounded-2xl bg-sky-500 px-4 py-3 font-medium text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                  type="button"
                  onClick={() => {
                    sendPartnerNotification("custom", customMessage);
                    setCustomMessage("");
                  }}
                  disabled={!customMessage.trim() || !partnerUser}
                >
                  Send custom nudge
                </button>
              </div>
              {state.couple.memberIds.length > 1 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {state.users.map((user) => (
                    <button
                      key={user.id}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 ease-in-out hover:scale-[1.02]",
                        currentUser?.id === user.id
                          ? "bg-slate-900 text-white"
                          : "bg-white/80 text-slate-700",
                      )}
                      type="button"
                      onClick={() => switchUser(user.id)}
                    >
                      View as {user.displayName}
                    </button>
                  ))}
                </div>
              ) : null}
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard
              title="Shared board"
              subtitle="Wishlist, places and trips in one mobile-first flow"
              action={
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                  type="button"
                  onClick={openCreateWish}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              }
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((option) => (
                    <button
                      key={option.value}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 ease-in-out hover:scale-[1.02]",
                        filter === option.value
                          ? "bg-violet-600 text-white"
                          : "bg-white/80 text-slate-700",
                      )}
                      type="button"
                      onClick={() => setFilter(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["grid", "Board"],
                    ["map", "Map"],
                    ["done", "Done"],
                  ] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 ease-in-out hover:scale-[1.02]",
                        viewMode === mode
                          ? "bg-pink-500 text-white"
                          : "bg-white/80 text-slate-700",
                      )}
                      type="button"
                      onClick={() => setViewMode(mode)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="w-full rounded-2xl border border-white/50 bg-white/85 py-3 pl-11 pr-4 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(167,139,250,0.18)]"
                    placeholder="Search ideas, places or memories..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-5">
                {viewMode === "map" ? (
                  <DynamicLocationMap wishes={filteredWishes} />
                ) : viewMode === "done" ? (
                  <div className="space-y-4">
                    {timelineWishes.map((wish) => (
                      <motion.div
                        key={wish.id}
                        layout
                        className="rounded-[28px] border border-white/30 bg-white/70 p-5 shadow-[0_20px_60px_rgba(124,58,237,0.08)]"
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-violet-600">
                          {categoryLabel(wish.category)}
                        </p>
                        <div className="mt-2 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {wish.title}
                            </h3>
                            <p className="mt-1 text-sm text-slate-600">
                              {wish.howItWent ?? "Completed and saved as a memory."}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {formatDate(wish.doneAt)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {!timelineWishes.length ? (
                      <EmptyState label="Nothing has reached the memory timeline yet." />
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {filteredWishes.map((wish) => (
                      <WishCard
                        key={wish.id}
                        wish={wish}
                        currentUserId={currentUser?.id}
                        onEdit={() => openEditWish(wish)}
                        onDelete={() => removeWish(wish.id)}
                        onToggleDone={() => toggleWishDone(wish.id)}
                        onToggleLike={() => toggleWishLike(wish.id)}
                      />
                    ))}
                    {!filteredWishes.length ? (
                      <EmptyState label="No matching cards. Try another filter or add a new shared idea." />
                    ) : null}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
            <GlassCard
              title="In-app feed"
              subtitle="Realtime-ready notification stream for the active partner"
              action={
                <button
                  className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                  type="button"
                  onClick={markAllNotificationsRead}
                >
                  Mark all read
                </button>
              }
            >
              <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Bell className="h-4 w-4 text-violet-600" />
                  {currentUser?.displayName}&apos;s feed
                </div>
                <span className="rounded-full bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">
                  {unreadCount} unread
                </span>
              </div>
              <div className="space-y-3">
                {notificationsForCurrentUser.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    currentUserId={currentUser?.id}
                    users={state.users}
                    onRead={() => markNotificationRead(notification.id)}
                  />
                ))}
                {!notificationsForCurrentUser.length ? (
                  <EmptyState label="No notifications for this partner yet." />
                ) : null}
              </div>
            </GlassCard>

            <GlassCard title="Product heartbeat" subtitle="A compact view of the MVP surface">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Shared cards" value={state.wishes.length.toString()} />
                <Metric label="Done memories" value={timelineWishes.length.toString()} />
                <Metric label="Partners" value={state.couple.memberIds.length.toString()} />
                <Metric label="Unread nudges" value={unreadCount.toString()} />
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isModalOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-white/40 bg-white/90 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-8"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-violet-600">
                    {modalWish ? "Update card" : "Create card"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                    {modalWish ? modalWish.title : "Add something for both of you"}
                  </h2>
                </div>
                <button
                  className="rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>

              <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                <Field label="Title" error={form.formState.errors.title?.message}>
                  <input
                    className="field-input"
                    {...form.register("title")}
                    placeholder="Cozy dinner spot with candlelight"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    className="field-input min-h-24"
                    {...form.register("description")}
                    placeholder="Anything worth remembering or planning."
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category">
                    <select className="field-input" {...form.register("category")}>
                      <option value="wish">Wishlist</option>
                      <option value="place">Place</option>
                      <option value="trip">Trip</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className="field-input" {...form.register("status")}>
                      <option value="planned">Planned</option>
                      <option value="done">Done</option>
                    </select>
                  </Field>
                </div>

                <Field label="Link" error={form.formState.errors.link?.message}>
                  <input
                    className="field-input"
                    {...form.register("link")}
                    placeholder="https://..."
                  />
                </Field>

                <Field label="Image URLs">
                  <textarea
                    className="field-input min-h-24"
                    {...form.register("imageUrls")}
                    placeholder="Paste one URL per line"
                  />
                </Field>

                <Field
                  label="Location"
                  error={form.formState.errors.locationName?.message}
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      className="field-input sm:col-span-3"
                      {...form.register("locationName")}
                      placeholder="Prague, Czechia"
                    />
                    <input
                      className="field-input"
                      {...form.register("latitude")}
                      placeholder="50.0755"
                    />
                    <input
                      className="field-input"
                      {...form.register("longitude")}
                      placeholder="14.4378"
                    />
                  </div>
                </Field>

                <Field label="How it went">
                  <textarea
                    className="field-input min-h-24"
                    {...form.register("howItWent")}
                    placeholder="Short memory for the timeline"
                  />
                </Field>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    className="rounded-2xl bg-slate-100 px-5 py-3 font-medium text-slate-700"
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                    type="submit"
                  >
                    Save card
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GlassCard({
  title,
  subtitle,
  action,
  children,
}: Readonly<{
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-[32px] border border-white/35 bg-white/35 p-5 shadow-[0_20px_80px_rgba(124,58,237,0.14)] backdrop-blur-2xl sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: Readonly<{
  label: string;
  error?: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
    </label>
  );
}

function EmptyState({ label }: Readonly<{ label: string }>) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/40 bg-white/50 p-6 text-sm text-slate-500">
      {label}
    </div>
  );
}

function Metric({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[24px] bg-white/70 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function NotificationCard({
  notification,
  users,
  onRead,
}: Readonly<{
  notification: PartnerNotification;
  currentUserId?: string;
  users: Array<{ id: string; displayName: string }>;
  onRead: () => void;
}>) {
  const fromUser = users.find((user) => user.id === notification.fromUser);

  return (
    <button
      className={cn(
        "w-full rounded-[24px] border p-4 text-left transition-transform duration-200 ease-in-out hover:scale-[1.02]",
        notification.read
          ? "border-white/30 bg-white/60"
          : "border-violet-200 bg-violet-50/90",
      )}
      type="button"
      onClick={onRead}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">
            {fromUser?.displayName ?? "Partner"} · {relativeGreeting(notification.type)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {notification.message ?? "A soft little moment landed in your feed."}
          </p>
        </div>
        {!notification.read ? (
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-violet-500" />
        ) : null}
      </div>
      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
        {formatDate(notification.createdAt)}
      </p>
    </button>
  );
}

function WishCard({
  wish,
  currentUserId,
  onEdit,
  onDelete,
  onToggleDone,
  onToggleLike,
}: Readonly<{
  wish: Wish;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  onToggleLike: () => void;
}>) {
  const isLiked = currentUserId ? wish.likedBy.includes(currentUserId) : false;

  return (
    <motion.article
      layout
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden rounded-[28px] border border-white/30 bg-white/75 shadow-[0_20px_60px_rgba(124,58,237,0.08)]"
    >
      {wish.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={wish.title}
          className="h-48 w-full object-cover"
          src={wish.images[0]}
        />
      ) : (
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-violet-100 via-pink-100 to-sky-100 text-sm text-slate-500">
          Add images to make the card feel like a memory board.
        </div>
      )}
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-600">
              {categoryLabel(wish.category)}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              {wish.title}
            </h3>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              wish.status === "done"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-700",
            )}
          >
            {wish.status}
          </span>
        </div>
        {wish.description ? (
          <p className="text-sm leading-6 text-slate-600">{wish.description}</p>
        ) : null}
        {wish.location ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 text-pink-500" />
            {wish.location.name}
          </div>
        ) : null}
        {wish.link ? (
          <a
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-700"
            href={wish.link}
            rel="noreferrer noopener"
            target="_blank"
          >
            <Link2 className="h-4 w-4" />
            Open link
          </a>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={onToggleDone}>
            <MessageCircleHeart className="h-4 w-4" />
            {wish.status === "done" ? "Back to planned" : "Mark done"}
          </ActionButton>
          <ActionButton onClick={onToggleLike} active={isLiked}>
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
            {wish.likedBy.length}
          </ActionButton>
          <ActionButton onClick={onEdit}>Edit</ActionButton>
          <ActionButton onClick={onDelete} danger>
            <Trash2 className="h-4 w-4" />
            Delete
          </ActionButton>
        </div>
      </div>
    </motion.article>
  );
}

function ActionButton({
  children,
  onClick,
  active = false,
  danger = false,
}: Readonly<{
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}>) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform duration-200 ease-in-out hover:scale-[1.02]",
        danger
          ? "bg-rose-50 text-rose-700"
          : active
            ? "bg-pink-500 text-white"
            : "bg-slate-100 text-slate-700",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
