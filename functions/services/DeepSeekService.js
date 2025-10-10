import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL;
    
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
    
    if (!this.apiUrl) {
      throw new Error('DEEPSEEK_API_URL environment variable is not set');
    }
  }

  /**
   * Analyze content using DeepSeek API
   * @param {Object} options - Analysis options
   * @param {string} [options.text] - Text content to analyze
   * @param {Buffer|string} [options.file] - File content or path to analyze
   * @param {string} options.prompt - Prompt for DeepSeek
   * @returns {Promise<Object>} - DeepSeek API response
   */
  async analyze({ text, prompt }) {
    const payload = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user', // Typically "user" for user input
          content: prompt || text || '', // Use prompt or text as the content
        }
      ], // Initialize the messages array
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DeepSeek API Error:', error.message);
      throw new Error(`DeepSeek API error: ${error.message}`);
    }
  }

  /**
   * Analyze text using DeepSeek API
   * @param {string} text - Text content to analyze
   * @param {string} prompt - Prompt for DeepSeek
   * @returns {Promise<Object>} - DeepSeek API response
   */
  async analyzeText(text, prompt) {
    return this.analyze({ text, prompt });
  }

  /**
   * Analyze file using DeepSeek API
   * @param {Buffer|string} file - File content or path to analyze
   * @param {string} prompt - Prompt for DeepSeek
   * @returns {Promise<Object>} - DeepSeek API response
   */
  async analyzeFile(file, prompt) {
    return this.analyze({ file, prompt });
  }
}

export default DeepSeekService;