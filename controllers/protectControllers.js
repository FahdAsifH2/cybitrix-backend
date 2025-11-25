const checkLogin = async (req, res) => {
  res
    .status(200)
    .send({ msg: { title: "All Okay! 🥳", desc: "You are authorized!" } });
};

export { checkLogin };
