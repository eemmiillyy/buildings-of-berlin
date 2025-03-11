"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.getClient = getClient;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env.local
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env.local') });
// Check if the database URL is defined
if (!process.env.DB_URL) {
    console.error('Database URL is not defined in .env.local file');
    process.exit(1);
}
// Create a new pool using the connection string from .env.local
const url = new URL(process.env.DB_URL);
const host = url.hostname;
const database = url.pathname.slice(1);
const port = url.port;
const user = url.username;
const password = url.password;
const pool = new pg_1.Pool({
    host: host,
    database: database,
    port: parseInt(port !== null && port !== void 0 ? port : '5432'),
    user: user,
    password: password,
    ssl: { rejectUnauthorized: false }
});
// Test the connection
pool.connect()
    .then((client) => {
    console.log('Successfully connected to PostgreSQL database');
    client.release();
})
    .catch((err) => {
    console.error('Error connecting to PostgreSQL database:', err);
});
/**
 * Execute a query with parameters
 * @param text The SQL query text
 * @param params The query parameters
 * @returns Promise with the query result
 */
function query(text, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const start = Date.now();
            const res = yield pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        }
        catch (err) {
            console.error('Error executing query:', err);
            throw err;
        }
    });
}
/**
 * Get a client from the pool
 * @returns A client from the pool
 */
function getClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = yield pool.connect();
        const query = client.query;
        const release = client.release;
        // Set a timeout of 5 seconds, after which we will log this client's last query
        // Add lastQuery property to client type
        const clientWithLastQuery = client;
        const timeout = setTimeout(() => {
            console.error('A client has been checked out for more than 5 seconds!');
            console.error(`The last executed query on this client was: ${clientWithLastQuery.lastQuery}`);
        }, 5000);
        client.release = () => {
            // Clear the timeout
            clearTimeout(timeout);
            // Set the methods back to their old implementation
            client.query = query;
            client.release = release;
            return release.apply(client);
        };
        return client;
    });
}
exports.default = {
    query,
    getClient,
    pool
};
