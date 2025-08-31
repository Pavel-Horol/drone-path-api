// Automatic Async Route Wrapper Middleware
// This eliminates the need for catchAsync wrappers in controllers

export function asyncHandler(handler) {
  return (req, res, next) => {
    // Call the handler and catch any promise rejections
    const result = handler(req, res, next);

    // If handler returns a Promise, catch errors automatically
    if (result && typeof result.catch === 'function') {
      result.catch(next);
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
        // Only wrap actual route handlers (functions with 3 params: req, res, next)
        // Don't wrap middleware (functions with 2 params: err, req, res, next)
        if (typeof handler === 'function' && handler.length === 3) {
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
