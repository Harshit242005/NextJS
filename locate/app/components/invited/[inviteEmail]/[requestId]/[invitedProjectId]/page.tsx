'use client';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/app/firebase';
import { useGlobalUidContext } from '@/app/context/uid';
import { useGlobalSocketContext } from '@/app/context/socket';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { firestore } from '@/app/firebase';
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from 'axios';
import styles from './page.module.css';

export default function invited({ params }: { params: { inviteEmail: string, requestId: string, invitedProjectId: string } }) {
    const [projectName, setProjectNameFromId] = useState<string>('');
    const { setUserId } = useGlobalSocketContext();
    const { setProjectCreator, setProjectId, setProjectName, projectCreator } = useGlobalProjectIdContext();
    const [senderImage, setSenderImage] = useState('');
    const [senderName, setSenderName] = useState('');
    const [requestValidity, setRequestValidity] = useState<boolean>(false);


    useEffect(() => {
        console.log(params.requestId)
        const checkRequestValidity = async () => {
            const validityResponse = await axios.post('https://supabaseAdd.glitch.me/checkRequest', {
                RequestId: params.requestId
            });

            console.log(validityResponse);
            if (validityResponse.status == 200) {
                setRequestValidity(validityResponse.data.Status);
            }
        }

        return () => {
            checkRequestValidity();
        }
    }, [params.requestId]);



    useEffect(() => {
        const getProjectName = async () => {
            const projectRef = doc(firestore, 'Projects', params.invitedProjectId);
            const projectSnapshot = await getDoc(projectRef);
            if (projectSnapshot.exists()) {
                const project_data = projectSnapshot.data();
                setProjectId(params.invitedProjectId);
                setProjectCreator(project_data.createdBy);
                setProjectName(project_data.projectName);
                setProjectNameFromId(project_data.projectName);
            }
        }


        const getSenderData = async () => {
            const senderDocRef = query(collection(firestore, 'Users'), where('Email', "==", params.inviteEmail));
            const senderDocSnapshot = await getDocs(senderDocRef);
            if (!senderDocSnapshot.empty) {
                const senderDoc = senderDocSnapshot.docs[0].data();
                console.log('Sender data', senderDoc);
                setSenderImage(senderDoc['Imageurl']);
                setSenderName(senderDoc['Name']);
            }

        }

        getProjectName();
        getSenderData();
    }, [params.inviteEmail, params.invitedProjectId]);


    // check the requestId for the users 

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
    const { setUid, setEmail, setImageUrl, setUserName, uid, email } = useGlobalUidContext();
    // function to handle google signup
    const googleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        // Set prompt option to select_account
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);


        setUserId(result.user.uid);
        setUid(result.user.uid);
        setUserName(result.user.displayName);
        if (result.user.photoURL != null) {
            setImageUrl(result.user.photoURL);
        }
        setEmail(result.user.email);


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
            const docRef = doc(firestore, 'Users', userDocId);
            await updateDoc(docRef, { 'Status': true });
        }



    }


    const accptedRequest = async () => {

        await googleSignIn();
        // add the uid in the members list 
        const project_ref = doc(firestore, 'Projects', params.invitedProjectId);
        const project_snapshot = await getDoc(project_ref);
        if (project_snapshot.exists()) {
            const members = project_snapshot.data().members;
            const new_members = arrayUnion(...members, uid);
            await updateDoc(project_ref, { members: new_members });
        }


        // add project name in the member projects list as well
        const user_ref = query(collection(firestore, 'Users'), where('Uid', "==", uid));
        const user_ref_snapshot = await getDocs(user_ref);
        if (!user_ref_snapshot.empty) {
            const user_doc_data = user_ref_snapshot.docs[0].data()['Projects'];
            const user_one_ref = doc(firestore, 'Users', user_ref_snapshot.docs[0].id);
            const new_projects = arrayUnion(...user_doc_data, projectName);
            await updateDoc(user_one_ref, { Projects: new_projects });
        }

        // send an update method to update the supabase database for the user 
        const accept_request_response = await axios.post('https://supabaseAdd.glitch.me/acceptedRequest', {
            'RequestId': params.requestId
        });



        // Document exists, navigate to the landing page
        router.push('/components/interface');
    }

    const rejectInvite = async () => {
        // get the email of the creator who has invited the user 
        const creator_ref = query(collection(firestore, 'Users'), where('Uid', "==", projectCreator));
        const creator_snapshot = await getDocs(creator_ref);
        let creator_email = ''
        if (!creator_snapshot.empty) {
            const creator_data = creator_snapshot.docs[0].data();
            creator_email = creator_data['Email'];
        }
        console.log({
            'projectCreatorEmail': creator_email,
            'rejectorEmail': email,
            'projectName': projectName
        });
        const response = await axios.post('https://fern-ivory-lint.glitch.me/rejectInvite', {
            'projectCreatorEmail': creator_email,
            'rejectorEmail': email,
            'projectName': projectName
        })
            .then(() => {
                console.log(response);
            })
            .catch((error: any) => {
                console.log(error);
            });

        const accept_request_response = await axios.post('https://supabaseAdd.glitch.me/rejectRequest', {
            'RequestId': params.requestId
        });

    }


    return (
        <div className={styles.mainContainer}>
            {requestValidity ?
                <div>
                    {/* this right here we can show the details like imagee and name of the sender of the invite  */}
                    <div className={styles.senderData}>
                        <img className={styles.senderImage} src={senderImage} alt="Sender image" />
                        <p className={styles.senderName}>{senderName}</p>
                    </div>
                    <p className={styles.description}>You have been invited to join the project <span className={` ${isMobile ? styles.noShow : styles.projectName}`}>{projectName}</span></p>
                    {
                        isMobile && <p className={styles.projectName}>{projectName}</p>
                    }
                    <div className={styles.acceptedButtons}>
                        <button className={styles.acceptedButton} onClick={accptedRequest}>Accept</button>
                        <button className={styles.acceptedButton} onClick={rejectInvite}>Reject</button>
                    </div>
                </div>
                :
                <div className={styles.noInvite}>
                    <p>Invite link has been expired</p>
                </div>
}
        </div>
    );

}