import { encrypt, decrypt } from './encrypt.js';

const ERROR_MESSAGES = {
    USERNAME_EXISTS: 'Username already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    USER_NOT_FOUND: 'User not found or deleted',
    USER_NOT_FOUND_OR_DELETED: 'User not found or already deleted',
    PASSWORD_VALIDATION_ERROR: 'Password is not a valid',
};

function isValidPassword(password) {
    // 条件1: 使用可能な文字（8～16文字）をチェック
    if (!/^[a-zA-Z0-9@$!%*?&]{8,16}$/.test(password)) {
        return false;
    }

    // 条件2: 最低でも2種類以上の文字タイプをチェック
    let characterTypes = 0;
    if (/[a-z]/.test(password)) characterTypes++; // 小文字
    if (/[A-Z]/.test(password)) characterTypes++; // 大文字
    if (/\d/.test(password)) characterTypes++; // 数字
    if (/[@$!%*?&]/.test(password)) characterTypes++;

    // 条件3: 2種類以上の文字タイプが含まれているか確認
    return characterTypes >= 2;
}


export class UserManager {
    constructor(db) {
        this.db = db;
    }

    async init() {
        await this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                deleted INTEGER NOT NULL DEFAULT 0
            )
        `);
    }

    async register(username, password) {
        try {
            if (!isValidPassword(password)) {
                return { success: false, error: ERROR_MESSAGES.PASSWORD_VALIDATION_ERROR };
            }

            const encryptedPassword = encrypt(password);
            await this.db.run(`
                INSERT INTO users (username, password) VALUES (?, ?)
            `, [username, encryptedPassword]);
            return { success: true };
        } catch (e) {
            if (e.message.includes('UNIQUE')) {
                return { success: false, error: ERROR_MESSAGES.USERNAME_EXISTS };
            }
            throw e;
        }
    }

    async login(username, password) {
        const user = await this.db.get(`
            SELECT id, username, password, created_at FROM users
            WHERE username = ? AND deleted = 0
        `, [username]);

        if (!user || decrypt(user.password) !== password) {
            return { success: false, error: ERROR_MESSAGES.INVALID_CREDENTIALS };
        }

        return { success: true, data: user };
    }

    async deleteUser(username) {
        const result = await this.db.run(`
            UPDATE users SET deleted = 1 WHERE username = ? AND deleted = 0
        `, [username]);

        if (result.changes === 0) {
            return { success: false, error: ERROR_MESSAGES.USER_NOT_FOUND_OR_DELETED };
        }

        return { success: true };
    }

    async getActiveUsers() {
        const data = await this.db.all(`
            SELECT id, username, created_at FROM users
            WHERE deleted = 0
        `);

        return { success: true, data };
    }

    async getUserById(id) {
        const data = await this.db.get(`
            SELECT id, username, created_at FROM users
            WHERE id = ? AND deleted = 0
        `, [id]);

        if (!data) {
            return { success: false, error: ERROR_MESSAGES.USER_NOT_FOUND };
        }

        return { success: true, data };
    }

    async changePassword(id, newPassword) {
        if (!isValidPassword(newPassword)) {
            return { success: false, error: ERROR_MESSAGES.PASSWORD_VALIDATION_ERROR };
        }

        const encryptedPassword = encrypt(newPassword);
    
        const result = await this.db.run(`
            UPDATE users SET password = ? WHERE id = ? AND deleted = 0
        `, [encryptedPassword, id]);
    
        if (result.changes === 0) {
            return { success: false, error: ERROR_MESSAGES.USER_NOT_FOUND };
        }
    
        return { success: true };
    }
    
}
