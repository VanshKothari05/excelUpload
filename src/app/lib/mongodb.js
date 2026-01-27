import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let globalWithMongo = global;
let cached = globalWithMongo._mongo;

if (!cached) {
  cached = globalWithMongo._mongo = { client: null, promise: null };
}

export async function getMongoClient() {
  if (!uri) {
    throw new Error('MONGODB_URI is not defined');
  }

  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    cached.promise = new MongoClient(uri, options).connect();
  }

  cached.client = await cached.promise;
  return cached.client;
}

