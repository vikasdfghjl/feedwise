declare module 'node-summarizer' {
  export class SummarizerManager {
    constructor(content: string, maxSentences?: number);
    getSummaryByRank(options: {
      topn: number;
      include_metadata?: boolean;
    }): Promise<{ summary: string }>;
  }
}