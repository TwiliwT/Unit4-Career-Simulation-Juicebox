function requireUser(req, res, next) {
  try {
    if (req.headers.authorization) {
      next();
    } else {
      throw "You need to be signed in to do that.";
    }
  } catch (error) {
    throw error;
  }
}

module.exports = {
  requireUser,
};
