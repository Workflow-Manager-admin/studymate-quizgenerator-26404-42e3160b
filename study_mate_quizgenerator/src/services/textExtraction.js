const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * PUBLIC_INTERFACE
 * Extracts text from a PDF file.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

/**
 * PUBLIC_INTERFACE
 * Extracts text from a DOCX file using mammoth.
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function extractFromDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

module.exports = { extractFromPdf, extractFromDocx };
