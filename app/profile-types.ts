import favorites from "../content/favorites.json";

export type FavoriteItem = { title: string; note: string; url: string };
export type ProfileContent = {
  about: string;
  albums: FavoriteItem[];
  movies: FavoriteItem[];
  courses: FavoriteItem[];
};

export const DEFAULT_PROFILE: ProfileContent = { about: "", ...favorites };
