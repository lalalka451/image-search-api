// src/services/unsplash.js
const axios = require('axios');

const fetchUnsplashImages = async (query) => {
  const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
  const url = 'https://api.unsplash.com/search/photos';

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      },
      params: {
        query: query,
        per_page: 10
      }
    });

    const images = response.data.results.map(photo => ({
      image_ID: photo.id,
      thumbnails: photo.urls.thumb,
      preview: photo.urls.small,
      title: photo.description || photo.alt_description || 'Untitled',
      source: 'Unsplash',
      tags: photo.tags ? photo.tags.map(tag => tag.title) : []
    }));

    return images;
  } catch (error) {
    console.error('Unsplash API Error:', error.response ? error.response.data : error.message);
    throw error; // Let the resolver handle the error
  }
};

module.exports = fetchUnsplashImages;