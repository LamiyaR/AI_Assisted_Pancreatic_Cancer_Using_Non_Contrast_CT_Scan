import natural from 'natural';
import aposToLexForm from 'apos-to-lex-form';
import SpellCorrector from 'spelling-corrector';
import stopword from 'stopword';

const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();

const analyzer = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

// --- Basic Keyword Lists (Expand these significantly for better results) ---
const GOOD_NEWS_KEYWORDS = ['remission', 'clear', 'negative', 'recovered', 'stable', 'improving', 'good news'];
const BAD_NEWS_KEYWORDS = ['diagnosis', 'diagnosed', 'relapse', 'recurrence', 'metastasis', 'struggling', 'worsening', 'bad news'];
// VERY basic list - real moderation needs much more sophistication
const FORBIDDEN_KEYWORDS = ['kill', 'attack', 'hate', 'stupid']; 
// --------------------------------------------------------------------------

const analyzeBasicSentiment = (text) => {
    if (!text) return { score: 0, label: 'neutral' };

    // Convert contractions, lowercase, remove non-alpha
    const lexedText = aposToLexForm(text);
    const casedText = lexedText.toLowerCase();
    const alphaOnlyText = casedText.replace(/[^a-zA-Z\s]+/g, '');

    // Tokenize, spell correct, remove stopwords
    const { WordTokenizer } = natural;
    const tokenizer = new WordTokenizer();
    const tokenizedText = tokenizer.tokenize(alphaOnlyText);
    const spelledText = tokenizedText.map((word) => {
        try { return spellCorrector.correct(word); } catch { return word; }
    });
    const filteredText = stopword.removeStopwords(spelledText);

    // Analyze sentiment
    const score = analyzer.getSentiment(filteredText);
    let label = 'neutral';
    if (score > 0.1) label = 'positive'; // Adjusted threshold slightly
    else if (score < -0.1) label = 'negative';

    return { score, label, processedText: alphaOnlyText }; // Return processed text for keyword search
};

export const analyzeTextContent = (text) => {
    if (!text) {
        return {
            sentiment: { score: 0, label: 'neutral' },
            contextLabel: 'neutral',
            isFlagged: false
        };
    }

    // 1. Get basic sentiment
    const { score, label, processedText } = analyzeBasicSentiment(text);

    // 2. Basic Context Analysis (Keyword-based)
    let contextLabel = 'neutral';
    const lowerCaseText = processedText; // Already lowercased and cleaned

    if (label === 'positive') {
        if (GOOD_NEWS_KEYWORDS.some(keyword => lowerCaseText.includes(keyword))) {
            contextLabel = 'good_news';
        }
    } else if (label === 'negative') {
        if (BAD_NEWS_KEYWORDS.some(keyword => lowerCaseText.includes(keyword))) {
            contextLabel = 'bad_news';
        }
    }

    // 3. Basic Flagging (Keyword-based - VERY RUDIMENTARY)
    const isFlagged = FORBIDDEN_KEYWORDS.some(keyword => lowerCaseText.includes(keyword));

    return {
        sentiment: { score, label },
        contextLabel,
        isFlagged
    };
};

/**
 * Basic sentiment analysis function that serves as a fallback
 * @param {string} text - The text to analyze
 * @returns {{label: string, score: number}} The sentiment analysis result
 */
export function analyzeSentiment(text) {
    // This is a very basic implementation
    // In a production environment, you might want to use a more sophisticated approach
    const lowercaseText = text.toLowerCase();
    
    // Simple word lists for demonstration
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'poor', 'disappointing'];
    
    let score = 0;
    let wordCount = text.split(/\s+/).length;
    
    // Count positive and negative words
    for (const word of positiveWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            score += matches.length;
        }
    }
    
    for (const word of negativeWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            score -= matches.length;
        }
    }
    
    // Normalize score to be between -1 and 1
    const normalizedScore = wordCount > 0 ? score / wordCount : 0;
    const clampedScore = Math.max(-1, Math.min(1, normalizedScore));
    
    // Determine sentiment label
    let label;
    if (clampedScore > 0.1) {
        label = 'positive';
    } else if (clampedScore < -0.1) {
        label = 'negative';
    } else {
        label = 'neutral';
    }
    
    return {
        label,
        score: clampedScore
    };
} 