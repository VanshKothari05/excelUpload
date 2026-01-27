import { ObjectId } from 'mongodb';
import { getMongoClient } from './mongodb';

const COLLECTION = 'merged_files';

export async function saveMergedData(data, fileCount) {
  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection(COLLECTION);

  return await collection.insertOne({
    data,
    fileCount,
    timestamp: new Date(),
    createdAt: new Date(),
  });
}

export async function getAllRecords() {
  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection(COLLECTION);

  return await collection
    .find({})
    .sort({ timestamp: -1 })
    .toArray();
}

export async function getRecordById(id) {
  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection(COLLECTION);

  return await collection.findOne({ _id: new ObjectId(id) });
}

export async function deleteRecord(id) {
  const client = await getMongoClient();
  const db = client.db();
  const collection = db.collection(COLLECTION);

  return await collection.deleteOne({ _id: new ObjectId(id) });
}
