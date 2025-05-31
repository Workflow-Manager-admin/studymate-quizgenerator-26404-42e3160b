const express = require('express');
const healthController = require('../controllers/health');
const quizController = require('../controllers/quiz'); // For quiz endpoints
const fileUpload = require('../middleware/fileUpload');

const router = express.Router();

/**
 * Health endpoint
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload PDF/DOCX file for quiz generation
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded, text extracted, quiz generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 */
router.post('/api/upload', fileUpload.single('file'), quizController.upload);

/**
 * @swagger
 * /api/quiz/{id}:
 *   get:
 *     summary: Get quiz by Quiz ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the quiz session
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quiz'
 */
router.get('/api/quiz/:id', quizController.getQuiz);

/**
 * @swagger
 * /api/quiz/{id}/answer:
 *   post:
 *     summary: Submit an answer for an MCQ
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           description: Quiz Session ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mcqIndex
 *               - selectedOption
 *             properties:
 *               mcqIndex:
 *                 type: integer
 *                 description: Index of the MCQ
 *               selectedOption:
 *                 type: string
 *                 description: Option chosen by student
 *     responses:
 *       200:
 *         description: Answer result (correct/incorrect + feedback)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnswerResponse'
 */
router.post('/api/quiz/:id/answer', quizController.answerMCQ);

module.exports = router;
