exports.deleteAccount = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: "Password required" });
  }

  if (password !== "1234") {
    return res.status(401).json({ error: "Incorrect password" });
  }

  return res.status(200).json({
    success: true,
    message: "Account deleted"
  });
};