const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json()); // Parse incoming JSON

// Webhook Endpoint for Chargebee
app.post("/chargebee-webhook", async (req, res) => {
    try {
        const event = req.body;
        console.log("Chargebee Webhook Event:", event);

        // Ensure correct event type
        if (event.event_type !== "payment_succeeded") {
            return res.status(400).json({ message: "Invalid event type" });
        }

        // Extract user details
        const userEmail = event.content.customer.email;
        const amountPaid = parseFloat(event.content.invoice.total) / 100; // Convert from paisa to INR

        if (!userEmail || isNaN(amountPaid)) {
            return res.status(400).json({ message: "Invalid data received" });
        }

        // Tiered Pricing Logic
        let creditsPurchased = 0;
        if (amountPaid >= 5000) creditsPurchased = amountPaid / 40;
        else if (amountPaid >= 2500) creditsPurchased = amountPaid / 50;
        else if (amountPaid >= 1000) creditsPurchased = amountPaid / 60;
        else if (amountPaid >= 500) creditsPurchased = amountPaid / 80;
        else creditsPurchased = amountPaid / 100;

        // Find user in Firestore by email
        const userQuery = await db.collection("users").where("email", "==", userEmail).limit(1).get();

        if (userQuery.empty) {
            console.log("User not found for email:", userEmail);
            return res.status(404).json({ message: "User not found in database" });
        }

        // Update credits for found user
        const userDoc = userQuery.docs[0];
        const userRef = db.collection("users").doc(userDoc.id);

        await userRef.update({
            credits: admin.firestore.FieldValue.increment(Math.floor(creditsPurchased)),
        });

        console.log(`Credits updated successfully for user: ${userEmail}`);
        return res.status(200).json({ message: "Credits updated successfully" });

    } catch (error) {
        console.error("Error handling webhook:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Deploy the function
exports.api = functions.https.onRequest(app);
