export const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
export const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.status ?? 500;
  fail(res, status === 500 ? "Interner Serverfehler" : err.message, status);
}
