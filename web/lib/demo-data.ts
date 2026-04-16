import type { AppState } from "@/lib/types";

const now = new Date();

export const demoState: AppState = {
  authMode: "password",
  currentUserId: "user-1",
  users: [
    {
      id: "user-1",
      email: "luna@ourspace.dev",
      displayName: "Luna",
      avatar: "L",
      createdAt: now.toISOString(),
    },
    {
      id: "user-2",
      email: "kai@ourspace.dev",
      displayName: "Kai",
      avatar: "K",
      createdAt: now.toISOString(),
    },
  ],
  couple: {
    id: "couple-1",
    inviteCode: "invite-our-space",
    createdBy: "user-1",
    memberIds: ["user-1", "user-2"],
    status: "active",
    createdAt: now.toISOString(),
  },
  wishes: [
    {
      id: "wish-1",
      title: "Sunrise picnic by the river",
      description:
        "Bring cinnamon rolls, a thermos of coffee and the little speaker playlist.",
      category: "wish",
      images: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      ],
      status: "planned",
      createdBy: "user-1",
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
      link: "https://open.spotify.com/",
      likedBy: ["user-2"],
    },
    {
      id: "wish-2",
      title: "Tiny ramen bar downtown",
      description: "Save it for a rainy evening after work.",
      category: "place",
      images: [
        "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=900&q=80",
      ],
      location: {
        lat: 40.73061,
        lng: -73.935242,
        name: "East Village, NYC",
      },
      status: "planned",
      createdBy: "user-2",
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 8).toISOString(),
      likedBy: ["user-1"],
    },
    {
      id: "wish-3",
      title: "Autumn weekend in Prague",
      description:
        "Walk old town at night, coffee near the bridge and one fancy dinner.",
      category: "trip",
      images: [
        "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=900&q=80",
      ],
      location: {
        lat: 50.0755,
        lng: 14.4378,
        name: "Prague, Czechia",
      },
      status: "done",
      createdBy: "user-1",
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 25).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      doneAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      howItWent: "Golden hour on the bridge was absurdly pretty. We should go back.",
      likedBy: ["user-2"],
    },
  ],
  notifications: [
    {
      id: "notification-1",
      type: "thinking",
      fromUser: "user-2",
      toUser: "user-1",
      createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    {
      id: "notification-2",
      type: "custom",
      message: "Tonight feels like dessert + blankets?",
      fromUser: "user-1",
      toUser: "user-2",
      createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
      read: true,
    },
  ],
};

export const DEMO_STORAGE_KEY = "our-space-demo-state";
