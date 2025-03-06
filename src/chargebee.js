import { db, auth } from "./firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";

export const loadCheckout = (email, amount) => {
  return new Promise((resolve, reject) => {
    const chargebeeInstance = window.Chargebee.init({
      site: "styleuai-test",
    });

    chargebeeInstance.openCheckout({
      hostedPage: {
        type: "checkout_new",
      },
      subscription: {
        plan_id: "MST",
      },
      customer: {
        email,
      },
      invoice: {
        currency_code: "INR",
        total: amount * 100, // Convert to paisa
      },
      success: async function () {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error("User not authenticated");

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            let currentCredits = userSnap.data().credits || 0;
            let newCredits = calculateCredits(amount);

            await updateDoc(userRef, { credits: currentCredits + newCredits });

            resolve(true);
          } else {
            console.error("User not found in database");
            resolve(false);
          }
        } catch (error) {
          console.error("Error updating credits:", error);
          resolve(false);
        }
      },
      error: function (err) {
        console.error("Chargebee error:", err);
        resolve(false);
      },
    });
  });
};

// Function to calculate credits based on amount paid
function calculateCredits(amount) {
    if (amount >= 5000) {
        return Math.floor(amount / 40);
    } else if (amount >= 2500) {
        return Math.floor(amount / 50);
    } else if (amount >= 1000) {
        return Math.floor(amount / 60);
    } else if (amount >= 500) {
        return Math.floor(amount / 80);
    } else {
        return Math.floor(amount / 100);
    }
}
