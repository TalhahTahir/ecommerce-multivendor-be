const mongoose = require('mongoose')

// Vercel serverless connection caching
// Each warm invocation reuses the cached connection instead of creating a new one
let cached = global._mongooseCache;
if (!cached) {
    cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
    // If already connected, return immediately
    if (cached.conn) {
        return cached.conn;
    }

    // If a connection attempt is already in progress, wait for it
    if (!cached.promise) {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error("❌ MONGODB_URI is not defined!");
            throw new Error("MONGODB_URI is not defined");
        }

        console.log("🔌 Attempting to connect to MongoDB...");
        console.log("🔗 URI starts with:", uri.substring(0, 20) + "...");

        cached.promise = mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
        }).then((m) => {
            console.log("✅ MongoDB connected successfully");
            return m;
        }).catch((error) => {
            console.error("❌ MongoDB connection failed:", error.message);
            // Reset the cache so next invocation retries
            cached.promise = null;
            throw error;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;