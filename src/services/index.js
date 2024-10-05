// src/services/index.js
const fetchPixabayImages = require('./pixabay');
const fetchUnsplashImages = require('./unsplash');
const fetchPexelsImages = require('./pexels');

module.exports = {
  fetchPixabayImages,
  fetchUnsplashImages,
  fetchPexelsImages
};