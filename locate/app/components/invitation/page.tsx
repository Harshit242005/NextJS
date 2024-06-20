// this should be server side component to get render and call back 
'use client';
import { useSearchParams } from "next/navigation";
import styles from './invite.module.css';
// for handling the firebase auth and firestore feature to create the new user or get the user from the old docs 
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/app/firebase';
import { useGlobalUidContext } from "../../context/uid";
import { firestore } from "@/app/firebase";
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";


export default function Invitation() {
    const [showUserData, setShowUserData] = useState<boolean>(false);
    const [invitedProjectId, setInvitedProjectId] = useState<any>('');
    const searchParams = useSearchParams();
    const [projectName, setProjectName] = useState('');
    setInvitedProjectId(searchParams.get('projectId'));
    const gmail = searchParams.get('gmail');
    const accessLevel = searchParams.get('accessLevel');
    // run a useEffect function to get the 

    useEffect(() => {
        
        // ask for getting the name of the project from the projectId
        // get the refrence of the collection
        const updateProjectData = async () => {
            
            try {
                const projectDocRef = doc(firestore, 'Projects', invitedProjectId);

        
                // Fetch the document snapshot
                const projectDocSnapshot = await getDoc(projectDocRef);
        
                if (projectDocSnapshot.exists()) {
                    // Document exists, you can access its data using projectDocSnapshot.data()
                    const projectData = projectDocSnapshot.data();
                    setProjectName(projectData.projectName);
                    console.log('Project data:', projectData);
                } else {
                    console.log('Document does not exist');
                }
            } catch (error) {
                console.error('Error fetching project document:', error);
            }
        }
       
    });


    const { setUid, setEmail, setImageUrl, userName, email, uid, imageUrl, setUserName } = useGlobalUidContext();
    // function to handle google signup
    const googleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        // Once the user is signed in, update the UID state with the user's UID
        setUid(result.user.uid);
        if (result.user.photoURL != null) {
            setImageUrl(result.user.photoURL);
        }
        setEmail(result.user.email);
        setUserName(result.user.displayName);


        // set the authentication is compelted and worked completely
        setShowUserData(true);

    };

    const  JoinProject = async () => {
        // function to join the group
        //  both project id and project data would be updated accordingly 
        

        // use the where and query to get the user document
        const userCollection = collection(firestore, 'Users');
        const user_docs = query(userCollection, where('Uid', '==', uid));
        const user_document = await getDocs(user_docs);
        // get the user document and update the accee level 
    }

    return (
        <main>
            {!showUserData &&
                <button className={styles.signupButton} onClick={googleSignIn}>
                    <img src="google.png" className={styles.googleImageIcon} />
                    Sign up with google
                </button>
            }

            {showUserData &&
                <div className={styles.userDescription}>
                    <img src={imageUrl} alt="Profile image" />
                    <div className={styles.userData}>
                        <p>{userName}</p>
                        <p>{email}</p>
                    </div>
                </div>}

            <div className={styles.InvitationData}>
                <h3>{projectName}</h3>
                <h4>You have been invited to join this project as</h4>
                <h5>{accessLevel}</h5>
                <button className={styles.JoinButton} onClick={JoinProject}>Join</button>
            </div>
        </main>
    )
}