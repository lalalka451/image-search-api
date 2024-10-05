// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const users = []; // In-memory user storage

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';


app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the Image Search API!');
});

// Helper function to fetch images from Pixabay
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
    return []; // Return empty array on error
  }
};

// Helper function to fetch images from Unsplash
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
    return []; // Return empty array on error
  }
};

// Helper function to fetch images from Pexels
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
    return []; // Return empty array on error
  }
};



app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
  
    // Check if user already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
  
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Store the user
    users.push({ username, password: hashedPassword });
  
    res.status(201).json({ message: 'User registered successfully.' });
  });


  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
  
    // Find the user
    const user = users.find(user => user.username === username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
  
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid username or password.' });
    }
  
    // Create JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  
    res.json({ message: 'Login successful.', token });
  });

  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) {
      return res.status(401).json({ error: 'Access token is missing or invalid.' });
    }
  
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token.' });
      }
      req.user = user;
      next();
    });
  };


app.get('/search', authenticateToken, async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Search query parameter "q" is required.' });
  }

  try {
    // Initiate all API requests simultaneously
    const [pixabayResult, unsplashResult, pexelsResult] = await Promise.allSettled([
      fetchPixabayImages(query),
      fetchUnsplashImages(query),
      fetchPexelsImages(query)
    ]);

    // Initialize an empty array to store all images
    let allImages = [];
    let errors = [];

    // Handle Pixabay Result
    if (pixabayResult.status === 'fulfilled') {
      allImages = allImages.concat(pixabayResult.value);
    } else {
      console.error('Failed to fetch from Pixabay');
      errors.push('Pixabay API failed.');
    }

    // Handle Unsplash Result
    if (unsplashResult.status === 'fulfilled') {
      allImages = allImages.concat(unsplashResult.value);
    } else {
      console.error('Failed to fetch from Unsplash');
      errors.push('Unsplash API failed.');
    }

    // Handle Pexels Result
    if (pexelsResult.status === 'fulfilled') {
      allImages = allImages.concat(pexelsResult.value);
    } else {
      console.error('Failed to fetch from Pexels');
      errors.push('Pexels API failed.');
    }

    // Check if at least one API returned results
    if (allImages.length === 0) {
      return res.status(500).json({ error: 'Failed to fetch images from all sources.' });
    }

    // Return results along with any API failure messages
    res.json({
      images: allImages,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Server Error:', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});