const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid authorization header" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

module.exports = authenticate;
module.exports.authorize = authorize;
