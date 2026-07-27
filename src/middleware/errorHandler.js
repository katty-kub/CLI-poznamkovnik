export function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: {
      status,
      message: status === 500 ? "Chyba serveru" : error.message,
    },
  });
}
