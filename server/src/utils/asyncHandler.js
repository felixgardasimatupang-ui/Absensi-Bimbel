/**
 * Async handler wrapper to eliminate repetitive try-catch blocks in route handlers.
 * Automatically forwards any errors to Express error handling middleware.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => {
 *     // Your logic here without try-catch
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;