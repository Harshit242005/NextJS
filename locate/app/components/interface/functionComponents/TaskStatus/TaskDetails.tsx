'use client'
interface taskDetailsProps {
    taskDocumentId: string;
    setOpenTask: React.Dispatch<SetStateAction<boolean>>;
    setCurrentComponenet: React.Dispatch<SetStateAction<string>>;
}

interface assignedList {
    ImageUrl: string;
    Uid: string;
    Status: string;
}

import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useGlobalUidContext } from '@/app/context/uid';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import styles from './taskdetails.module.css'
import { firestore } from "@/app/firebase";
import { collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useState, useEffect, SetStateAction } from "react";
export default function TaskDetails({ taskDocumentId, setOpenTask, setCurrentComponenet }: taskDetailsProps) {
    // const [assigneMap, setAssigneMap] = useState({});
    const [assigneeList, setAssigneeList] = useState<assignedList[]>([]);
    const [taskId, setTaskId] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [creator, setCreator] = useState(false);
    const [creatorIamge, setCreatorImage] = useState('');

    // creating a array to hold the user object which would include the ImageUrl, Uid, and status level of the user 
    const [asssignies, setAssignies] = useState<string[]>([]);
    const { uid } = useGlobalUidContext();
    const {  projectName} = useGlobalProjectIdContext();
    const router = useRouter();

    const getImageUrl = async (userUid: string) => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", userUid))
        const documents = await getDocs(q);
        if (!documents.empty) {
            const userImage = documents.docs[0].data().ImageUrl || '';
            console.log(userImage);
            return userImage;
        }
    }

    const getCreatorImage = async (userUid: string) => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", userUid))
        const documents = await getDocs(q);
        if (!documents.empty) {
            const userImage = documents.docs[0].data().ImageUrl || '';
            console.log(userImage);
            setCreatorImage(userImage)
        }
    }

    useEffect(() => {
        const getAssigneMap = async () => {
            const docRef = doc(firestore, 'Tasks', taskDocumentId);
            const document = await getDoc(docRef);
            if (document.exists()) {
                const documentAssigneMap = document.data().Assignies || {};
                const documentDescription = document.data().Description || '';
              
                const createdBy = document.data().CreatedBy;
                const taskID = document.data().TaskID;
                setTaskId(taskID);
                console.log('task id is', taskId);
                getCreatorImage(createdBy);
                setTaskDescription(documentDescription);
                if (createdBy === uid) {
                    setCreator(true);
                }
                //const newDocumentAssigneMap: { [key: string]: any } = {};
                // Iterate over key-value pairs, apply a function, and update assigneMap
                const assignieList: string[] = [];
                const assignedList = await Promise.all(
                    Object.entries(documentAssigneMap).map(async ([key, value]) => {
                        // Apply your function to the key here
                        assignieList.push(key as string);
                        const transformedKey = await getImageUrl(key) as string;
                        return {
                            'ImageUrl': transformedKey,
                            'Uid': key,
                            'Status': value as string
                        }
                        
                    })
                    
                );
                setAssignies(assignieList);

                // Update the assigneMap state with the updatedAssignMap
                setAssigneeList(assignedList);
            }
        }

        getAssigneMap();
    }, [taskDocumentId, uid]);

    const updateFinishStatus = async () => {
        const docRef = doc(firestore, 'Tasks', taskDocumentId);
        await updateDoc(docRef, {Status: true});
        const assignedEmail: string[] = [];
        // loop over the list to send an email
        for (const id of asssignies) {
            const docRef = query(collection(firestore, 'Users'), where("Uid" ,"==", id));
            const docSnapshot = await getDocs(docRef);
            if (!docSnapshot.empty) {
                const docEmail = docSnapshot.docs[0].data()['Email'];
                assignedEmail.push(docEmail);
            }
        }
        // const response = await axios.post('http://localhost:5000/finishTask', {assigniesIds: assignedEmail, projectName: projectName, taskId: taskId});
        // console.log(response.status);
        const response = await axios.post('/api/finishTask', {assigniesIds: assignedEmail, projectName: projectName, taskId: taskId});
        console.log(response.status);   
    }

    const editTask = () => {
        setOpenTask(false);
        setCurrentComponenet('EditTask');
    }


    return (
        <main className={styles.mainBody}>
            <div className={styles.creatorData}>
                <img className={styles.creatorImgae} src={creatorIamge} alt="Creator profile Image" />
                <p className={styles.taskDescription}>{taskDescription}</p>
            </div>
            <div className={styles.assigneeMap}>
                

                {assigneeList.map(({ ImageUrl, Status, Uid }) => (
                    <div className={styles.assigneeMapRow} key={Uid}>
                        <img src={ImageUrl} alt="User image" className={styles.assigneeImage} />
                        <button className={styles.assigneeButton} disabled={Uid !== uid}>
                            {Status}
                        </button>
                    </div>
                ))}
            </div>
            {creator &&
                <div className={styles.taskButtons}>
                    <button onClick={editTask} className={styles.editButton}>Edit</button>
                    <button onClick={updateFinishStatus} className={styles.finishButton}>Finish</button>
                </div>
            }
        </main>
    )
}