"use client";

import { motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Heart,
  Home,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type NavTab = "home" | "completed" | "profile";
type HomeTab = "places" | "wishes";

const timelineItems = [
  {
    date: "19 Jan",
    title: "Romantic dinner",
    caption: "Sunset, city lights, and the best tiramisu together.",
  },
  {
    date: "14 Feb",
    title: "Cozy weekend",
    caption: "Long walk, warm tea, and a tiny photo memory.",
  },
];

const notificationItems = [
  { title: "She misses you ❤️", text: "Send a soft hug back." },
  { title: "Thinking about you 💌", text: "A little note from your partner." },
];

export function MobileUiShowcase() {
  const [homeTab, setHomeTab] = useState<HomeTab>("places");
  const [activeNav, setActiveNav] = useState<NavTab>("home");

  const homeCards = useMemo(
    () =>
      homeTab === "places"
        ? [
            { title: "Romantic dinner", subtitle: "Seaside restaurant" },
            { title: "Paris weekend", subtitle: "Shared dream trip" },
          ]
        : [
            { title: "Sunrise picnic", subtitle: "Coffee and warm croissants" },
            { title: "Stargazing night", subtitle: "Blankets and playlists" },
          ],
    [homeTab],
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#fce7f3_0%,#e9d5ff_35%,#dbeafe_70%,#fde68a_120%)] px-4 py-8 text-slate-800">
      <section className="mx-auto max-w-6xl space-y-3 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          Our Space - mobile design
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Soft romantic mobile UI for a couple&apos;s wishlist and memories
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
          Dreamy pastel gradients, premium glassmorphism cards, emotional copy,
          and cohesive spacing across all core product screens.
        </p>
      </section>

      <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-3">
        <PhoneFrame title="1. Home / wishlist overview">
          <Header />
          <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-900">
            Hi, Artem <span className="text-violet-500">✨</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">Planning dreams together.</p>

          <div className="mt-4 rounded-full bg-white/50 p-1 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-1 text-sm font-medium">
              {(["places", "wishes"] as const).map((tab) => (
                <button
                  key={tab}
                  className={cn(
                    "rounded-full px-4 py-2 transition duration-200",
                    homeTab === tab
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500",
                  )}
                  onClick={() => setHomeTab(tab)}
                  type="button"
                >
                  {tab === "places" ? "Places" : "Wishes"}
                </button>
              ))}
            </div>
          </div>

          <MapPreview />

          <div className="mt-4 space-y-3">
            {homeCards.map((card) => (
              <motion.article
                key={card.title}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="rounded-[22px] border border-white/45 bg-white/55 p-3 shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl"
              >
                <div className="h-20 rounded-[16px] bg-[linear-gradient(135deg,#f9a8d4,#a78bfa,#93c5fd)]" />
                <div className="mt-3">
                  <p className="font-semibold text-slate-900">{card.title}</p>
                  <p className="text-xs text-slate-500">{card.subtitle}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <SoftAction icon={<Heart className="h-4 w-4" />} label="Want" />
                  <SoftAction icon={<Trash2 className="h-4 w-4" />} label="Delete" />
                </div>
              </motion.article>
            ))}
          </div>
          <BottomNav active={activeNav} onChange={setActiveNav} />
        </PhoneFrame>

        <PhoneFrame title="2. Add new item">
          <TopRow title="New wish" />
          <div className="mt-4 space-y-3">
            <InputLike label="Title" />
            <InputLike label="Description" />
            <InputLike label="Category: Place" />
            <InputLike label="Link" />
            <UploadArea />
          </div>
          <button
            className="mt-4 w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4,#fdba74)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(249,168,212,0.45)] transition duration-200 hover:scale-[1.02]"
            type="button"
          >
            Create wish ✨
          </button>
          <BottomNav active="home" onChange={setActiveNav} />
        </PhoneFrame>

        <PhoneFrame title="3. Item detail">
          <TopRow title="Wish detail" />
          <div className="mt-4 overflow-hidden rounded-[22px] border border-white/45 bg-white/55 shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl">
            <div className="relative h-40 bg-[linear-gradient(140deg,#a78bfa_0%,#f9a8d4_60%,#fdba74_120%)]">
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,42,.45),transparent)]" />
            </div>
            <div className="space-y-3 p-4">
              <p className="text-xl font-semibold text-slate-900">Rooftop sunset dinner</p>
              <p className="text-sm leading-6 text-slate-600">
                Warm lights, city skyline, one table for two and our favorite music.
              </p>
              <div className="flex gap-2">
                <SoftAction icon={<CalendarDays className="h-4 w-4" />} label="Done" />
                <SoftAction icon={<Heart className="h-4 w-4" />} label="Favorite" />
                <SoftAction icon={<Trash2 className="h-4 w-4" />} label="Delete" />
              </div>
            </div>
          </div>
          <BottomNav active="home" onChange={setActiveNav} />
        </PhoneFrame>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-3">
        <PhoneFrame title="4. Completed timeline">
          <TopRow title="Memories" />
          <div className="mt-4 space-y-4">
            {timelineItems.map((item) => (
              <article
                key={item.date}
                className="relative rounded-[22px] border border-white/45 bg-white/55 p-4 shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl"
              >
                <span className="text-xs uppercase tracking-[0.16em] text-violet-500">
                  {item.date}
                </span>
                <p className="mt-1 font-semibold text-slate-900">{item.title}</p>
                <div className="mt-3 h-20 rounded-[14px] bg-[linear-gradient(135deg,#f9a8d4,#a78bfa,#93c5fd)]" />
                <p className="mt-2 text-sm text-slate-600">{item.caption}</p>
              </article>
            ))}
          </div>
          <BottomNav active="completed" onChange={setActiveNav} />
        </PhoneFrame>

        <PhoneFrame title="5. Map screen">
          <TopRow title="Map" />
          <div className="mt-4 relative overflow-hidden rounded-[22px] border border-white/45 bg-white/55 p-3 shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl">
            <div className="h-64 rounded-[16px] bg-[radial-gradient(circle_at_20%_20%,#f9a8d4_0%,#d8b4fe_30%,#bfdbfe_68%,#f5d0fe_100%)] opacity-75" />
            <MapPin className="absolute left-10 top-20 h-6 w-6 text-pink-500" />
            <MapPin className="absolute left-1/2 top-28 h-6 w-6 text-violet-500" />
            <MapPin className="absolute right-12 top-16 h-6 w-6 text-sky-500" />
            <div className="absolute bottom-6 left-6 right-6 rounded-[18px] border border-white/50 bg-white/70 p-3 backdrop-blur-lg">
              <p className="font-semibold text-slate-900">Romantic dinner</p>
              <p className="text-xs text-slate-600">Seaside restaurant · tonight</p>
            </div>
          </div>
          <BottomNav active="home" onChange={setActiveNav} />
        </PhoneFrame>

        <PhoneFrame title="6. Couple profile">
          <TopRow title="We" />
          <div className="mt-4 rounded-[22px] border border-white/45 bg-white/55 p-4 text-center shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl">
            <div className="mx-auto flex w-fit items-center gap-2">
              <Avatar label="A" />
              <Heart className="h-4 w-4 text-pink-500" />
              <Avatar label="N" />
            </div>
            <p className="mt-3 text-xl font-semibold text-slate-900">Artem · Nastia</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-left">
              <Stat label="Total wishes" value="28" />
              <Stat label="Completed" value="12" />
            </div>
            <div className="mt-4 space-y-2">
              <SoftButton label="Miss you ❤️" />
              <SoftButton label="Thinking of you 💌" />
              <SoftButton label="Pick random 🎲" />
            </div>
          </div>
          <BottomNav active="profile" onChange={setActiveNav} />
        </PhoneFrame>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 lg:grid-cols-3">
        <PhoneFrame title="7. Notifications">
          <TopRow title="Notifications" trailing={<Search className="h-4 w-4" />} />
          <div className="mt-4 space-y-3">
            {notificationItems.map((item) => (
              <article
                key={item.title}
                className="rounded-[22px] border border-white/45 bg-white/60 p-4 shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <Avatar label="N" small />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <BottomNav active="home" onChange={setActiveNav} />
        </PhoneFrame>

        <PhoneFrame title="8. Empty state">
          <TopRow title="Wishlist" />
          <div className="mt-4 flex h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/65 bg-white/50 px-6 text-center shadow-[0_16px_40px_rgba(167,139,250,0.18)] backdrop-blur-xl">
            <div className="mb-4 rounded-full bg-white/70 p-3">
              <Plus className="h-6 w-6 text-violet-500" />
            </div>
            <p className="text-xl font-semibold text-slate-900">No wishes yet</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Add your first wish ✨ and start collecting moments together.
            </p>
            <button
              className="mt-4 rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4)] px-5 py-2.5 text-sm font-semibold text-white"
              type="button"
            >
              Add first wish
            </button>
          </div>
          <BottomNav active="home" onChange={setActiveNav} />
        </PhoneFrame>

        <PhoneFrame title="9. Design system notes">
          <TopRow title="Design language" />
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <DesignChip label="Pastel gradients" />
            <DesignChip label="Glass panels + blur" />
            <DesignChip label="20-28px rounded corners" />
            <DesignChip label="Soft shadows & glow" />
            <DesignChip label="Minimal spacing-first layout" />
            <DesignChip label="Emotional microcopy and actions" />
            <DesignChip label="Premium modern sans-serif rhythm" />
          </div>
          <div className="mt-5 rounded-[20px] border border-white/45 bg-white/60 p-4 text-xs text-slate-600">
            Bottom navigation uses soft blur and muted iconography for a calm,
            relationship-first mood.
          </div>
          <BottomNav active={activeNav} onChange={setActiveNav} />
        </PhoneFrame>
      </section>
    </main>
  );
}

function PhoneFrame({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="space-y-2">
      <p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
        {title}
      </p>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="rounded-[34px] border border-white/40 bg-white/30 p-3 shadow-[0_28px_80px_rgba(167,139,250,0.2)] backdrop-blur-2xl"
      >
        <div className="relative mx-auto min-h-[680px] max-w-[345px] rounded-[30px] border border-white/45 bg-[linear-gradient(160deg,rgba(255,255,255,0.65),rgba(255,255,255,0.35))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-300/70" />
          {children}
        </div>
      </motion.div>
    </section>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <button className="rounded-full bg-white/70 p-2.5 text-slate-600" type="button">
        <Home className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <Avatar label="A" />
        <Avatar label="N" />
      </div>
      <button className="rounded-full bg-white/70 p-2.5 text-slate-600" type="button">
        <Bell className="h-4 w-4" />
      </button>
    </div>
  );
}

function TopRow({
  title,
  trailing,
}: Readonly<{ title: string; trailing?: React.ReactNode }>) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-2xl font-semibold text-slate-900">{title}</p>
      <div className="rounded-full bg-white/70 p-2 text-slate-600">
        {trailing ?? <Sparkles className="h-4 w-4" />}
      </div>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="mt-4 relative rounded-[22px] border border-white/45 bg-white/55 p-3 shadow-[0_16px_40px_rgba(167,139,250,0.2)] backdrop-blur-xl">
      <div className="h-24 rounded-[14px] bg-[radial-gradient(circle_at_20%_20%,#f9a8d4_0%,#d8b4fe_40%,#bfdbfe_100%)] opacity-75" />
      <MapPin className="absolute left-10 top-8 h-5 w-5 text-pink-500" />
      <MapPin className="absolute right-14 top-12 h-5 w-5 text-violet-500" />
      <MapPin className="absolute left-1/2 top-11 h-5 w-5 text-sky-500" />
    </div>
  );
}

function BottomNav({
  active,
  onChange,
}: Readonly<{ active: NavTab; onChange: (tab: NavTab) => void }>) {
  const items: Array<{ key: NavTab; icon: React.ReactNode; label: string }> = [
    { key: "home", icon: <Home className="h-4 w-4" />, label: "Home" },
    {
      key: "completed",
      icon: <CalendarDays className="h-4 w-4" />,
      label: "Completed",
    },
    { key: "profile", icon: <UserRound className="h-4 w-4" />, label: "Profile" },
  ];

  return (
    <nav className="mt-5 rounded-full border border-white/45 bg-white/60 p-1.5 backdrop-blur-xl">
      <div className="grid grid-cols-3 gap-1">
        {items.map((item) => (
          <button
            key={item.key}
            className={cn(
              "flex items-center justify-center gap-1 rounded-full px-2 py-2 text-[11px] font-medium transition",
              active === item.key
                ? "bg-white text-violet-600 shadow-sm"
                : "text-slate-500",
            )}
            onClick={() => onChange(item.key)}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Avatar({ label, small = false }: Readonly<{ label: string; small?: boolean }>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-white/70 bg-white/70 font-semibold text-violet-700 shadow-sm",
        small ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm",
      )}
    >
      {label}
    </div>
  );
}

function SoftAction({
  icon,
  label,
}: Readonly<{ icon: React.ReactNode; label: string }>) {
  return (
    <button
      className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-700 transition duration-200 hover:scale-[1.02]"
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function SoftButton({ label }: Readonly<{ label: string }>) {
  return (
    <button
      className="w-full rounded-full bg-[linear-gradient(135deg,rgba(167,139,250,.88),rgba(249,168,212,.88))] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02]"
      type="button"
    >
      {label}
    </button>
  );
}

function InputLike({ label }: Readonly<{ label: string }>) {
  return (
    <div className="rounded-[16px] border border-white/45 bg-white/65 px-4 py-3 text-sm text-slate-500 shadow-[0_12px_30px_rgba(167,139,250,0.12)] backdrop-blur-lg">
      {label}
    </div>
  );
}

function UploadArea() {
  return (
    <div className="rounded-[18px] border border-dashed border-white/60 bg-white/55 p-4 text-center text-sm text-slate-600">
      <Plus className="mx-auto mb-2 h-5 w-5 text-violet-500" />
      Upload image
    </div>
  );
}

function Stat({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="rounded-[14px] bg-white/65 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DesignChip({ label }: Readonly<{ label: string }>) {
  return (
    <p className="rounded-full bg-white/65 px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-slate-600">
      {label}
    </p>
  );
}
