module.exports = function konselApiKey(req, res, next) {
  const expectedKey = process.env.KONSEL_API_KEY || 'konsel_ai_secret_sangkuriang_2026';
  const providedKey = req.headers['x-konsel-key'] || req.query.key;

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: API Key Konsel.AI tidak valid.',
    });
  }

  next();
};
