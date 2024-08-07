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
import Image from "next/image";
import CreateProject from "./landingComponents/CreateProject";
import Invite from "./landingComponents/Invite";
import CreateTask from "./landingComponents/CreateTask";
import Chat from "./landingComponents/Chat";



export default function Home() {
  const { setUserId } = useGlobalSocketContext();


  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 425);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 425);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);




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
      if (!userDocSnapshot.empty) {
        const userDocId = userDocSnapshot.docs[0].id;
        const docRef = doc(firestore, 'Users', userDocId);
        await updateDoc(docRef, { 'Status': true });
      }
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
      localStorage.setItem('UserName', result.user.displayName || '');

      if (result.user.photoURL != null) {
        setImageUrl(result.user.photoURL);
        localStorage.setItem('UserImageUrl', result.user.photoURL);
      }
      setEmail(result.user.email);
      setUserName(result.user.displayName || '');
      localStorage.setItem('UserEmail', result.user.email || '');
      setUid(result.user.uid);
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
    // <main className={styles.body}>

    //   <h1 className={styles.heading}>ProjeKt</h1>
    //   <button className={styles.signupButton} onClick={googleSignIn}>
    //     <img src="google.png" className={styles.googleImageIcon} />
    //     Sign up with google
    //   </button>

    // </main>

    <main className={styles.landingPage} style={{ overflowY: 'scroll', scrollBehavior: 'smooth', height: '100vh', scrollbarWidth: 'none' }}>


      <div className={styles.FirstSection}>

        {isMobile ? <Image className={styles.DesktopLandingSectionImage} src="./LandingMobile.svg" alt="Landing Image" width={400} height={400} />
          :
          <Image src="./LandingDesktop.svg" alt="Landing Image" width={600} height={600} />
        }

        <div className={styles.FistSectionApplicationImage}>
          <img src="./ApplicationFirstSectionIcon.svg" alt="" />
        </div>


      </div>

      <div className={styles.FirstSectionText}>
        <p className={styles.FirstSectioHeading}>ProjeKt</p>
        <p className={styles.FirstSectionSubHeading}>We help you stay productive</p>
        <button className={styles.FirstSectionButton} onClick={googleSignIn}>Get Stated</button>
      </div>


      <div className={styles.SecondSection}>
        <div className={styles.SecondSectionStart}>
          <p className={styles.SecondSectionStartHeading}>How ProjeKt Works</p>
          <Image src="./RightArrow.svg" className={styles.SecondSectionImage} alt="" width={100} height={100} />
        </div>
      </div>



      <CreateProject />
      <Image className={styles.SecondSectionLine} src="./Line.svg" alt="Line Vector" width={800} height={10} />
      <Invite />
      <Image className={styles.SecondSectionLine} src="./Line.svg" alt="Line Vector" width={800} height={10} />
      <CreateTask />
      <Image className={styles.SecondSectionLine} src="./Line.svg" alt="Line Vector" width={800} height={10} />
      <Chat />



      <div className={styles.SecondSection}>
        <div className={styles.SecondSectionStart}>
          <p className={styles.SecondSectionStartHeading}>Start Creating Projets</p>
          <Image src="./RightArrow.svg" className={styles.SecondSectionImage} alt="" width={100} height={100} />
        </div>
      </div>
      <button className={styles.FirstSectionButton} onClick={googleSignIn}>Get Stated</button>


    </main>
  );
}
