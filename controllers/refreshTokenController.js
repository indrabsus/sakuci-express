const jwt = require('jsonwebtoken');
const { User } = require('../models');

const refreshTokenController = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(403).json({ message: 'Refresh token is required' });
    }

    try {
        // Cari user dengan refresh token
        const user = await User.findOne({ where: { refresh_token: refreshToken } });

        if (!user) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Verifikasi refresh token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, payload) => {
            if (err) return res.status(403).json({ message: 'Invalid or expired refresh token' });

            // Buat access token baru
            const newAccessToken = jwt.sign(
                { userId: user.id, username: user.username, id_role: user.id_role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({ accessToken: newAccessToken });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { refreshTokenController };