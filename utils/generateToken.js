import jwt from "jsonwebtoken";

const generateToken = (id, rememberMe = 0) => {
  // ✅ Safety check
  if (!process.env.JWT_SECRET) {
    console.error(
      "❌ CRITICAL: JWT_SECRET not found in environment variables!"
    );
    throw new Error("JWT_SECRET configuration error");
  }

  const time = rememberMe ? "30d" : "1d";
  console.log("🔑 Generating JWT token for user:", id);

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: time });
  //                      ^^^^^^^^^^^^^^^^^^^^^^
  //                      ✅ YE SAHI HAI!
};

export default generateToken;
