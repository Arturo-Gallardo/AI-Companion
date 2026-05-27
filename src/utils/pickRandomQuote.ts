import { MOTIVATIONAL_QUOTES } from "../content/motivationalQuotes";

export function pickRandomMotivationalQuote(): string {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
