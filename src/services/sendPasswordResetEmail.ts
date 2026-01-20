import { auth, db } from '../config/firebase.config';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!email) throw new Error('Email is required');
  // Case-insensitive check for registered email
  const emailLower = email.trim().toLowerCase();
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', emailLower));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    // Email not registered
    throw new Error('Email not registered. Please register first.');
  }
  await firebaseSendPasswordResetEmail(auth, email);
}
