type Category = "albums" | "movies" | "courses";

export type FavoriteMedia = {
  category: Category;
  title: string;
  aliases?: string[];
  src: string;
  alt: string;
  sourceUrl: string;
  credit: string;
  licenseUrl?: string;
  license?: string;
};

export const FAVORITE_MEDIA: FavoriteMedia[] = [
  { category: "albums", title: "Cornell ’77 (Live)", aliases: ["Cornell 5/8/77", "Cornell 5/8/77 (Live)", "Cornell 77"], src: "/favorites/albums/cornell-77.jpg", alt: "Cornell 5/8/77 live album cover by the Grateful Dead", sourceUrl: "https://music.apple.com/us/album/cornell-5-8-77-live/1204914175", credit: "Album artwork via Apple Music" },
  { category: "albums", title: "WUNNA (Deluxe)", aliases: ["Wunna Deluxe"], src: "/favorites/albums/wunna-deluxe.jpg", alt: "Green WUNNA Deluxe album cover by Gunna", sourceUrl: "https://music.apple.com/us/album/wunna-deluxe/1525028341", credit: "Album artwork via Apple Music" },
  { category: "albums", title: "Panic in the Streets", src: "/favorites/albums/panic-in-the-streets.jpg", alt: "Panic in the Streets album cover by Widespread Panic", sourceUrl: "https://music.apple.com/us/album/panic-in-the-streets/303180720", credit: "Album artwork via Apple Music" },
  { category: "movies", title: "Scarface", src: "/favorites/movies/scarface.jpg", alt: "Official Scarface movie poster featuring Al Pacino", sourceUrl: "https://www.universalpicturesathome.com/movies/scarface-1983", credit: "Poster: Universal Pictures" },
  { category: "movies", title: "Hereditary", src: "/favorites/movies/hereditary.jpg", alt: "Official Hereditary movie poster", sourceUrl: "https://a24films.com/films/hereditary", credit: "Poster: A24" },
  { category: "movies", title: "Smokey and the Bandit", src: "/favorites/movies/smokey-and-the-bandit.jpg", alt: "Official Smokey and the Bandit movie poster", sourceUrl: "https://www.universalpicturesathome.com/movies/smokey-and-the-bandit", credit: "Poster: Universal Pictures" },
  { category: "courses", title: "Tobacco Road", aliases: ["Tobacco Road Golf Club"], src: "/favorites/courses/tobacco-road.jpg", alt: "Aerial view of Tobacco Road Golf Club", sourceUrl: "https://tobaccoroadgolf.com/", credit: "Photo: Tobacco Road Golf Club" },
  { category: "courses", title: "Torrey Pines", src: "/favorites/courses/torrey-pines.jpg", alt: "Torrey Pines North Course overlooking the Pacific Ocean at sunset", sourceUrl: "https://www.sandiego.gov/torrey-pines", credit: "Photo: City of San Diego" },
  { category: "courses", title: "The Old Course at St Andrews", aliases: ["Old Course at St Andrews", "The Old Course", "St Andrews Old Course"], src: "/favorites/courses/st-andrews-old-course.jpg", alt: "Swilcan Bridge on the Old Course at St Andrews", sourceUrl: "https://commons.wikimedia.org/wiki/File:Swilcan_Bridge_at_St._Andrews.jpg", credit: "Photo: Eddy23 / Wikimedia Commons", license: "CC BY-SA 4.0; cropped for display", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
];

function normalize(title: string) {
  return title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getFavoriteMedia(category: Category, title: string) {
  const key = normalize(title);
  return FAVORITE_MEDIA.find(item => item.category === category && [item.title, ...(item.aliases || [])].some(alias => normalize(alias) === key));
}
