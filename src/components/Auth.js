import { useState } from "react";
import { auth, db } from "../firebase";
import { 
  getAuth, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Function to create a Chargebee customer
const createChargebeeCustomer = async (userId, email) => {
  try {
    const response = await fetch("http://your-backend-url.com/api/chargebee/create-customer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      throw new Error("Chargebee customer creation failed");
    }

    const data = await response.json();
    return data.chargebeeCustomerId || null; // Ensure null instead of undefined
  } catch (error) {
    console.error("Error creating Chargebee customer:", error);
    return null; // Return null on failure to avoid undefined issues
  }
};

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Function to send ID token to backend
  const sendTokenToBackend = async (idToken) => {
    try {
      const response = await fetch("http://your-backend-url.com/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      console.log("User authenticated with backend successfully");
    } catch (error) {
      console.error("Error sending token to backend:", error);
    }
  };

  // Register user
  const register = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate Chargebee customer ID
      const chargebeeCustomerId = await createChargebeeCustomer(user.uid, user.email);

      // Prepare user data
      const userData = {
        email: user.email,
        credits: 0,
        paymentDetails: [],
      };

      // Only add chargebeeCustomerId if it's not null
      if (chargebeeCustomerId) {
        userData.chargebeeCustomerId = chargebeeCustomerId;
      }

      // Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      // Send ID token to backend
      const idToken = await user.getIdToken();
      await sendTokenToBackend(idToken);

      alert("Account created!");
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  // Login user
  const login = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch existing user data
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // If Chargebee ID is missing, create and update it
        if (!userData.chargebeeCustomerId) {
          const newChargebeeCustomerId = await createChargebeeCustomer(user.uid, user.email);
          if (newChargebeeCustomerId) {
            await updateDoc(userRef, { chargebeeCustomerId: newChargebeeCustomerId });
          }
        }
      } else {
        console.error("User not found in Firestore");
      }

      // Send ID token to backend
      const idToken = await user.getIdToken();
      await sendTokenToBackend(idToken);

      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  // Google Sign-In
  const googleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const chargebeeCustomerId = await createChargebeeCustomer(user.uid, user.email);

        const userData = {
          email: user.email,
          credits: 0,
          paymentDetails: [],
        };

        if (chargebeeCustomerId) {
          userData.chargebeeCustomerId = chargebeeCustomerId;
        }

        await setDoc(userRef, userData);
      }

      // Get ID token and send to backend
      const idToken = await user.getIdToken();
      await sendTokenToBackend(idToken);

      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Login / Signup</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full p-2 bg-blue-500 text-white rounded mb-2" onClick={login}>
          Login
        </button>
        <button className="w-full p-2 bg-green-500 text-white rounded mb-2" onClick={register}>
          Signup
        </button>
        <button className="w-full p-2 bg-red-500 text-white rounded" onClick={googleSignIn}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Auth;
