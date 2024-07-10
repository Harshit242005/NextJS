'use client';
import styles from "./page.module.css";
// import { auth, googleAuthProvider, firestore } from './firebaseData/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';
import { useGlobalUidContext } from "./context/uid";
import { useGlobalSocketContext } from "./context/socket";
import { firestore } from "./firebase";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";




export default function Home() {
  const { setUserId } = useGlobalSocketContext();
 



  const router = useRouter();
  const { setUid, setEmail, setImageUrl, setUserName } = useGlobalUidContext();
  // function to handle google signup
  const googleSignIn = async () => {
    // check if the data exist the localstorage and if yes then just navigate efficently
    if (typeof window !== 'undefined' && localStorage.getItem('UserUid')) {
      setUid(localStorage.getItem('UserUid'));
      setEmail(localStorage.getItem('UserEmail'));
      setImageUrl(localStorage.getItem('UserImageUrl') || '');
      setUserName(localStorage.getItem('UserName'));
  
      setUserId(localStorage.getItem('UserUid') || '');
      

      // update the doc itself for the true status 
      const userDocRef = collection(firestore, 'Users');
      const q = query(userDocRef, where('Uid', '==', localStorage.getItem('UserUid')));
      const userDocSnapshot = await getDocs(q);
      const userDocId = userDocSnapshot.docs[0].id;
      const docRef = doc(firestore, 'Users', userDocId);
      await updateDoc(docRef, { 'Status': true });

      // Document exists, navigate to the landing page
      router.push('/components/landing');
    }
    else {



      const provider = new GoogleAuthProvider();
      


      // Set prompt option to select_account
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
     




      // here we would set up the application side of our websocket 
      setUserId(result.user.uid);
      localStorage.setItem('UserUid', result.user.uid);


      if (result.user.photoURL != null) {
        setImageUrl(result.user.photoURL);
        localStorage.setItem('UserImageUrl', result.user.photoURL);
      }
      setEmail(result.user.email);
      localStorage.setItem('UserEmail', result.user.email || '');
      // setUserName(result.user.displayName);

      // Fetch the document corresponding to the user's UID
      const userDocRef = collection(firestore, 'Users');
      const q = query(userDocRef, where('Uid', '==', result.user.uid));
      const userDocSnapshot = await getDocs(q);

      if (!userDocSnapshot.empty) {
        // Set the status to true while signing up 
        const userDocId = userDocSnapshot.docs[0].id;
        const user_name = userDocSnapshot.docs[0].data()['Name'] || '';
        const user_image = userDocSnapshot.docs[0].data()['ImageUrl'] || '';
        setUserName(user_name);
        setImageUrl(user_image);
        localStorage.setItem('UserName', user_name);
        localStorage.setItem('UserImageUrl', user_image);
        const docRef = doc(firestore, 'Users', userDocId);
        await updateDoc(docRef, { 'Status': true });


        // Document exists, navigate to the landing page
        router.push('/components/landing');
      } else {
        // Document doesn't exist, navigate to the workspace page
        router.push('/components/workspace');
      }
    }
  }

 
  return (
    <main className={styles.body}>
      <h1 className={styles.heading}>ProjeKt</h1>
      <button className={styles.signupButton} onClick={googleSignIn}>
        <img src="google.png" className={styles.googleImageIcon} />
        Sign up with google
      </button>

    </main>
  );
}
