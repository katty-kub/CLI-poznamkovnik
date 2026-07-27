export function notFound(req, res) {
  res.status(404).json({
    error: {
      status: 404,
      message: `Cesta ${req.method} ${req.originalUrl} neexistuje`,
    },
  });
}
