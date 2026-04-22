const isProd = process.env.NODE_ENV === 'production';

export function serverError(res, err, ctx) {
  console.error(`[${ctx}]:`, err);
  return res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
}
