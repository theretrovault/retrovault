import { getJournalEntries } from "@/lib/markdown";

export default async function JournalPage() {
  const { pastTwoWeeks, thisMonth, yearly } = await getJournalEntries();

  return (
    <div className="w-full bg-black border-4 border-green-500 rounded p-6 shadow-[0_0_15px_rgba(34,197,94,0.3)] min-h-[80vh]">
      <header className="mb-8 border-b-4 border-green-900 pb-6 flex items-center gap-4">
        <span className="text-3xl">💾</span>
        <h2 className="text-3xl text-green-400 tracking-widest uppercase">Memory Bank</h2>
      </header>

      <div className="space-y-10">
        
        {/* Daily Journal (Past 2 Weeks) */}
        <section>
          <h3 className="text-2xl text-green-300 mb-6 border-b-2 border-green-900/50 pb-2 uppercase tracking-wide">
            Daily Journal (Recent)
          </h3>
          <div className="space-y-6 pl-4 border-l-2 border-green-800">
            {pastTwoWeeks.length > 0 ? pastTwoWeeks.map((entry) => (
              <article key={entry.filename} className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-500 rounded-sm"></div>
                <h4 className="text-green-500 font-terminal text-2xl mb-2">{entry.dateStr}</h4>
                <div 
                  className="markdown-body bg-zinc-950 p-4 border border-green-900 rounded-sm"
                  dangerouslySetInnerHTML={{ __html: entry.contentHtml }} 
                />
              </article>
            )) : (
              <p className="font-terminal text-green-700 text-xl">NO RECENT MEMORIES FOUND.</p>
            )}
          </div>
        </section>

        {/* This Month (Collapsible) */}
        <section>
          <details className="group">
            <summary className="text-2xl text-green-300 mb-4 border-b-2 border-green-900/50 pb-2 uppercase tracking-wide cursor-pointer list-none flex justify-between items-center hover:text-green-100 transition-colors">
              <span>This Month</span>
              <span className="font-terminal text-green-600 group-open:rotate-90 transition-transform">&gt;</span>
            </summary>
            <div className="space-y-6 pl-4 border-l-2 border-green-800 mt-4">
              {thisMonth.length > 0 ? thisMonth.map((entry) => (
                <article key={entry.filename} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-700 rounded-sm"></div>
                  <h4 className="text-green-600 font-terminal text-2xl mb-2">{entry.dateStr}</h4>
                  <div 
                    className="markdown-body bg-zinc-950 p-4 border border-green-900/50 rounded-sm opacity-80"
                    dangerouslySetInnerHTML={{ __html: entry.contentHtml }} 
                  />
                </article>
              )) : (
                <p className="font-terminal text-green-700 text-xl">NO ARCHIVES FOR THIS MONTH.</p>
              )}
            </div>
          </details>
        </section>

        {/* Yearly Archives (Collapsible) */}
        {Object.keys(yearly).sort((a, b) => Number(b) - Number(a)).map(year => (
          <section key={year}>
            <details className="group">
              <summary className="text-2xl text-green-300 mb-4 border-b-2 border-green-900/50 pb-2 uppercase tracking-wide cursor-pointer list-none flex justify-between items-center hover:text-green-100 transition-colors">
                <span>Archive: {year}</span>
                <span className="font-terminal text-green-600 group-open:rotate-90 transition-transform">&gt;</span>
              </summary>
              <div className="space-y-6 pl-4 border-l-2 border-green-800 mt-4">
                {yearly[year].map((entry) => (
                  <article key={entry.filename} className="relative">
                    <div className="absolute -left-[21px] top-1 w-3 h-3 bg-green-900 rounded-sm"></div>
                    <h4 className="text-green-700 font-terminal text-2xl mb-2">{entry.dateStr}</h4>
                    <div 
                      className="markdown-body bg-zinc-950 p-4 border border-green-900/30 rounded-sm opacity-60"
                      dangerouslySetInnerHTML={{ __html: entry.contentHtml }} 
                    />
                  </article>
                ))}
              </div>
            </details>
          </section>
        ))}

      </div>
    </div>
  );
}
