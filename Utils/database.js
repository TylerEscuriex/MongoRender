// Utils/database.js
const { MongoClient } = require("mongodb");

// Use environment variables for connection URI, with fallback
const uri = process.env.MONGODB_URI || "mongodb+srv://tylerescuriex:TBa1CJQFexW4Q1mi@temdb.n06hy6j.mongodb.net/";

class DatabaseConnection {
    constructor() {
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }
        
        // Log connection string (with password hidden for security)
        console.log("Database URI:", uri.replace(/mongodb\+srv:\/\/[^:]+:([^@]+)@/, "mongodb+srv://[username]:[hidden]@"));
        
        this.client = new MongoClient(uri);
        this.connected = false;
        this.connectionPromise = null;
        DatabaseConnection.instance = this;
    }

    async connect() {
        if (!this.connected) {
            if (!this.connectionPromise) {
                console.log("Attempting to establish database connection...");
                this.connectionPromise = this.client.connect().then(() => {
                    this.connected = true;
                    this.db = this.client.db('temdb');
                    console.log("Connected to database using Singleton pattern");
                    return this.db;
                }).catch(err => {
                    console.error("Database connection error:", err);
                    throw err;
                });
            }
            await this.connectionPromise;
        }
        return this.db;
    }

    async getCollection(name) {
        const db = await this.connect();
        return db.collection(name);
    }

    async close() {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
            this.connectionPromise = null;
            console.log("Database connection closed");
        }
    }
}

// Export a singleton instance
module.exports = new DatabaseConnection();