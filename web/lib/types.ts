export type WishCategory = "wish" | "place" | "trip";
export type WishStatus = "planned" | "done";
export type NotificationType =
  | "miss_you"
  | "thinking"
  | "hug"
  | "custom"
  | "wish_liked"
  | "wish_done";

export type AuthMode = "password" | "magic-link";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  createdAt: string;
};

export type Couple = {
  id: string;
  inviteCode: string;
  createdBy: string;
  memberIds: string[];
  status: "pending" | "active";
  createdAt: string;
};

export type WishLocation = {
  lat: number;
  lng: number;
  name: string;
};

export type Wish = {
  id: string;
  title: string;
  description?: string;
  category: WishCategory;
  images: string[];
  link?: string;
  location?: WishLocation;
  status: WishStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  doneAt?: string;
  howItWent?: string;
  likedBy: string[];
};

export type PartnerNotification = {
  id: string;
  type: NotificationType;
  message?: string;
  fromUser: string;
  toUser: string;
  createdAt: string;
  read: boolean;
};

export type AppState = {
  authMode: AuthMode;
  currentUserId: string | null;
  users: UserProfile[];
  couple: Couple;
  wishes: Wish[];
  notifications: PartnerNotification[];
};

export type WishFormValues = {
  id?: string;
  title: string;
  description: string;
  category: WishCategory;
  link: string;
  imageUrls: string;
  locationName: string;
  latitude: string;
  longitude: string;
  status: WishStatus;
  howItWent: string;
};
