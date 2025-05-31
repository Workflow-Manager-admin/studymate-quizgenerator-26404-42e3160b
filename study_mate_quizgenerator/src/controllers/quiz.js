const path = require('path');
const fs = require('fs');
const textExtractionService = require('../services/textExtraction');
const quizService = require('../services/quiz');

// A very basic in-memory session/quiz storage for MVP
const QUIZ_SESSIONS = {};

/**
 * PUBLIC_INTERFACE
 * Handle file upload, perform extraction, generate MCQs, and start quiz session.
 */
exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // Extract readable text from uploaded file
    const ext = path.extname(req.file.originalname).toLowerCase();
    let text;
    if (ext === '.pdf') {
      text = await textExtractionService.extractFromPdf(req.file.path);
    } else if (ext === '.docx') {
      text = await textExtractionService.extractFromDocx(req.file.path);
    } else {
      return res.status(400).json({ status: 'error', message: 'Unsupported file type' });
    }

    // Delete raw upload afterwards
    fs.unlink(req.file.path, () => {});

    // Generate MCQs using the extracted text
    const quiz = await quizService.generateMCQs(text);

    // Save quiz session in memory
    const quizId = Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    QUIZ_SESSIONS[quizId] = quiz;

    return res.status(200).json({
      status: 'success',
      quizId,
      quiz
    });
  } catch (err) {
    console.error('Quiz upload error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Quiz generation failed'
    });
  }
};

/**
 * PUBLIC_INTERFACE
 * Get quiz data by ID
 */
exports.getQuiz = (req, res) => {
  const { id } = req.params;
  const quiz = QUIZ_SESSIONS[id];
  if (!quiz) {
    return res.status(404).json({
      status: 'error',
      message: 'Quiz not found'
    });
  }
  res.status(200).json({ status: 'success', quiz });
};

/**
 * PUBLIC_INTERFACE
 * Receive a student's answer to an MCQ, grade it, and return feedback.
 */
exports.answerMCQ = (req, res) => {
  const { id } = req.params;
  const { mcqIndex, selectedOption } = req.body;

  const quiz = QUIZ_SESSIONS[id];
  if (!quiz || !Array.isArray(quiz.mcqs) || mcqIndex == null) {
    return res.status(404).json({ status: 'error', message: 'Quiz or question not found' });
  }
  const mcq = quiz.mcqs[mcqIndex];
  if (!mcq) {
    return res.status(400).json({ status: 'error', message: 'Invalid MCQ index' });
  }

  const isCorrect = selectedOption === mcq.correctOption;
  res.status(200).json({
    status: 'success',
    result: isCorrect ? 'correct' : 'incorrect',
    explanation: mcq.explanation || '',
    correctOption: mcq.correctOption
  });
};
