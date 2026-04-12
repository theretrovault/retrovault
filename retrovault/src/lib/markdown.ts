import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { parseISO, differenceInDays, isSameMonth, isSameYear, startOfToday } from 'date-fns';

const workspaceDirectory = path.join(process.cwd(), '..'); 
const memoryDirectory = path.join(workspaceDirectory, 'memory');

export async function getMarkdownContent(filename: string) {
  const fullPath = path.join(workspaceDirectory, filename);
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    const processedContent = await remark().use(html).process(matterResult.content);
    return {
      filename,
      contentHtml: processedContent.toString(),
      ...(matterResult.data as { [key: string]: any }),
    };
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function getJournalEntries() {
  if (!fs.existsSync(memoryDirectory)) return { pastTwoWeeks: [], thisMonth: [], yearly: {} };

  const fileNames = fs.readdirSync(memoryDirectory).filter(f => f.endsWith('.md'));
  const today = startOfToday();

  const entries = await Promise.all(fileNames.map(async (filename) => {
    const dateStr = filename.replace(/\.md$/, '');
    const dateObj = parseISO(dateStr);
    
    // Skip if filename isn't a valid date
    if (isNaN(dateObj.getTime())) return null;

    const fullPath = path.join(memoryDirectory, filename);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    const processedContent = await remark().use(html).process(matterResult.content);

    return {
      filename,
      dateStr,
      dateObj,
      contentHtml: processedContent.toString(),
      ...(matterResult.data as { [key: string]: any })
    };
  }));

  const validEntries = entries.filter(e => e !== null) as any[];
  // Sort newest first
  validEntries.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

  const pastTwoWeeks: any[] = [];
  const thisMonth: any[] = [];
  const yearly: Record<string, any[]> = {};

  for (const entry of validEntries) {
    const daysDiff = differenceInDays(today, entry.dateObj);
    
    if (daysDiff <= 14 && daysDiff >= 0) {
      pastTwoWeeks.push(entry);
    } else if (isSameMonth(today, entry.dateObj) && isSameYear(today, entry.dateObj)) {
      thisMonth.push(entry);
    } else {
      const year = entry.dateObj.getFullYear().toString();
      if (!yearly[year]) yearly[year] = [];
      yearly[year].push(entry);
    }
  }

  return { pastTwoWeeks, thisMonth, yearly };
}
