import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "./chatgpt-auth";
import { DEFAULT_PROFILE, FAVORITES_PRESET_VERSION, type ProfileContent } from "./profile-types";

type ProfileRow = {
  owner_user_id: string;
  favorites: string;
};

export function profileDb() {
  if (!env.DB) throw new Error("The profile database is unavailable.");
  return env.DB;
}

export async function profileRow() {
  return profileDb().prepare("SELECT owner_user_id, favorites FROM profile WHERE id = ?")
    .bind("main").first<ProfileRow>();
}

export function isOwner(user: ChatGPTUser | null, row: ProfileRow | null) {
  if (!user) return false;
  if (row) return row.owner_user_id === user.userId;
  const configuredEmail = env.SITE_OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(configuredEmail && user.email.trim().toLowerCase() === configuredEmail);
}

export function rowContent(row: ProfileRow | null): ProfileContent {
  if (!row) return structuredClone(DEFAULT_PROFILE);
  const saved = JSON.parse(row.favorites);
  // Apply the user's requested initial list once; later owner edits remain durable.
  const favorites = saved.presetVersion === FAVORITES_PRESET_VERSION ? saved : DEFAULT_PROFILE;
  return {
    about: "",
    albums: favorites.albums || [],
    movies: favorites.movies || [],
    courses: favorites.courses || [],
  };
}

export async function readProfile() {
  const [row, user] = await Promise.all([profileRow(), getChatGPTUser()]);
  return { profile: rowContent(row), canEdit: isOwner(user, row) };
}
