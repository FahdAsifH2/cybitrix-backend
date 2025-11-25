import jwt from "jsonwebtoken";

const generateToken = (id, rememberMe = 0) => {
  const time = rememberMe ? "30d" : "1d";
  return jwt.sign({ id }, process.env.TOKEN, { expiresIn: time });
};

export default generateToken;
