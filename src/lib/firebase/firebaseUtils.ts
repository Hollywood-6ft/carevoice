import { auth, db, storage, firebaseInitialized } from "./firebase";
import {
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  DocumentReference,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Auth functions
export const logoutUser = () => signOut(auth);

export const signInWithGoogle = async (): Promise<User | null> => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

// Fallback function to use localStorage when Firebase fails
const saveToLocalStorage = (collectionName: string, data: any): any => {
  try {
    // Get existing data for this collection
    const existingData = localStorage.getItem(`${collectionName}_collection`) || '[]';
    const collection = JSON.parse(existingData);
    
    // Add ID and timestamp
    const newItem = {
      ...data,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      _createdAt: new Date().toISOString(),
      _localOnly: true
    };
    
    // Save to collection
    collection.push(newItem);
    localStorage.setItem(`${collectionName}_collection`, JSON.stringify(collection));
    
    console.log(`Saved to localStorage ${collectionName} collection:`, newItem);
    return { id: newItem.id, ...newItem };
  } catch (error) {
    console.error(`Error saving to localStorage:`, error);
    throw error;
  }
};

// Firestore functions
export const addDocument = async (collectionName: string, data: any) => {
  try {
    console.log(`Adding document to ${collectionName} collection...`);
    
    // Try Firebase first if initialized
    if (firebaseInitialized) {
      try {
        const docRef = await addDoc(collection(db, collectionName), data);
        console.log(`Document added successfully with ID: ${docRef.id}`);
        return docRef;
      } catch (firebaseError) {
        console.error(`Error adding to Firebase, falling back to localStorage:`, firebaseError);
        // Fall back to localStorage
        return saveToLocalStorage(collectionName, data);
      }
    } else {
      // Firebase not initialized, use localStorage
      console.log("Firebase not initialized, using localStorage instead");
      return saveToLocalStorage(collectionName, data);
    }
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string, userId?: string) => {
  try {
    // Use any[] type for the documents array to satisfy TypeScript
    let documents: any[] = [];
    
    // Try to get from Firebase first if initialized
    if (firebaseInitialized) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const firebaseData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        documents = [...firebaseData];
      } catch (error) {
        console.error("Error getting documents from Firebase:", error);
      }
    }
    
    // Also get from localStorage and combine with Firebase data
    try {
      const localData = getLocalDocuments(collectionName);
      documents = [...documents, ...localData];
    } catch (error) {
      console.error("Error getting documents from localStorage:", error);
    }
    
    // Filter by userId if provided
    if (userId) {
      documents = documents.filter((doc: any) => doc.userId === userId);
    }
    
    // Return documents without clearing assessor fields
    // This allows users to edit and save assessor names
    return documents;
  } catch (error) {
    console.error(`Error retrieving documents from ${collectionName}:`, error);
    return [];
  }
};

// Helper function to get documents from localStorage
const getLocalDocuments = (collectionName: string) => {
  try {
    const data = localStorage.getItem(`${collectionName}_collection`) || '[]';
    return JSON.parse(data);
  } catch (error) {
    console.error("Error parsing localStorage data:", error);
    return [];
  }
};

export const updateDocument = (collectionName: string, id: string, data: any) => {
  // Check if it's a local document
  if (id.startsWith('local_')) {
    updateLocalDocument(collectionName, id, data);
    return Promise.resolve();
  }
  
  // Otherwise use Firebase
  return updateDoc(doc(db, collectionName, id), data);
};

// Helper function to update a document in localStorage
const updateLocalDocument = (collectionName: string, id: string, data: any) => {
  try {
    const existingData = localStorage.getItem(`${collectionName}_collection`) || '[]';
    const collection: any[] = JSON.parse(existingData);
    
    const updatedCollection = collection.map((item: any) => 
      item.id === id ? { ...item, ...data, _updatedAt: new Date().toISOString() } : item
    );
    
    localStorage.setItem(`${collectionName}_collection`, JSON.stringify(updatedCollection));
    console.log(`Updated local document ${id} in ${collectionName}`);
  } catch (error) {
    console.error(`Error updating local document:`, error);
    throw error;
  }
};

export const deleteDocument = (collectionName: string, id: string) => {
  // Check if it's a local document
  if (id.startsWith('local_')) {
    deleteLocalDocument(collectionName, id);
    return Promise.resolve();
  }
  
  // Otherwise use Firebase
  return deleteDoc(doc(db, collectionName, id));
};

// Helper function to delete a document from localStorage
const deleteLocalDocument = (collectionName: string, id: string) => {
  try {
    const existingData = localStorage.getItem(`${collectionName}_collection`) || '[]';
    const collection: any[] = JSON.parse(existingData);
    
    const filteredCollection = collection.filter((item: any) => item.id !== id);
    
    localStorage.setItem(`${collectionName}_collection`, JSON.stringify(filteredCollection));
    console.log(`Deleted local document ${id} from ${collectionName}`);
  } catch (error) {
    console.error(`Error deleting local document:`, error);
    throw error;
  }
};

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  try {
    console.log(`Uploading file: ${file.name} (${file.size} bytes) to ${path}`);
    
    // Create a reference to the file location
    const storageRef = ref(storage, path);
    
    // Basic metadata
    const metadata = {
      contentType: file.type
    };
    
    // Upload the file
    await uploadBytes(storageRef, file, metadata);
    
    // Get the download URL
    const url = await getDownloadURL(storageRef);
    console.log(`File uploaded successfully. Download URL: ${url}`);
    
    return url;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw new Error(`Upload failed: ${error.message || "Unknown error"}`);
  }
};
