// src/services/pixabay.js
const axios = require('axios');

const fetchPixabayImages = async (query) => {
  const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
  const url = 'https://pixabay.com/api/';

  try {
    const response = await axios.get(url, {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        image_type: 'photo',
        per_page: 10
      }
    });

    const images = response.data.hits.map(hit => ({
      image_ID: hit.id.toString(),
      thumbnails: hit.previewURL,
      preview: hit.webformatURL,
      title: hit.tags,
      source: 'Pixabay',
      tags: hit.tags.split(',').map(tag => tag.trim())
    }));

    return images;
  } catch (error) {
    console.error('Pixabay API Error:', error.response ? error.response.data : error.message);
    throw error; // Let the resolver handle the error
  }
};

module.exports = fetchPixabayImages;