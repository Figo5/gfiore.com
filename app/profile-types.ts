export type FavoriteItem = { title: string; note: string; url: string };
export type ProfileContent = {
  about: string;
  albums: FavoriteItem[];
  movies: FavoriteItem[];
  courses: FavoriteItem[];
};

export const FAVORITES_PRESET_VERSION = 1;

export const DEFAULT_PROFILE: ProfileContent = {
  about: "",
  albums: [
    { title: "Cornell ’77 (Live)", note: "Grateful Dead", url: "" },
    { title: "WUNNA (Deluxe)", note: "Gunna", url: "" },
    { title: "Panic in the Streets", note: "Widespread Panic", url: "" },
  ],
  movies: [
    { title: "Scarface", note: "", url: "" },
    { title: "Hereditary", note: "", url: "" },
    { title: "Smokey and the Bandit", note: "", url: "" },
  ],
  courses: [
    { title: "Tobacco Road", note: "", url: "" },
    { title: "Torrey Pines", note: "", url: "" },
    { title: "The Old Course at St Andrews", note: "", url: "" },
  ],
};
