import bcrypt from 'bcrypt';
import { query } from '../database/index.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username',
            [email, username, hashedPassword]
        );

        const user = result.rows[0];
        const token = generateToken(user.id);

        res.status(201).json({ user, token });
    } catch (err) {
        if (err.code === '23505') { // unique violation
            return res.status(409).json({ error: 'Email or username already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user.id);
        delete user.password_hash;

        res.json({ user, token });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getMe = async (req, res) => {
    try {
        const result = await query('SELECT id, email, username, status FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const searchUsers = async (req, res) => {
    const { q } = req.query;
    try {
        const result = await query(
            'SELECT id, username, email FROM users WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2 LIMIT 20',
            [`%${q}%`, req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

export const updateProfile = async (req, res) => {
    const { username, status } = req.body;
    const userId = req.user.id;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const result = await query(
            'UPDATE users SET username = $1, status = $2 WHERE id = $3 RETURNING id, username, email, status',
            [username, status, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // unique violationtab messages
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
};
export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await query(
            'SELECT id, username, email, status FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
