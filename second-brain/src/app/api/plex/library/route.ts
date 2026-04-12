import { NextResponse } from 'next/server';
import https from 'https';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get('sectionId') || '1';

  const PLEX_URL = `https://192.168.1.2:32400/library/sections/${sectionId}/all`;
  const PLEX_TOKEN = "s3_dpsVi8rCxG-ciJP32";

  return new Promise<NextResponse>((resolve) => {
    const agent = new https.Agent({
      rejectUnauthorized: false
    });

    const options = {
      agent,
      headers: {
        'Accept': 'application/json'
      }
    };

    https.get(`${PLEX_URL}?X-Plex-Token=${PLEX_TOKEN}`, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode && res.statusCode >= 400) {
            resolve(NextResponse.json({ error: `Plex API responded with ${res.statusCode}` }, { status: res.statusCode }));
            return;
          }

          const parsedData = JSON.parse(data);
          const items = parsedData.MediaContainer?.Metadata || [];

          // Map items dynamically based on the type of media returned
          const formattedItems = items.map((m: any) => ({
            id: m.ratingKey,
            title: m.title || "Unknown",
            year: m.year || "N/A",
            durationMinutes: m.duration ? Math.floor(m.duration / 60000) : "N/A",
            contentRating: m.contentRating || 'NR',
            rating: m.audienceRating || m.rating || 'N/A',
            summary: m.summary || '',
            addedAt: m.addedAt,
            type: m.type,
            // TV Specific
            seasons: m.childCount || 0,
            episodes: m.leafCount || 0
          }));

          resolve(NextResponse.json({ items: formattedItems }));
        } catch (error: any) {
          console.error("Error parsing Plex data:", error);
          resolve(NextResponse.json({ error: "Failed to parse data from Plex" }, { status: 500 }));
        }
      });
    }).on('error', (err) => {
      console.error("Error fetching Plex items:", err);
      resolve(NextResponse.json({ error: err.message || "Failed to fetch from Plex" }, { status: 500 }));
    });
  });
}
