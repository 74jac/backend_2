
export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            status: "error",
            message: "Formato JSON inválido en el cuerpo de la petición"
        });
    }

    
    if (err.name === "ValidationError") {
        return res.status(400).json({
            status: "error",
            message: err.message
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            status: "error",
            message: "Identificador con formato inválido"
        });
    }

    
    if (err.code === 11000) {
        return res.status(409).json({
            status: "error",
            message: "Conflicto: el recurso ya existe"
        });
    }

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Error interno del servidor";

    return res.status(statusCode).json({
        status: "error",
        message
    });
}

