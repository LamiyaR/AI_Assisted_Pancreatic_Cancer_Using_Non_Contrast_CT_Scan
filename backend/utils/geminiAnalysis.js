import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini API with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes text content using Google's Gemini API
 * @param {string} text - The text content to analyze
 * @returns {Promise<Object>} Analysis results including sentiment, topics, and content warnings
 */
export async function analyzeWithGemini(text) {
    try {
        // Get the model with updated configuration
        const model = genAI.getGenerativeModel({ 
            model: "Gemini 1.5 Flash",
            generationConfig: {
                temperature: 0.1,
                topP: 0.1,
                topK: 16,
                maxOutputTokens: 1024,
            }
        });

        const prompt = `You are a sentiment analysis expert. Your task is to analyze the following text and respond with a JSON object.

Rules:
1. Respond ONLY with a JSON object
2. Do not include any other text, markdown formatting, or explanations
3. The JSON must exactly follow this structure:
{
    "sentiment": one of ["positive", "negative", "neutral"],
    "sentiment_score": number between -1 and 1,
    "topics": array of strings,
    "content_warnings": array of strings,
    "summary": string
}

Text to analyze: "${text}"`;

        // Generate content with proper error handling
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();

        // Clean up the response text
        responseText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        
        try {
            // Parse and validate the response
            const analysisResult = JSON.parse(responseText);

            // Validate required fields
            if (!analysisResult.sentiment || 
                typeof analysisResult.sentiment_score !== 'number' || 
                !Array.isArray(analysisResult.topics)) {
                console.error("Invalid response structure:", analysisResult);
                return {
                    success: false,
                    error: "Missing required fields in API response",
                    fallback: {
                        sentiment: "neutral",
                        sentiment_score: 0,
                        topics: [],
                        content_warnings: [],
                        summary: text.substring(0, 100) + "..."
                    }
                };
            }

            // Normalize the response
            const normalizedResult = {
                sentiment: ['positive', 'negative', 'neutral'].includes(analysisResult.sentiment) 
                    ? analysisResult.sentiment 
                    : 'neutral',
                sentiment_score: Math.max(-1, Math.min(1, analysisResult.sentiment_score)),
                topics: Array.isArray(analysisResult.topics) ? analysisResult.topics : [],
                content_warnings: Array.isArray(analysisResult.content_warnings) ? analysisResult.content_warnings : [],
                summary: analysisResult.summary || text.substring(0, 100) + "..."
            };

            return {
                success: true,
                analysis: normalizedResult
            };
        } catch (jsonError) {
            console.error("Error parsing Gemini response:", jsonError);
            console.log("Raw response:", responseText);
            
            // Return a fallback analysis
            return {
                success: false,
                error: "Failed to parse API response",
                fallback: {
                    sentiment: "neutral",
                    sentiment_score: 0,
                    topics: [],
                    content_warnings: [],
                    summary: text.substring(0, 100) + "..."
                }
            };
        }
    } catch (error) {
        console.error("Error in Gemini analysis:", error);
        
        // Return a fallback analysis
        return {
            success: false,
            error: error.message || "Error connecting to Gemini API",
            fallback: {
                sentiment: "neutral",
                sentiment_score: 0,
                topics: [],
                content_warnings: [],
                summary: text.substring(0, 100) + "..."
            }
        };
    }
} 