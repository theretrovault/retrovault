import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

type Props = { params: { token: string } };

export default function PublicCollectionPage({ params }: Props) {
  const configPath = path.join(process.cwd(), "data", "app.config.json");
  if (!fs.existsSync(configPath)) return notFound();

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  if (!config.publicToken || config.publicToken !== params.token) return notFound();

  const invPath = path.join(process.cwd(), "data", "inventory.json");
  const inventory = fs.existsSync(invPath) ? JSON.parse(fs.readFileSync(invPath, "utf8")) : [];
  const owned = inventory.filter((i: any) => (i.copies || []).length > 0 && !i.isDigital);

  const platforms = [...new Set(owned.map((i: any) => i.platform))] as string[];
  const platformCounts: Record<string, number> = {};
  for (const item of owned) {
    platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-green-400 font-terminal p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-green-800 p-6 mb-8 text-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
          <div className="text-4xl mb-2">👾</div>
          <h1 className="text-3xl uppercase tracking-widest text-green-400 mb-1">
            {config.ownerName ? `${config.ownerName}'s Collection` : (config.appName || "RetroVault")}
          </h1>
          <p className="text-zinc-500 text-sm">{owned.length} games across {platforms.length} platforms</p>
        </div>

        {/* Platform breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([plat, count]) => (
              <div key={plat} className="border border-green-900 bg-black p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{count}</div>
                <div className="text-zinc-500 text-xs">{plat}</div>
              </div>
            ))}
        </div>

        {/* Games by platform */}
        {platforms.sort().map(plat => {
          const games = owned.filter((i: any) => i.platform === plat);
          return (
            <div key={plat} className="mb-6">
              <h2 className="text-green-600 uppercase text-lg border-b border-green-900 pb-1 mb-3">{plat} ({games.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {games.sort((a: any, b: any) => a.title.localeCompare(b.title)).map((game: any) => {
                  const copy = game.copies?.[0];
                  return (
                    <div key={game.id} className="border border-zinc-800 p-2 hover:border-zinc-600 transition-colors">
                      <div className="text-zinc-200 text-sm truncate">{game.title}</div>
                      <div className="text-zinc-600 text-xs flex gap-2 mt-0.5">
                        {copy?.condition && <span>{copy.condition}</span>}
                        {copy?.hasBox && copy?.hasManual && <span className="text-green-700">CIB</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-8 text-center text-zinc-700 text-xs border-t border-zinc-900 pt-4">
          Powered by RetroVault · Read-only public view · Prices and business data not shown
        </div>
      </div>
    </div>
  );
}
