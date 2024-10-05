// src/schema/index.js
const { gql } = require('apollo-server');

const typeDefs = gql`
  type Image {
    image_ID: ID!
    thumbnails: String!
    preview: String!
    title: String!
    source: String!
    tags: [String!]!
  }

  type User {
    username: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    searchImages(query: String!): [Image!]!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
  }
`;

module.exports = typeDefs;