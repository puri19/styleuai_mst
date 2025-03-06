const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Initialize Firebase
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://userauth-47b3b.firebaseio.com",
});

const db = admin.firestore();
app.use(bodyParser.json());

// Webhook route
app.post('/webhook/chargebee', async (req, res) => {
    try {
        console.log('Received Chargebee Webhook:', JSON.stringify(req.body, null, 2));

        const event = req.body;

        // Validate the payload
        if (!event || !event.content || !event.content.customer || !event.content.invoice) {
            console.error("Invalid webhook payload:", event);
            return res.status(400).json({ error: "Invalid webhook payload" });
        }

        const customerId = event.content.customer.id;
        const amountPaid = event.content.invoice.total / 100; // Convert from paisa to INR
        console.log(`Customer ID: ${customerId}, Amount Paid: ${amountPaid} INR`);

        // Calculate credits
        const creditsToAdd = calculateCredits(amountPaid);

        if (creditsToAdd > 0) {
            await updateCreditsInFirebase(customerId, creditsToAdd);
        } else {
            console.warn(`No credits awarded for payment: ${amountPaid} INR`);
        }

        res.status(200).send('Webhook received successfully');
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});

// Function to calculate credits based on amount paid
function calculateCredits(amountPaid) {
    if (amountPaid >= 5000) return Math.floor(amountPaid / 40);
    if (amountPaid >= 2500) return Math.floor(amountPaid / 50);
    if (amountPaid >= 1000) return Math.floor(amountPaid / 60);
    if (amountPaid >= 500) return Math.floor(amountPaid / 80);
    return Math.floor(amountPaid / 100);
}

// Function to update credits in Firebase
async function updateCreditsInFirebase(chargebeeCustomerId, creditsToAdd) {
    try {
        const usersRef = db.collection("users");
        const querySnapshot = await usersRef.where("chargebee_customer_id", "==", chargebeeCustomerId).get();

        if (querySnapshot.empty) {
            console.log(`Chargebee ID ${chargebeeCustomerId} not found in Firebase.`);

            // Try to find the user without a Chargebee ID and assign it
            const allUsers = await usersRef.get();
            let updatedUserId = null;

            for (let doc of allUsers.docs) {
                const userData = doc.data();
                if (!userData.chargebee_customer_id) {
                    updatedUserId = doc.id;
                    console.log(`Assigning Chargebee ID ${chargebeeCustomerId} to user ${updatedUserId}`);
                    await usersRef.doc(updatedUserId).update({ chargebee_customer_id: chargebeeCustomerId });
                    break;
                }
            }

            // If a user was updated, fetch again and update their credits
            if (updatedUserId) {
                console.log(`Re-fetching user ${updatedUserId} to update credits.`);
                await updateUserCredits(updatedUserId, creditsToAdd);
            }
            return;
        }

        // If Chargebee ID is found, update credits
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;

        console.log(`User found with Chargebee ID ${chargebeeCustomerId}, updating credits...`);
        await updateUserCredits(userId, creditsToAdd);
    } catch (error) {
        console.error("Error updating credits in Firebase:", error);
    }
}

// Separate function to update user credits
async function updateUserCredits(userId, creditsToAdd) {
    try {
        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            console.error(`User ${userId} not found in Firebase.`);
            return;
        }
        const userData = userSnap.data();
        const newCredits = (userData.credits || 0) + creditsToAdd;

        await userRef.update({ credits: newCredits });
        console.log(`Successfully updated credits for user ${userId}: +${creditsToAdd} credits (Total: ${newCredits})`);
    } catch (error) {
        console.error("Error updating user credits:", error);
    }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
