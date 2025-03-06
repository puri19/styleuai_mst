// import { useEffect, useState } from "react";
// import { auth, db } from "../firebase";
// import { doc, getDoc } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";
// import { signOut } from "firebase/auth"; 

// const Dashboard = () => {
//   const [credits, setCredits] = useState(0);
//   const [uploadedFiles, setUploadedFiles] = useState([]);
//   const navigate = useNavigate();
//   const user = auth.currentUser;

//   useEffect(() => {
//     if (user) {
//       const fetchUserData = async () => {
//         const userRef = doc(db, "users", user.uid);
//         const userSnap = await getDoc(userRef);

//         if (userSnap.exists()) {
//           const userData = userSnap.data();
//           setCredits(userData.credits || 0);
//           setUploadedFiles(userData.uploadedFiles || []);
//         }
//       };

//       fetchUserData();
//     }
//   }, [user]);

//   const handleLogout = async () => {
//     await signOut(auth);
//     navigate("/");
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
//         <h2 className="text-2xl font-bold mb-4 text-gray-700">Dashboard</h2>
        
//         <p className="text-lg mb-4 text-gray-600">
//           Your Credits: <strong className="text-blue-500">{credits}</strong>
//         </p>

//         <button
//           className="w-full mb-2 p-2 rounded text-white bg-blue-500 hover:bg-blue-600 transition"
//           onClick={() => navigate("/buy-credits")}
//         >
//           Buy Credits
//         </button>

//         <button
//           className="w-full mb-2 p-2 rounded text-white bg-purple-500 hover:bg-purple-600 transition"
//           onClick={() => navigate("/upload")}
//         >
//           Upload File
//         </button>

//         <button
//           className="w-full p-2 rounded text-white bg-red-500 hover:bg-red-600 mt-2 transition"
//           onClick={handleLogout}
//         >
//           Logout
//         </button>

//         {/* Uploaded Files Section */}
//         <h3 className="text-lg font-semibold mt-4 text-gray-700">Uploaded Files</h3>
//         <ul className="text-left w-full mt-2">
//           {uploadedFiles.length > 0 ? (
//             uploadedFiles.map((file, index) => (
//               <li key={index} className="p-2 border-b border-gray-300">
//                 <a
//                   href={file.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-500 underline"
//                 >
//                   {file.name}
//                 </a>
//               </li>
//             ))
//           ) : (
//             <p className="text-gray-500">No files uploaded yet.</p>
//           )}
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

const Dashboard = () => {
  const [credits, setCredits] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);

      // Listen for real-time updates
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setCredits(userData.credits || 0);
          setUploadedFiles(userData.uploadedFiles || []);
        }
      });

      return () => unsubscribe(); // Cleanup listener on unmount
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Dashboard</h2>
        
        <p className="text-lg mb-4 text-gray-600">
          Your Credits: <strong className="text-blue-500">{credits}</strong>
        </p>

        <button
          className="w-full mb-2 p-2 rounded text-white bg-blue-500 hover:bg-blue-600 transition"
          onClick={() => navigate("/buy-credits")}
        >
          Buy Credits
        </button>

        <button
          className="w-full mb-2 p-2 rounded text-white bg-purple-500 hover:bg-purple-600 transition"
          onClick={() => navigate("/upload")}
        >
          Upload File
        </button>

        <button
          className="w-full p-2 rounded text-white bg-red-500 hover:bg-red-600 mt-2 transition"
          onClick={handleLogout}
        >
          Logout
        </button>

        {/* Uploaded Files Section */}
        <h3 className="text-lg font-semibold mt-4 text-gray-700">Uploaded Files</h3>
        <ul className="text-left w-full mt-2">
          {uploadedFiles.length > 0 ? (
            uploadedFiles.map((file, index) => (
              <li key={index} className="p-2 border-b border-gray-300">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline"
                >
                  {file.name}
                </a>
              </li>
            ))
          ) : (
            <p className="text-gray-500">No files uploaded yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;


