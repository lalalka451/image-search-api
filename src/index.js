// src/index.js
require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Function to get user from token
const getUser = (token) => {
  try {
    if (token) {
      return jwt.verify(token, JWT_SECRET);
    }
    return null;
  } catch (err) {
    console.error('JWT Error:', err.message);
    return null;
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: {
    origin: '*', // Allows all origins
    credentials: true,
  },
  context: ({ req }) => {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const user = getUser(token);
    return { user };
  },
  formatError: (err) => {
    // Optionally customize error messages
    return err;
  },
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});