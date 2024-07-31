'use client';
import styles from './workspace.module.css';
import { useGlobalUidContext } from "@/app/context/uid";
import { firestore } from '@/app/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Success from '../Animations/Success';



export default function workspace() {
    const router = useRouter();
    const [showCompletedTask, setShowCompletedTask] = useState<boolean>(false);
    // get the data from global context and present here in this 
    const { imageUrl, uid, email, setUserName, setImageUrl, setUid, setEmail, } = useGlobalUidContext();
    const [Name, setName] = useState<string>('');


    useEffect(() => {
        // Retrieve user data from localStorage if it exists
        if (typeof window !== 'undefined') {
            const storedUid = localStorage.getItem('UserUid');
            const storedEmail = localStorage.getItem('UserEmail');
            const storedImageUrl = localStorage.getItem('UserImageUrl');


            if (storedUid) {
                setUid(storedUid);
                setEmail(storedEmail || '');
                setImageUrl(storedImageUrl || '');


            }
        }
    }, []);



    console.log({
        'Name': Name,
        'Uid': uid,
        'Email': email,
        'ImageUrl': imageUrl,
        'Status': false,
        'Tasks': [],
        'Projects': [],
        'CompletedTasks': []
    });
    const SaveUser = async () => {
        setUserName(Name);
        localStorage.setItem('UserName', Name);
        await addDoc(collection(firestore, 'Users'), {
            'Name': Name,
            'Uid': uid,
            'Email': email,
            'ImageUrl': imageUrl,
            'Status': false,
            'Tasks': [],
            'Projects': [],
            'CompletedTasks': []
        });

        setShowCompletedTask(true);
        setTimeout(() => {
            setShowCompletedTask(false)
        }, 1000);


        // navigate to the main landing page which would be kind of dashboard like feel
        setTimeout(() => {
            router.push('/components/landing');
        }, 2000);
        // router.push('/components/landing');
    }

    return (
        <main className={styles.createWorkspace}>
            <div className={styles.workspaceData}>
                <img src={imageUrl} alt="Authenticated user" className={styles.userImage} style={{ width: 100, height: 100, borderRadius: '50%' }} />
                <div className={styles.emailDescription}>
                    <div style={{ marginTop: 25 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0 0 48 48">
                            <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"></path><path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"></path><polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"></polygon><path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"></path><path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"></path>
                        </svg>
                    </div>
                    <p className={styles.email}>{email}</p>
                </div>
            </div>
            <input type="text" onChange={(e) => setName(e.target.value)} placeholder="Type name..." className={styles.typeName} />

            <button className={styles.createButton}
                onClick={SaveUser}>
                Create</button>

            {
                showCompletedTask &&
                <Success successMessage='Workspace created successfully' />
            }
        </main>
    )
}