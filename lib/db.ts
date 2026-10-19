import "dotenv/config";
import { Pool } from "pg";

if (!process.env.DB_URL) {
    throw new Error(
        "Error: DB_URL environment variable is undefined! Check your .env file."
    );
}
const connPool = new Pool({
    connectionString: process.env.DB_URL,
});

export default connPool;
