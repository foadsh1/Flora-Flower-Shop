function ensureLoggedIn(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

function ensureRole(role) {
  return (req, res, next) => {
    if (!req.session?.user || req.session.user.role !== role) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    next();
  };
}

module.exports = {
  ensureLoggedIn,
  ensureRole,
};
