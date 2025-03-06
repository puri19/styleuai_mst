import React, { useEffect, useState } from "react";
import { auth } from "../firebase";

const BuyCredits = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePurchase = () => {
    if (!user) {
      alert("You need to log in to purchase credits.");
      return;
    }

    const checkoutUrl = `https://${encodeURIComponent(process.env.REACT_APP_CHARGEBEE_SITE)}.chargebee.com/hosted_pages/checkout?subscription_items[item_price_id][0]=${encodeURIComponent(process.env.REACT_APP_CHARGEBEE_PLAN_ID)}&subscription_items[quantity][0]=1&layout=full_page`;
    
    window.location.href = checkoutUrl; // Redirect to Chargebee checkout
  };

  const openCustomerPortal = () => {
    if (!user) {
      alert("Please log in to manage your subscription.");
      return;
    }

    window.location.href = process.env.REACT_APP_CHARGEBEE_PORTAL; // Redirect to Chargebee portal
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Buy Credits</h2>
        <p className="mb-4 text-gray-600">Select a plan and proceed to payment.</p>

        <button
          onClick={handlePurchase}
          className="w-full p-2 mb-2 rounded text-white bg-green-500 hover:bg-green-600 disabled:opacity-50"
          disabled={!user}
        >
          {user ? "Purchase Credits" : "Login Required"}
        </button>

        <button
          onClick={openCustomerPortal}
          className="w-full p-2 rounded text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
          disabled={!user}
        >
          {user ? "Manage Subscription" : "Login Required"}
        </button>
      </div>
    </div>
  );
};

export default BuyCredits;
