// Text extraction service for PDF and DOCX files.

const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * PUBLIC_INTERFACE
 * Extract plain text from a PDF file using pdf-parse.
 * @param {string} filePath - The path to the PDF file
 * @returns {Promise<string>} Extracted text from PDF
 */
async function extractFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * PUBLIC_INTERFACE
 * Extract text from a DOCX file using Mammoth.
 * @param {string} filePath - The path to the DOCX file
 * @returns {Promise<string>} Extracted text from DOCX
 */
async function extractFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

module.exports = { extractFromPdf, extractFromDocx };
