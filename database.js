import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV !== 'production') sqlite3.verbose();


export class Database {
    constructor(filename = 'app.db') {
        this.filename = filename;
    }

    async init() {
        this.db = await open({
            filename: this.filename,
            driver: sqlite3.Database,
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS change_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                operation TEXT NOT NULL,
                sql TEXT NOT NULL,
                params TEXT
            )
        `);
    }

    async _logChange(operation, sql, params) {
        const timestamp = new Date().toISOString();
        await this.db.run(
            'INSERT INTO change_log (timestamp, operation, sql, params) VALUES (?, ?, ?, ?)',
            [timestamp, operation, sql, params ? JSON.stringify(params) : null]
        );
    }

    async run(sql, params = []) {
        try {
            const result = await this.db.run(sql, params);
            await this._logChange('run', sql, params);
            return result;
        } catch (err) {
            await this._logChange('run-error', sql, params);
            throw err;
        }
    }

    async exec(sql) {
        try {
            const result = await this.db.exec(sql);
            await this._logChange('exec', sql, null);
            return result;
        } catch (err) {
            await this._logChange('exec-error', sql, null);
            throw err;
        }
    }

    async get(sql, params = []) {
        return this.db.get(sql, params);
    }

    async all(sql, params = []) {
        return this.db.all(sql, params);
    }

    async close() {
        return this.db.close();
    }
}
