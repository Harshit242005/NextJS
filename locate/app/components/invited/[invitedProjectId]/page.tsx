
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/app/firebase';
import { useGlobalUidContext } from '@/app/context/uid';
import { useGlobalSocketContext } from '@/app/context/socket';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { firestore } from '@/app/firebase';
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


export default function invited({ params }: { params: { invitedProjectId: string } }) {
    const [projectName, setProjectNameFromId] = useState<string>('');
    const { setUserId } = useGlobalSocketContext();
    const { setProjectCreator, setProjectId, setProjectName } = useGlobalProjectIdContext();

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

        getProjectName();
    }, [params.invitedProjectId]);


    const router = useRouter();
    const { setUid, setEmail, setImageUrl, setUserName, uid } = useGlobalUidContext();
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

        // add the uid in the members list 
        const project_ref = doc(firestore, 'Projects', params.invitedProjectId);
        const project_snapshot = await getDoc(project_ref);
        if (project_snapshot.exists()) {
            const members = project_snapshot.data().members;
            const new_members = arrayUnion(...members, uid);
            await updateDoc(project_ref, {members: new_members});
        }


        // add project name in the member projects list as well
        const user_ref = query(collection(firestore, 'Users'), where('Uid', "==", uid));
        const user_ref_snapshot = await getDocs(user_ref);
        if (!user_ref_snapshot.empty) {
            const user_doc_data = user_ref_snapshot.docs[0].data()['Projects'];
            const user_one_ref = doc(firestore, 'Users', user_ref_snapshot.docs[0].id);
            const new_projects = arrayUnion(...user_doc_data, projectName);
            await updateDoc(user_one_ref, {Projects: new_projects});
        }


        // Document exists, navigate to the landing page
        router.push('/components/interface');

    }

    
    return
    <div>
        <p>You have been invited to join the project {projectName}</p>
        <div>
            <button onClick={googleSignIn}>Accept</button>
            <button>Reject</button>
        </div>
    </div>
}