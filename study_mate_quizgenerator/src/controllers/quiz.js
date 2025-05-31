/**
 * quiz.js - Controller for handling quiz generation and session actions.
 * 
 * Handles file uploads (PDF, DOCX), text extraction, MCQ generation via service,
 * in-memory quiz session management, and grading/feedback for answers.
 */

const path = require('path');
const fs = require('fs');
const textExtractionService = require('../services/textExtraction');
const quizService = require('../services/quiz');

// In-memory quiz session storage for MVP; replace with DB for production.
const QUIZ_SESSIONS = {};

/**
 * PUBLIC_INTERFACE
 * Handle file upload, extract text, generate MCQs, and create quiz session.
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // Determine file extension and extract text accordingly
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text = '';
    switch (ext) {
      case '.pdf':
        text = await textExtractionService.extractFromPdf(req.file.path);
        break;
      case '.docx':
        text = await textExtractionService.extractFromDocx(req.file.path);
        break;
      default:
        // Clean up the uploaded file even if unsupported
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ status: 'error', message: 'Unsupported file type' });
    }

    // Delete uploaded file after extraction to save space
    fs.unlink(req.file.path, () => {});

    // Generate quiz MCQs from extracted text
    const quiz = await quizService.generateMCQs(text);

    // Store quiz in memory: create unique session ID
    const quizId =
      Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    QUIZ_SESSIONS[quizId] = quiz;

    return res.status(200).json({
      status: 'success',
      quizId,
      quiz,
    });
  } catch (err) {
    // Log for troubleshooting 
    // eslint-disable-next-line no-console
    console.error('Quiz upload error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Quiz generation failed',
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Retrieve quiz data by quiz session ID.
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
exports.getQuiz = (req, res) => {
  const { id } = req.params;
  const quiz = QUIZ_SESSIONS[id];
  if (!quiz) {
    return res.status(404).json({
      status: 'error',
      message: 'Quiz not found',
    });
  }
  return res.status(200).json({ status: 'success', quiz });
};

/**
 * PUBLIC_INTERFACE
 * Receive answer for a quiz MCQ, grade it, and respond with result/feedback.
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
exports.answerMCQ = (req, res) => {
  const { id } = req.params;
  const { mcqIndex, selectedOption } = req.body;

  const quiz = QUIZ_SESSIONS[id];
  if (!quiz || !Array.isArray(quiz.mcqs)) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Quiz not found' });
  }
  if (typeof mcqIndex !== 'number' || mcqIndex < 0 || mcqIndex >= quiz.mcqs.length) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Invalid MCQ index' });
  }
  const mcq = quiz.mcqs[mcqIndex];

  const isCorrect = selectedOption === mcq.correctOption;
  return res.status(200).json({
    status: 'success',
    result: isCorrect ? 'correct' : 'incorrect',
    explanation: mcq.explanation || '',
    correctOption: mcq.correctOption,
  });
};
