import dotenv from 'dotenv';
import logger from './logger';
// @ts-ignore
import { SummarizerManager } from 'node-summarizer'; // @ts-ignore

// Load environment variables
dotenv.config();

// Custom error class for summarization errors
export class SummaryGenerationError extends Error {
  constructor(message: string = 'Error generating summary') {
    super(message);
    this.name = 'SummaryGenerationError';
  }
}

// Adding OpenAIQuotaExceededError to maintain compatibility with articleController.ts
export class OpenAIQuotaExceededError extends Error {
  constructor(message: string = 'API quota exceeded') {
    super(message);
    this.name = 'OpenAIQuotaExceededError';
  }
}

/**
 * Generate an article summary using Node.js NLP libraries
 * 
 * @param title The article title
 * @param content The article content to summarize
 * @returns A comprehensive summary of the article
 */
export async function generateArticleSummary(title: string, content: string): Promise<string> {
  try {
    logger.debug(`Generating enhanced summary for article: ${title}`);
    
    // Use node-summarizer library with TextRank algorithm
    const summary = await generateEnhancedSummary(title, content);
    
    logger.debug(`Successfully generated comprehensive summary for article: ${title}`);
    
    return summary;
  } catch (error: any) {
    logger.error('Error generating summary with summarization library:', error);
    
    // Fallback to our basic summarization if the library fails
    logger.info('Falling back to improved local summarization method');
    return generateLocalSummary(title, content);
  }
}

/**
 * Enhanced summarization using the node-summarizer library
 * Uses TextRank algorithm for extractive summarization with additional context awareness
 * and improved descriptive elements
 */
async function generateEnhancedSummary(title: string, content: string): Promise<string> {
  // If content is very short, return it directly with context
  if (content.length < 200) {
    return `• Brief Article: ${title ? title + ' - ' : ''}${content}`;
  }
  
  // Clean and normalize the content
  const cleanContent = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Initialize the summarizer
  const summarizer = new SummarizerManager(cleanContent, 3);
  
  // Get a more comprehensive summary - increase sentence count for longer articles
  // Adaptive sentence count based on article length
  let sentenceCount = Math.min(8, Math.max(4, Math.ceil(cleanContent.length / 400)));
  
  // Generate summary
  const result = await summarizer.getSummaryByRank({
    topn: sentenceCount,
    include_metadata: true
  });
  
  // Extract important entities and topics
  const entities = extractEntities(cleanContent, title);
  
  // Format as an enhanced summary with more descriptive elements
  let formattedSummary = '';
  
  // Add article overview section
  formattedSummary += `## ${title || 'Article'} Summary\n\n`;
  
  // Add main topic and context
  formattedSummary += `**Main Topic**: ${extractMainTopic(title, cleanContent)}\n\n`;
  
  // Add key points section
  formattedSummary += `**Key Points**:\n\n`;
  
  // Add main summary points with better formatting
  if (result && result.summary) {
    const summaryPoints = result.summary
      .split('. ')
      .filter((s: string) => s.trim().length > 10)
      .map((s: string) => {
        s = s.trim();
        // Ensure sentence ends with punctuation
        if (!s.match(/[.!?]$/)) s += '.'; 
        return `• ${s}`;
      });
    
    formattedSummary += summaryPoints.join('\n\n');
  } else {
    // Improved fallback for when no summary was generated
    const firstParagraphs = cleanContent.split('. ').slice(0, 3).join('. ');
    formattedSummary += `• ${firstParagraphs}.`;
  }
  
  // Add important entities section if entities were found
  if (entities.length > 0) {
    formattedSummary += `\n\n**Key Entities**: ${entities.join(', ')}`;
  }
  
  // Add context/conclusion section
  const conclusion = generateConclusionContext(cleanContent, title);
  if (conclusion) {
    formattedSummary += `\n\n**Context**: ${conclusion}`;
  }
  
  return formattedSummary;
}

/**
 * Extract main topic from title and content
 */
function extractMainTopic(title: string, content: string): string {
  if (title && title.trim().length > 0) {
    return title;
  }
  
  // Try to extract a topic from the first paragraph
  const firstParagraph = content.split('.')[0];
  if (firstParagraph && firstParagraph.length > 10) {
    // Remove articles and common starter phrases
    let topic = firstParagraph
      .replace(/^(in this article|here|today|we will discuss|let's talk about)/i, '')
      .trim();
      
    // Limit length
    if (topic.length > 100) {
      topic = topic.substring(0, 97) + '...';
    }
    
    return topic;
  }
  
  return "Unable to determine main topic";
}

/**
 * Extract important entities from content
 */
function extractEntities(content: string, title: string): string[] {
  const entities: Set<string> = new Set();
  
  // Extract potential named entities - look for capitalized words and phrases
  const capitalizationPattern = /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/g;
  const potentialEntities = content.match(capitalizationPattern) || [];
  
  // Add words from title as they're likely important
  const titleWords = title ? title.split(/\s+/).filter(word => word.length > 3) : [];
  
  // Combine entities
  [...potentialEntities, ...titleWords].forEach(entity => {
    // Filter out common words that might be capitalized
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to', 'from', 'by'];
    if (!commonWords.includes(entity.toLowerCase()) && entity.length > 3) {
      entities.add(entity);
    }
  });
  
  // Limit to top 10 most meaningful entities
  return Array.from(entities).slice(0, 10);
}

/**
 * Generate a conclusion or contextual statement for the summary
 */
function generateConclusionContext(content: string, title: string): string {
  // Look for conclusion indicators in the text
  const lastParagraphs = content.split('.').slice(-5);
  
  for (const paragraph of lastParagraphs) {
    const lowercasePara = paragraph.toLowerCase();
    if (
      lowercasePara.includes('in conclusion') ||
      lowercasePara.includes('to conclude') ||
      lowercasePara.includes('finally') ||
      lowercasePara.includes('to summarize') ||
      lowercasePara.includes('in summary')
    ) {
      return paragraph.trim() + '.';
    }
  }
  
  // No explicit conclusion found, generate a context statement
  const contentLength = content.length;
  const wordCount = content.split(/\s+/).length;
  
  return `This is a ${wordCount > 1000 ? 'lengthy' : 'brief'} ${wordCount} word article focused on ${title || 'the topic'}.`;
}

// Keep the original local summary function as fallback but enhance it
function generateLocalSummary(title: string, content: string): string {
  // If content is very short, return it directly
  if (content.length < 200) {
    return `• Brief Article: ${title ? title + ' - ' : ''}${content}`;
  }
  
  // Clean and normalize the content
  const normalizedContent = content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Split content into sentences
  const sentences = normalizedContent
    .replace(/([.?!])\s+/g, "$1|")
    .split("|")
    .filter(s => s.length > 10);
  
  // Format improved summary
  let formattedSummary = `## ${title || 'Article'} Summary\n\n`;
  
  // Add main topic 
  formattedSummary += `**Main Topic**: ${extractMainTopic(title, normalizedContent)}\n\n`;
  
  // Add key points section
  formattedSummary += `**Key Points**:\n\n`;
  
  // If very few sentences, include them all
  if (sentences.length <= 4) {
    formattedSummary += sentences.map(s => `• ${s.trim()}`).join('\n\n');
  } else {
    // Find more important sentences - increased from 3 to 5
    const importantSentences = findImportantSentences(sentences, title, 5);
    formattedSummary += importantSentences.map(s => `• ${s.trim()}`).join('\n\n');
  }
  
  // Add key entities
  const entities = extractEntities(normalizedContent, title);
  if (entities.length > 0) {
    formattedSummary += `\n\n**Key Entities**: ${entities.join(', ')}`;
  }
  
  // Add simple conclusion
  formattedSummary += `\n\n**Context**: This ${sentences.length > 15 ? 'in-depth' : 'brief'} article covers ${title || 'the above topics'}.`;
  
  return formattedSummary;
}

/**
 * Find important sentences with improved scoring
 */
function findImportantSentences(sentences: string[], title: string, count: number): string[] {
  // Extract keywords from title
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
  // Score each sentence with enhanced criteria
  const scoredSentences = sentences.map((sentence, index) => {
    const text = sentence.toLowerCase();
    
    // Position score - first and last paragraphs often contain important info
    const positionScore = 
      index === 0 || index === sentences.length - 1 
        ? 3 
        : index < sentences.length / 3 
          ? 2 
          : 1;
    
    // Length score - prefer medium-length sentences that are likely more informative
    const length = sentence.length;
    const lengthScore = 
      length > 60 && length < 200 
        ? 3 
        : length > 40 && length <= 60 
          ? 2 
          : 1;
    
    // Keyword matching score - enhanced to look for partial matches as well
    let keywordScore = 0;
    titleWords.forEach(word => {
      if (text.includes(word)) {
        keywordScore += 2;
      } else if (titleWords.some(titleWord => 
        (titleWord.length > 5 && text.includes(titleWord.substring(0, titleWord.length - 2))))) {
        // Check for partial matches of longer words (helpful for stemming)
        keywordScore += 1;
      }
    });
    
    // Information density score - look for informative phrases
    const infoDensityScore = calculateInfoDensityScore(text);
    
    // Check for common summarization phrases with expanded list
    const summaryPhraseScore = 
      (text.includes('in summary') || 
       text.includes('to summarize') ||
       text.includes('in conclusion') ||
       text.includes('therefore') ||
       text.includes('as a result') ||
       text.includes('consequently') ||
       text.includes('the key') ||
       text.includes('important') ||
       text.includes('significant') ||
       text.includes('notably') ||
       text.includes('essentially') ||
       text.includes('critically') ||
       text.includes('fundamental') ||
       text.includes('primarily') ||
       text.includes('research shows') ||
       text.includes('study found') ||
       text.includes('according to')) 
        ? 3 
        : 0;
    
    // Check for questions which might be rhetorical and important
    const questionScore = text.includes('?') ? 2 : 0;
    
    return {
      sentence,
      score: positionScore + lengthScore + keywordScore + summaryPhraseScore + questionScore + infoDensityScore,
      index
    };
  });
  
  // Sort by score (descending)
  scoredSentences.sort((a, b) => b.score - a.score);
  
  // Take top N sentences and sort by original position
  return scoredSentences
    .slice(0, count)
    .sort((a, b) => a.index - b.index)
    .map(item => item.sentence);
}

/**
 * Calculate information density score based on presence of informative elements
 */
function calculateInfoDensityScore(text: string): number {
  let score = 0;
  
  // Check for numbers and statistics
  if (/\d+(\.\d+)?(%|percent|million|billion|thousand)/i.test(text)) {
    score += 3;
  } else if (/\d+/.test(text)) {
    score += 1;
  }
  
  // Check for comparisons
  if (/more than|less than|compared to|versus|vs\.|greater than|better than/i.test(text)) {
    score += 2;
  }
  
  // Check for quoted content
  if (/"[^"]*"/.test(text) || /'[^']*'/.test(text)) {
    score += 2;
  }
  
  // Check for specific dates
  if (/\b(19|20)\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) {
    score += 2;
  }
  
  // Check for cause-effect relationships
  if (/because|due to|as a result of|caused by|lead to|resulting in/i.test(text)) {
    score += 2;
  }
  
  return score;
}