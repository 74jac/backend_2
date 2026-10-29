import passport from "passport";

// Middleware de autenticación: valida el JWT de la cookie mediante la estrategia "current"
// Responde 401 si no hay sesión válida y puebla req.user si es válida
export const authMiddleware = (req, res, next) => {
    passport.authenticate("current", { session: false }, (err, user) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "No autenticado"
            });
        }
        req.user = user;
        next();
    })(req, res, next);
};
