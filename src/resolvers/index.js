// src/resolvers/index.js
const {
  fetchPixabayImages,
  fetchUnsplashImages,
  fetchPexelsImages
} = require('../services');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const users = []; // In-memory user storage (Consider using a database in production)

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const resolvers = {
  Query: {
    searchImages: async (_, { query }, context) => {
      if (!context.user) {
        throw new Error('Authentication required.');
      }

      // Initiate all API requests simultaneously using Promise.allSettled
      const [pixabayResult, unsplashResult, pexelsResult] = await Promise.allSettled([
        fetchPixabayImages(query),
        fetchUnsplashImages(query),
        fetchPexelsImages(query)
      ]);

      let allImages = [];
      let errors = [];

      // Handle Pixabay Result
      if (pixabayResult.status === 'fulfilled') {
        allImages = allImages.concat(pixabayResult.value);
      } else {
        console.error('Failed to fetch from Pixabay:', pixabayResult.reason);
        errors.push('Pixabay API failed.');
      }

      // Handle Unsplash Result
      if (unsplashResult.status === 'fulfilled') {
        allImages = allImages.concat(unsplashResult.value);
      } else {
        console.error('Failed to fetch from Unsplash:', unsplashResult.reason);
        errors.push('Unsplash API failed.');
      }

      // Handle Pexels Result
      if (pexelsResult.status === 'fulfilled') {
        allImages = allImages.concat(pexelsResult.value);
      } else {
        console.error('Failed to fetch from Pexels:', pexelsResult.reason);
        errors.push('Pexels API failed.');
      }

      if (allImages.length === 0) {
        throw new Error('Failed to fetch images from all sources.');
      }

      return allImages;
    }
  },
  Mutation: {
    register: async (_, { username, password }) => {
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }

      // Check if user already exists
      const existingUser = users.find(user => user.username === username);
      if (existingUser) {
        throw new Error('Username already exists.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Store the user
      const newUser = { username, password: hashedPassword };
      users.push(newUser);

      // Create JWT token
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

      return {
        token,
        user: { username }
      };
    },
    login: async (_, { username, password }) => {
      if (!username || !password) {
        throw new Error('Username and password are required.');
      }

      // Find the user
      const user = users.find(user => user.username === username);
      if (!user) {
        throw new Error('Invalid username or password.');
      }

      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new Error('Invalid username or password.');
      }

      // Create JWT token
      const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

      return {
        token,
        user: { username }
      };
    }
  }
};

module.exports = resolvers;