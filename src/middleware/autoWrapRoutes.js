export function asyncHandler(handler) {
  return (req, res, next) => {
    try {
      const result = handler(req, res, next);

      if (result && typeof result.catch === 'function') {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function autoWrapRoutes(router) {
  // HTTP methods that should be auto-wrapped
  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

  methods.forEach(method => {
    const originalMethod = router[method];

    router[method] = function(path, ...handlers) {
      // Wrap each handler function with async error catching
      const wrappedHandlers = handlers.map(handler => {
        if (typeof handler === 'function' && handler.length >= 2 && handler.length <= 3) {
          return asyncHandler(handler);
        }
        return handler;
      });

      // Call original method with wrapped handlers
      return originalMethod.call(this, path, ...wrappedHandlers);
    };
  });

  return router;
}
