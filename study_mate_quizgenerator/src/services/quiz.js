/**
 * quiz.js - Quiz generation service for StudyMate QuizGenerator.
 * Handles communication with OpenAI LLM (or fallback) to create MCQs from source text.
 */

const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// PUBLIC_INTERFACE
/**
 * Generates multiple-choice questions (MCQs) from provided text using OpenAI LLM, or provides a fallback demo quiz.
 * @param {string} text - The extracted readable source text.
 * @returns {Promise<{mcqs: Array}>} Quiz object with array of MCQs
 */
async function generateMCQs(text) {
  if (OPENAI_API_KEY) {
    // Craft system/user prompt for LLM
    const instructions = `Given the following content, generate 5 multiple-choice questions, each with 4 options. Mark which is the correct answer and provide a brief explanation for each.

Content:
"""${text.slice(0, 4000)}"""

Return as a strict valid JSON array in the following format:
[{ "question": "...", "options": ["a", "b", "c", "d"], "correctOption": "b", "explanation": "..." }]`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an educational quiz generator.' },
            { role: 'user', content: instructions },
          ],
          temperature: 0.6,
          max_tokens: 800,
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      // Prefer extracting JSON from code block, otherwise use full string
      let content;
      const data = response.data.choices[0].message.content;
      const match = data.match(/```(?:json)?([^`]+)```/);
      content = match ? match[1].trim() : data.trim();
      const mcqs = JSON.parse(content);
      return { mcqs };
    } catch (e) {
      throw new Error('Failed to parse AI response for MCQs');
    }
  }
  // Fallback: generate 1 sample MCQ if no API key
  return {
    mcqs: [
      {
        question:
          'Which of the following best describes the main idea of the uploaded document?',
        options: [
          'A detailed exploration of color theory',
          'A historical analysis of trade routes',
          'A summary of astrophysics discoveries',
          'A guide to gardening in winter',
        ],
        correctOption: 'A detailed exploration of color theory',
        explanation: 'This is a sample MCQ. API integration required for live questions.',
      },
    ],
  };
}

module.exports = { generateMCQs };
