const { MongoClient } = require("mongodb");
const { Collection } = require("mongoose");

const uri = process.env.MONGODB_CONN;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;

const connect = async () => {
  if (!db) {
    try {
      await client.connect();
      db = client.db("myFirst");
    } catch (err) {}
  }
  return db;
};

const insertOne = async (collectionName, document) => {
  const db = await connect();
  db.collection(collectionName).insertOne(document);
};
