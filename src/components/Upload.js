import { useState } from "react";
import { auth, db, storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const user = auth.currentUser;

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first!");
    if (!user) return alert("Please log in first!");

    setLoading(true);
    setMessage("");

    try {
      // Get user credits
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setMessage("User not found.");
        setLoading(false);
        return;
      }

      let currentCredits = userSnap.data().credits || 0;

      if (currentCredits <= 0) {
        setMessage("Not enough credits! Buy more to continue.");
        setLoading(false);
        return;
      }

      // Upload file to Firebase Storage
      const fileRef = ref(storage, `uploads/${user.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(fileRef);

      // Deduct 1 credit and update Firestore
      await updateDoc(userRef, {
        credits: currentCredits - 1,
        uploadedFiles: arrayUnion({ name: file.name, url: fileURL, timestamp: Date.now() }),
      });

      setMessage("✅ File uploaded successfully! 1 credit deducted.");
      setFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Upload File</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full p-2 border rounded mb-2"
        />

        <button
          className={`w-full mb-2 p-2 rounded text-white ${
            loading || !file ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"
          }`}
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {message && <p className="text-sm mt-2 text-red-500">{message}</p>}
      </div>
    </div>
  );
};

export default Upload;
