import { getChatGPTUser } from "../../chatgpt-auth";
import { isOwner, profileDb, profileRow, readProfile } from "../../profile-store";
import type { FavoriteItem, ProfileContent } from "../../profile-types";
import { FAVORITES_PRESET_VERSION } from "../../profile-types";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

function validateProfile(input: unknown): ProfileContent {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid profile.");
  const value = input as Record<string, unknown>;
  if (typeof value.about !== "string" || value.about.length > 2000) throw new Error("About must be 2,000 characters or fewer.");
  const cleanList = (list: unknown, label: string): FavoriteItem[] => {
    if (!Array.isArray(list) || list.length > 6) throw new Error(`Add up to six ${label}.`);
    return list.map(item => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`Invalid ${label} entry.`);
      const favorite = item as Record<string, unknown>;
      if (typeof favorite.title !== "string" || !favorite.title.trim() || favorite.title.length > 120) throw new Error("Each favorite needs a title of up to 120 characters.");
      if (typeof favorite.note !== "string" || favorite.note.length > 240) throw new Error("Notes must be 240 characters or fewer.");
      if (typeof favorite.url !== "string" || favorite.url.length > 1500) throw new Error("Invalid favorite link.");
      let url = favorite.url.trim();
      if (url) {
        try { const parsed = new URL(url); if (parsed.protocol !== "https:") throw new Error(); url = parsed.href; }
        catch { throw new Error("Favorite links must begin with https://."); }
      }
      return { title: favorite.title.trim(), note: favorite.note.trim(), url };
    });
  };
  return { about: value.about.trim(), albums: cleanList(value.albums, "albums"), movies: cleanList(value.movies, "movies"), courses: cleanList(value.courses, "golf courses") };
}

export async function GET() {
  try { return Response.json(await readProfile(), { headers: noStore }); }
  catch { return Response.json({ error: "Could not load your profile. Please try again." }, { status: 503, headers: noStore }); }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to edit your profile." }, { status: 401, headers: noStore });
  const requestOrigin = request.headers.get("Origin");
  if (!requestOrigin || requestOrigin !== new URL(request.url).origin) return Response.json({ error: "This update must come from your website." }, { status: 403, headers: noStore });
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) return Response.json({ error: "Send profile updates as JSON." }, { status: 415, headers: noStore });
  if (Number(request.headers.get("Content-Length") || "0") > 50000) return Response.json({ error: "Profile update is too large." }, { status: 413, headers: noStore });
  let row: Awaited<ReturnType<typeof profileRow>>;
  try { row = await profileRow(); }
  catch { return Response.json({ error: "Could not load your profile. Please try again." }, { status: 503, headers: noStore }); }
  if (!isOwner(user, row)) return Response.json({ error: "Only Gio can edit this profile." }, { status: 403, headers: noStore });
  let profile: ProfileContent;
  try { const raw = await request.text(); if (raw.length > 50000) throw new Error("Profile update is too large."); profile = validateProfile(JSON.parse(raw)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid profile update." }, { status: 400, headers: noStore }); }
  try {
    const result = await profileDb().prepare("INSERT INTO profile (id, owner_user_id, about, favorites, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET about = excluded.about, favorites = excluded.favorites, updated_at = excluded.updated_at WHERE profile.owner_user_id = excluded.owner_user_id")
      .bind("main", user.userId, profile.about, JSON.stringify({ presetVersion: FAVORITES_PRESET_VERSION, albums: profile.albums, movies: profile.movies, courses: profile.courses }), new Date().toISOString()).run();
    if (result.meta.changes !== 1) return Response.json({ error: "This profile belongs to another user." }, { status: 403, headers: noStore });
    return Response.json({ profile, canEdit: true }, { headers: noStore });
  } catch { return Response.json({ error: "Could not save your changes. Your draft is still here; please try again." }, { status: 503, headers: noStore }); }
}
