"use client";

import { useEffect, useState } from "react";

type MediaItem = {
  id: string;
  title: string;
  year: number | string;
  durationMinutes: number | string;
  contentRating: string;
  rating: number | string;
  summary: string;
  type: string;
  seasons: number;
  episodes: number;
};

const LIBRARIES = [
  { id: "1", name: "Movies", icon: "🎬" },
  { id: "2", name: "TV Shows", icon: "📺" },
  { id: "3", name: "Music", icon: "🎵" },
];

export default function PlexPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof MediaItem>("title");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [pageSize, setPageSize] = useState<number | "all">(100);
  const [activeLibrary, setActiveLibrary] = useState("1");

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSearch("");
    
    fetch(`/api/plex/library?sectionId=${activeLibrary}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setItems(data.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeLibrary]);

  const handleSort = (field: keyof MediaItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedItems = items
    .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (aVal === "N/A") aVal = 0;
      if (bVal === "N/A") bVal = 0;
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const displayedItems = pageSize === "all" ? filteredAndSortedItems : filteredAndSortedItems.slice(0, pageSize);

  const getExternalLink = (title: string, type: string, year: number | string) => {
    if (type === "artist" || type === "album" || type === "track") {
      return `https://www.last.fm/search?q=${encodeURIComponent(title)}`;
    }
    const query = encodeURIComponent(`${title} ${year !== "N/A" ? year : ""}`.trim());
    return `https://www.imdb.com/find/?q=${query}`;
  };

  return (
    <div className="w-full bg-black border-4 border-green-500 rounded p-6 shadow-[0_0_15px_rgba(34,197,94,0.3)] min-h-[80vh] flex flex-col">
      <header className="mb-6 border-b-4 border-green-900 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-3xl">PLEX</span>
          <h2 className="text-3xl text-green-400 tracking-widest uppercase">Databases</h2>
        </div>
        
        {/* Library Switcher */}
        <div className="flex gap-2">
          {LIBRARIES.map((lib) => (
            <button
              key={lib.id}
              onClick={() => setActiveLibrary(lib.id)}
              className={`px-4 py-2 font-terminal text-lg uppercase transition-colors border-2 ${
                activeLibrary === lib.id 
                  ? "bg-green-600 text-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                  : "bg-black text-green-500 border-green-900 hover:bg-green-900/30"
              }`}
            >
              <span className="mr-2">{lib.icon}</span>
              {lib.name}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="text-red-500 font-terminal text-2xl mb-4">
          [ERROR] {error}
        </div>
      )}

      <div className="mb-6 flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center w-full max-w-md">
          <input
            type="text"
            placeholder={`SEARCH ${LIBRARIES.find(l => l.id === activeLibrary)?.name.toUpperCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-950 border-2 border-green-800 text-green-400 p-2 font-terminal text-xl uppercase w-full focus:outline-none focus:border-green-500"
          />
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={pageSize} 
            onChange={(e) => setPageSize(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="bg-zinc-950 border-2 border-green-800 text-green-400 p-2 font-terminal text-xl uppercase focus:outline-none focus:border-green-500 cursor-pointer"
          >
            <option value={100}>SHOW: 100</option>
            <option value={1000}>SHOW: 1000</option>
            <option value="all">SHOW: ALL</option>
          </select>
          <div className="font-terminal text-green-700 text-xl whitespace-nowrap">
            {displayedItems.length} / {filteredAndSortedItems.length} RECORDS
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-green-500 font-terminal text-2xl animate-pulse">
          FETCHING MANIFEST FOR SECTOR {activeLibrary}...
        </div>
      ) : (
        <div className="flex-1 overflow-auto border-2 border-green-900 rounded bg-zinc-950">
          <table className="w-full text-left font-terminal text-lg whitespace-nowrap">
            <thead className="sticky top-0 bg-zinc-900 border-b-2 border-green-800 text-green-500 uppercase select-none">
              <tr>
                <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("title")}>
                  Title {sortField === "title" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("year")}>
                  Year {sortField === "year" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                
                {/* TV Shows specific columns */}
                {activeLibrary === "2" ? (
                  <>
                    <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("seasons")}>
                      Seasons {sortField === "seasons" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("episodes")}>
                      Episodes {sortField === "episodes" && (sortOrder === "asc" ? "▲" : "▼")}
                    </th>
                  </>
                ) : (
                  <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("durationMinutes")}>
                    Length {sortField === "durationMinutes" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                )}

                <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("contentRating")}>
                  Rating {sortField === "contentRating" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
                <th className="p-3 cursor-pointer hover:bg-zinc-800" onClick={() => handleSort("rating")}>
                  Score {sortField === "rating" && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map((item, index) => (
                <tr 
                  key={item.id} 
                  className={`border-b border-green-900/30 hover:bg-green-900/20 transition-colors ${index % 2 === 0 ? 'bg-black/20' : ''}`}
                >
                  <td className="p-3 text-green-300 font-bold max-w-xs truncate" title={item.title}>
                    <a 
                      href={getExternalLink(item.title, item.type, item.year)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-green-100 hover:underline cursor-pointer"
                    >
                      {item.title}
                    </a>
                  </td>
                  <td className="p-3 text-green-400">{item.year}</td>
                  
                  {/* TV Shows specific columns */}
                  {activeLibrary === "2" ? (
                    <>
                      <td className="p-3 text-green-600">{item.seasons}</td>
                      <td className="p-3 text-green-600">{item.episodes}</td>
                    </>
                  ) : (
                    <td className="p-3 text-green-600">{item.durationMinutes === "N/A" ? "N/A" : `${item.durationMinutes}m`}</td>
                  )}

                  <td className="p-3 text-green-600">{item.contentRating}</td>
                  <td className="p-3 text-green-500">{item.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
