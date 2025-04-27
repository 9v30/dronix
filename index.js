import express from 'express';
import { Database } from './database.js';
import { UserManager } from './user-manager.js';
import { authenticate } from './auth.js';
import { encrypt, decrypt } from './encrypt.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const db = new Database();
await db.init();
const userManager = new UserManager(db);
await userManager.init();

// ログイン
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const result = await userManager.login(username, password);

    if (result.success) {
        const rawToken = `${username}:${password}`;
        const token = encrypt(rawToken);
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, error: result.error });
    }
});

// 新規登録
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const result = await userManager.register(username, password);

    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

app.get('/me', authenticate(userManager), (req, res) => {
    const user = req.user;

    // パスワードは暗号化してるけど、一応返さないようにする
    res.json({ success: true, user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
    } });
});


app.post('/change-password', authenticate(userManager), async (req, res) => {
    const { newPassword } = req.body;
    const user = req.user;

    if (!newPassword) {
        return res.status(400).json({ success: false, error: 'New password is required' });
    }

    const result = await userManager.changePassword(user.id, newPassword);

    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

// ユーザー削除
app.delete('/delete', authenticate(userManager), async (req, res) => {
    const user = req.user;

    const result = await userManager.deleteUser(user.username);

    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});


app.listen(7777, () => {
    console.log('Server running on http://localhost:7777');
});
