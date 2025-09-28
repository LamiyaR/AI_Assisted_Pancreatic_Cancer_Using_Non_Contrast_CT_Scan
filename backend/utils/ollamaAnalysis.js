import axios from 'axios';
import natural from 'natural';
import Sentiment from 'sentiment';
import aposToLexForm from 'apos-to-lex-form';
import stopword from 'stopword';

const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate';

// Initialize NLP tools
const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();
const wordNet = new natural.WordNet();
const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// AFINN is a list of words rated for valence with an integer between minus five (negative) and plus five (positive)
const afinn = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new afinn('English', stemmer, 'afinn');

export async function analyzeWithOllama(text) {
    try {
        // 1. Get local analysis
        const localAnalysis = await getEnhancedLocalAnalysis(text);
        
        // 2. Format for MongoDB schema compatibility
        const schemaCompatibleAnalysis = {
            sentiment: normalizeToSchemaEnum(localAnalysis.sentiment),
            sentiment_score: localAnalysis.sentiment_score,
            topics: extractTopicStrings(localAnalysis.topics),
            content_warnings: extractWarningStrings(localAnalysis.content_warnings),
            summary: typeof localAnalysis.summary === 'string' ? 
                localAnalysis.summary : 
                JSON.stringify(localAnalysis.summary)
        };

        // 3. Only use Ollama for complex content
        if (text.length > 100) {
            const prompt = `Analyze this text and provide a JSON response with:
- sentiment (ONLY "positive", "negative", or "neutral")
- topics (array of topic strings)
- content_warnings (array of warning strings)
- summary (single string)

Text: "${text.slice(0, 500)}"

Current analysis: ${JSON.stringify(schemaCompatibleAnalysis)}

Response must match MongoDB schema format.`;

            const response = await axios.post(OLLAMA_ENDPOINT, {
                model: 'deepseek-r1',
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 128
                }
            }, {
                timeout: 10000
            });

            try {
                const llmResult = JSON.parse(response.data.response);
                // Ensure LLM result matches schema
                return {
                    success: true,
                    analysis: {
                        sentiment: normalizeToSchemaEnum(llmResult.sentiment),
                        sentiment_score: typeof llmResult.sentiment_score === 'number' ? 
                            llmResult.sentiment_score : schemaCompatibleAnalysis.sentiment_score,
                        topics: Array.isArray(llmResult.topics) ? 
                            llmResult.topics.filter(t => typeof t === 'string') : 
                            schemaCompatibleAnalysis.topics,
                        content_warnings: Array.isArray(llmResult.content_warnings) ? 
                            llmResult.content_warnings.filter(w => typeof w === 'string') : 
                            schemaCompatibleAnalysis.content_warnings,
                        summary: typeof llmResult.summary === 'string' ? 
                            llmResult.summary : schemaCompatibleAnalysis.summary
                    }
                };
            } catch (e) {
                return {
                    success: true,
                    analysis: schemaCompatibleAnalysis
                };
            }
        }

        return {
            success: true,
            analysis: schemaCompatibleAnalysis
        };

    } catch (error) {
        // Fallback that matches schema
        return {
            success: true,
            analysis: {
                sentiment: 'neutral',
                sentiment_score: 0,
                topics: ['general'],
                content_warnings: [],
                summary: text.slice(0, 100) + '...'
            }
        };
    }
}

async function getEnhancedLocalAnalysis(text) {
    // Preprocess text
    const cleanText = aposToLexForm(text).toLowerCase();
    const tokens = tokenizer.tokenize(cleanText);
    const filteredTokens = stopword.removeStopwords(tokens);

    // Get sentiment scores
    const sentimentResult = sentiment.analyze(text);
    const afinnScore = analyzer.getSentiment(tokens);
    
    // Combine scores
    const combinedScore = (
        sentimentResult.comparative * 0.5 + 
        afinnScore * 0.5
    );

    // Extract topics from tokens
    const topics = extractTopicsFromTokens(filteredTokens);
    
    // Get content warnings
    const warnings = detectWarnings(tokens, text);

    // Generate summary
    const summary = generateSummary(tokens);

    return {
        sentiment: getSentimentLabel(combinedScore),
        sentiment_score: combinedScore,
        topics,
        content_warnings: warnings,
        summary
    };
}

function normalizeToSchemaEnum(sentiment) {
    // Ensure sentiment matches schema enum
    const validSentiments = ['positive', 'negative', 'neutral'];
    const normalized = sentiment.replace(/very |extremely /g, '');
    return validSentiments.includes(normalized) ? normalized : 'neutral';
}

function extractTopicStrings(topics) {
    if (Array.isArray(topics)) {
        // Convert any topic objects to strings
        return topics
            .map(t => typeof t === 'string' ? t : (t.topic || t.name || 'general'))
            .filter(t => typeof t === 'string')
            .slice(0, 3); // Limit to 3 topics
    }
    return ['general'];
}

function extractWarningStrings(warnings) {
    if (Array.isArray(warnings)) {
        // Convert warning objects to strings
        return warnings
            .map(w => typeof w === 'string' ? w : (w.type || w.warning || ''))
            .filter(w => w); // Remove empty strings
    }
    return [];
}

function extractTopicsFromTokens(tokens) {
    // Simple topic extraction based on token frequency
    const topicFreq = {};
    tokens.forEach(token => {
        if (token.length > 3) { // Only consider tokens longer than 3 chars
            topicFreq[token] = (topicFreq[token] || 0) + 1;
        }
    });
    
    return Object.entries(topicFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([topic]) => topic);
}

function detectWarnings(tokens, text) {
    const warnings = [];
    const sensitivePatterns = [
        'hate', 'violence', 'threat', 'harm', 'abuse', 'death', 'kill'
    ];
    
    tokens.forEach(token => {
        if (sensitivePatterns.includes(token.toLowerCase())) {
            warnings.push(`sensitive_content_${token}`);
        }
    });
    
    return warnings;
}

function generateSummary(tokens) {
    return tokens
        .slice(0, 10)
        .join(' ')
        .trim() || 'No summary available';
}

function getSentimentLabel(score) {
    // Simplified to match schema enum
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
}