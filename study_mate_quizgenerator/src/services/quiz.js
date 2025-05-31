const axios = require('axios');

// --- CONFIGURE YOUR LLM PROVIDER HERE (OpenAI API, etc.) ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
/**
 * PUBLIC_INTERFACE
 * Generates a list of MCQs (Multiple-Choice Questions) from raw text using OpenAI LLM or fallback.
 * @param {string} text
 * @returns {Promise<object>} - Quiz object { mcqs: [{ question, options, correctOption, explanation }] }
 */
async function generateMCQs(text) {
  if (OPENAI_API_KEY) {
    // Use OpenAI API to generate MCQs
    const instructions = `Given the following content, generate 5 multiple-choice questions, each with 4 options. Mark which is the correct answer and provide a brief explanation for each.\n\nContent:\n"""${text.slice(0, 4000)}"""\n\nReturn as a strict valid JSON array in the following format:\n[{ 'question': '...', 'options': ['a', 'b', 'c', 'd'], 'correctOption': 'b', 'explanation': '...' }]`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an educational quiz generator.' },
          { role: 'user', content: instructions }
        ],
        temperature: 0.6,
        max_tokens: 800
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    // Parse JSON array from OpenAI reply
    let content;
    try {
      // Find the first code block if exists, otherwise just parse
      const match = response.data.choices[0].message.content.match(/```(?:json)?([^`]+)```/);
      content = match ? match[1].trim() : response.data.choices[0].message.content.trim();
      const mcqs = JSON.parse(content);
      return { mcqs };
    } catch (e) {
      throw new Error('Failed to parse AI response for MCQs');
    }
  } else {
    // Fallback: generate a dummy MCQ for demo if no API key is present
    return {
      mcqs: [{
        question: 'Which of the following best describes the main idea of the uploaded document?',
        options: [
          'A detailed exploration of color theory',
          'A historical analysis of trade routes',
          'A summary of astrophysics discoveries',
          'A guide to gardening in winter'
        ],
        correctOption: 'A detailed exploration of color theory',
        explanation: 'This is a sample MCQ. API integration required for live questions.'
      }]
    };
  }
}

module.exports = { generateMCQs };
