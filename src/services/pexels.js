// src/services/pexels.js
const axios = require('axios');

const fetchPexelsImages = async (query) => {
  const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
  const url = 'https://api.pexels.com/v1/search';

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: PEXELS_API_KEY
      },
      params: {
        query: query,
        per_page: 10
      }
    });

    const images = response.data.photos.map(photo => ({
      image_ID: photo.id.toString(),
      thumbnails: photo.src.small,
      preview: photo.src.medium,
      title: photo.alt || 'Untitled',
      source: 'Pexels',
      tags: [] // Pexels API doesn't provide tags directly
    }));

    return images;
  } catch (error) {
    console.error('Pexels API Error:', error.response ? error.response.data : error.message);
    throw error; // Let the resolver handle the error
  }
};

module.exports = fetchPexelsImages;