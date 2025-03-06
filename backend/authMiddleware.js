const admin = require("firebase-admin");

// Initialize Firebase Admin SDK (Ensure your Firebase service account is configured)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require("./serviceAccountKey.json")),
  });
}

// Middleware to verify Firebase ID Token
const authenticateUser = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split(" ")[1]; // Extract token

    if (!idToken) {
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    req.user = decodedToken; // Attach user data to request
    next(); // Proceed to the next middleware
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ error: "Unauthorized - Invalid token" });
  }
};

module.exports = authenticateUser;
