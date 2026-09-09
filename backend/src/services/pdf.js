const pdfParse = require('pdf-parse');
const fetch = require('node-fetch');

async function extractTextFromURL(url) {
  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF extraction error:', err.message);
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }
}

module.exports = { extractTextFromURL };
