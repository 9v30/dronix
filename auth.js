import { encrypt, decrypt } from './encrypt.js';

export function authenticate(userManager) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            const raw = decrypt(token);
            const [username, password] = raw.split(':');

            if (!username || !password) {
                return res.status(401).json({ success: false, error: 'Invalid token' });
            }

            const user = await userManager.login(username, password);
            if (!user.success) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            req.user = user.data;
            next();
        } catch (err) {
            console.error(err);
            return res.status(401).json({ success: false, error: 'Authentication failed' });
        }
    };
}
