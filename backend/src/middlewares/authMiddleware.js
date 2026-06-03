const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
    const token = req.cookies.jwt;
    
    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        res.status(401).json({ error: 'Not authorized, invalid token' });
    }
};

exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as an admin' });
    }
};
