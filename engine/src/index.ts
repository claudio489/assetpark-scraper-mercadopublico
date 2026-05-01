import { scrapeOpportunities } from "./scraper";

export async function runPipeline() {
  const data = await scrapeOpportunities();
  return data.slice(0, 50);
}