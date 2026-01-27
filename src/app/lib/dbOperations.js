  import clientPromise from './mongodb';

  export async function saveMergedData(data, fileCount) {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('merged_files');
    
    const result = await collection.insertOne({
      data,
      fileCount,
      timestamp: new Date(),
      createdAt: new Date()
    });
    
    return result;
  }

  export async function getAllRecords() {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('merged_files');
    
    const records = await collection.find({})
      .sort({ timestamp: -1 })
      .toArray();
    
    return records;
  }

  export async function getRecordById(id) {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('merged_files');
    const { ObjectId } = require('mongodb');
    
    const record = await collection.findOne({ _id: new ObjectId(id) });
    return record;
  }

  export async function deleteRecord(id) {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection('merged_files');
    const { ObjectId } = require('mongodb');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result;
  }