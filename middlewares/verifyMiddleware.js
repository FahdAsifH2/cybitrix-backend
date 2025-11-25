const verify = async (req, res, next) => {
  if (req.user.role === 0) return next();

  if (req.user.isVerified) return next();
  else {
    res.status(403).send({
      msg: {
        title: "Your account is not verified! 🤪",
      },
    });
  }
};

export default verify;
