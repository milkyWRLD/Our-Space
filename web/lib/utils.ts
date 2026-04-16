import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { NotificationType, WishCategory } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relativeGreeting(type: NotificationType) {
  switch (type) {
    case "miss_you":
      return "Miss you";
    case "thinking":
      return "Thinking of you";
    case "hug":
      return "Need a hug";
    case "wish_liked":
      return "Liked your idea";
    case "wish_done":
      return "Marked it done";
    case "custom":
      return "Left a note";
    default:
      return "Sent a nudge";
  }
}

export function categoryLabel(category: WishCategory) {
  switch (category) {
    case "wish":
      return "Wishlist";
    case "place":
      return "Place";
    case "trip":
      return "Trip";
    default:
      return category;
  }
}

export function buildInviteLink(inviteCode: string) {
  return `our-space://join/${inviteCode}`;
}

export function sanitizeUrl(value: string) {
  if (!value.trim()) {
    return "";
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}
