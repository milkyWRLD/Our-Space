"use client";

import { motion } from "framer-motion";
import {
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Screen = "home" | "add" | "notifications" | "completed" | "map" | "profile";
type HomeMode = "places" | "wishes";

const cards = [
  { title: "Романтический ужин", subtitle: "Ресторан у моря" },
  { title: "Париж на выходные", subtitle: "Париж, Франция" },
];

export function RomanticMobileApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [homeMode, setHomeMode] = useState<HomeMode>("places");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#f5d0fe_0%,#e9d5ff_35%,#dbeafe_70%,#fde7f3_100%)] px-4 py-8">
      <div className="mx-auto w-full max-w-sm rounded-[40px] border border-white/50 bg-white/25 p-3 shadow-[0_30px_120px_rgba(167,139,250,0.35)] backdrop-blur-2xl">
        <div className="rounded-[34px] border border-white/55 bg-[linear-gradient(160deg,rgba(255,255,255,.65),rgba(255,255,255,.35))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-300/70" />

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
                  <Settings className="h-4 w-4" />
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
                <div className="h-20 rounded-[14px] bg-[radial-gradient(circle_at_20%_20%,#f9a8d4_0%,#d8b4fe_40%,#bfdbfe_100%)] opacity-75" />
                <MapPin className="absolute left-10 top-8 h-5 w-5 text-pink-500" />
                <MapPin className="absolute right-14 top-10 h-5 w-5 text-violet-500" />
              </div>

              <div className="space-y-3">
                {cards.map((card) => (
                  <motion.article
                    key={card.title}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="rounded-[22px] border border-white/50 bg-white/60 p-3 shadow-[0_16px_44px_rgba(167,139,250,0.2)]"
                  >
                    <div className="h-20 rounded-[14px] bg-[linear-gradient(120deg,#a78bfa,#f9a8d4,#93c5fd)]" />
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{card.title}</p>
                        <p className="text-xs text-slate-500">{card.subtitle}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <PillButton label="Хочу 💫" />
                      <PillButton label="Удалить" />
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {screen === "add" && (
            <section className="space-y-3">
              <TopBar title="Новое желание" trailing={<Plus className="h-4 w-4" />} />
              <Field label="Название" />
              <Field label="Описание" />
              <Field label="Категория · Место" />
              <Field label="Ссылка" />
              <div className="rounded-[18px] border border-dashed border-white/60 bg-white/55 p-4 text-center text-sm text-slate-600">
                + Загрузить изображение
              </div>
              <button className="w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4,#fdba74)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(249,168,212,0.45)]">
                Создать мечту ✨
              </button>
            </section>
          )}

          {screen === "notifications" && (
            <section className="space-y-3">
              <TopBar title="Уведомления" trailing={<Search className="h-4 w-4" />} />
              {[
                "Настя ❤️ скучает по тебе",
                "Артём думает о тебе",
              ].map((item) => (
                <article
                  key={item}
                  className="rounded-[22px] border border-white/50 bg-white/60 p-4 shadow-[0_16px_44px_rgba(167,139,250,0.2)]"
                >
                  <div className="flex gap-3">
                    <Avatar label="Н" small />
                    <div>
                      <p className="font-semibold text-slate-900">{item}</p>
                      <p className="text-sm text-slate-600">Отправь ответное тепло 💌</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {screen === "completed" && (
            <section className="space-y-3">
              <TopBar title="Что мы уже сделали" trailing={<Heart className="h-4 w-4" />} />
              <article className="rounded-[22px] border border-white/50 bg-white/60 p-4 shadow-[0_16px_44px_rgba(167,139,250,0.2)]">
                <p className="text-xs uppercase tracking-[0.16em] text-violet-500">19 января</p>
                <p className="mt-1 font-semibold text-slate-900">Романтический ужин</p>
                <div className="mt-2 h-24 rounded-[14px] bg-[linear-gradient(120deg,#a78bfa,#f9a8d4,#93c5fd)]" />
                <p className="mt-2 text-sm text-slate-600">Потрясающий вид, хотим вернуться!</p>
              </article>
            </section>
          )}

          {screen === "map" && (
            <section className="space-y-3">
              <TopBar title="Ваши желания" trailing={<MapPin className="h-4 w-4" />} />
              <div className="relative rounded-[22px] border border-white/50 bg-white/60 p-3 shadow-[0_16px_44px_rgba(167,139,250,0.2)]">
                <div className="h-64 rounded-[16px] bg-[radial-gradient(circle_at_20%_20%,#f9a8d4_0%,#d8b4fe_40%,#bfdbfe_100%)] opacity-75" />
                <MapPin className="absolute left-12 top-14 h-5 w-5 text-pink-500" />
                <MapPin className="absolute left-1/2 top-24 h-5 w-5 text-violet-500" />
                <div className="absolute bottom-5 left-5 right-5 rounded-[16px] border border-white/60 bg-white/75 p-3">
                  <p className="font-semibold text-slate-900">Романтический ужин</p>
                  <p className="text-xs text-slate-600">Ресторан у моря</p>
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
                  <button className="rounded-[14px] bg-white/70 px-3 py-2 text-sm font-medium text-slate-700">
                    Скучаю ❤️
                  </button>
                  <button className="rounded-[14px] bg-white/70 px-3 py-2 text-sm font-medium text-slate-700">
                    Думаю о тебе 💌
                  </button>
                </div>
                <button className="mt-3 w-full rounded-full bg-[linear-gradient(135deg,#a78bfa,#f9a8d4)] px-4 py-2.5 text-sm font-semibold text-white">
                  Выбрать случайное 🎲
                </button>
              </div>
            </section>
          )}

          <BottomNav screen={screen} setScreen={setScreen} />
        </div>
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

function Field({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] border border-white/50 bg-white/65 px-4 py-3 text-sm text-slate-500">
      {label}
    </div>
  );
}

function PillButton({ label }: { label: string }) {
  return (
    <button className="rounded-full bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700">
      {label}
    </button>
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
