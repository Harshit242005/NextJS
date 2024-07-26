'use client'
interface taskDetailsProps {
    taskDocumentId: string;
    setOpenTask: React.Dispatch<SetStateAction<boolean>>;
    setCurrentComponenet: React.Dispatch<SetStateAction<string>>;
    isMobile: boolean
}

interface assignedList {
    ImageUrl: string;
    Uid: string;
    Status: boolean;
}
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useGlobalUidContext } from '@/app/context/uid';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import styles from './taskdetails.module.css'
import { firestore } from "@/app/firebase";
import { collection, doc, Firestore, getDoc, getDocs, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useState, useEffect, SetStateAction } from "react";
export default function TaskDetails({ taskDocumentId, setOpenTask, setCurrentComponenet, isMobile }: taskDetailsProps) {
    // const [assigneMap, setAssigneMap] = useState({});
    const [assigneeList, setAssigneeList] = useState<assignedList[]>([]);
    const [taskId, setTaskId] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [creator, setCreator] = useState(false);
    const [creatorIamge, setCreatorImage] = useState('');


    // states for changing the status of the dialog 
    const [assigneeId, setAssigneeId] = useState<string>(''); // set the selected person id 
    const [dialogStatus, setDialogStatus] = useState<boolean>(false); // set th selected person status value for now
    const [openStatus, setOpenStatusDialog] = useState<boolean>(false); // to open and change the status 
    const [showAssignees, setShowAssignees] = useState<boolean>(false); // show the assignee dialogs

    // creating a array to hold the user object which would include the ImageUrl, Uid, and status level of the user 
    const [asssignies, setAssignies] = useState<string[]>([]);
    const { uid } = useGlobalUidContext();
    const { projectName } = useGlobalProjectIdContext();

    const getImageUrl = async (userUid: string) => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", userUid))
        const documents = await getDocs(q);
        if (!documents.empty) {
            const userImage = documents.docs[0].data().ImageUrl || '';

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

    // useEffect(() => {
    //     const getAssigneMap = async () => {
    //         const docRef = doc(firestore, 'Tasks', taskDocumentId);
    //         const document = await getDoc(docRef);
    //         if (document.exists()) {
    //             const documentAssigneMap = document.data().Assignies || {};
    //             const documentDescription = document.data().Description || '';


    //             const createdBy = document.data().CreatedBy;
    //             const taskID = document.data().TaskID;
    //             setTaskId(taskID);
    //             console.log('task id is', taskId);
    //             getCreatorImage(createdBy);
    //             setTaskDescription(documentDescription);
    //             if (createdBy === uid) {
    //                 setCreator(true);
    //             }
    //             //const newDocumentAssigneMap: { [key: string]: any } = {};
    //             console.log(documentAssigneMap);
    //             // Iterate over key-value pairs, apply a function, and update assigneMap
    //             const assignieList: string[] = [];
    //             const assignedList = await Promise.all(
    //                 Object.entries(documentAssigneMap).map(async ([key, value]) => {
    //                     // Apply your function to the key here
    //                     assignieList.push(key as string);
    //                     const transformedKey = await getImageUrl(key) as string;
    //                     console.log(key, value);
    //                     return {
    //                         'ImageUrl': transformedKey,
    //                         'Uid': key,
    //                         'Status': value as boolean
    //                     }

    //                 })

    //             );

    //             console.log(assignieList);
    //             setAssignies(assignieList);

    //             // Update the assigneMap state with the updatedAssignMap
    //             setAssigneeList(assignedList);
    //         }
    //     }

    //     getAssigneMap();
    // }, [taskDocumentId, uid]);

    useEffect(() => {
        const docRef = doc(firestore, 'Tasks', taskDocumentId);

        const unsubscribe = onSnapshot(docRef, async (document) => {
            if (document.exists()) {
                const documentAssigneMap = document.data().Assignies || {};
                const documentDescription = document.data().Description || '';
                const createdBy = document.data().CreatedBy;
                const taskID = document.data().TaskID;

                setTaskId(taskID);
                console.log('task id is', taskID); // Update to use taskID directly
                getCreatorImage(createdBy);
                setTaskDescription(documentDescription);

                if (createdBy === uid) {
                    setCreator(true);
                }

                console.log(documentAssigneMap);
                const assignieList: string[] = [];
                const assignedList = await Promise.all(
                    Object.entries(documentAssigneMap).map(async ([key, value]) => {
                        assignieList.push(key as string);
                        const transformedKey = await getImageUrl(key) as string;
                        console.log(key, value);
                        return {
                            'ImageUrl': transformedKey,
                            'Uid': key,
                            'Status': value as boolean
                        }
                    })
                );

                console.log(assignieList);
                setAssignies(assignieList);
                setAssigneeList(assignedList);
            }
        });

        // Clean up the subscription when the component unmounts or taskDocumentId/uid changes
        return () => unsubscribe();
    }, [taskDocumentId, uid, dialogStatus]);


    const updateFinishStatus = async () => {
        const docRef = doc(firestore, 'Tasks', taskDocumentId);
        await updateDoc(docRef, { Status: true });
        const assignedEmail: string[] = [];
        // loop over the list to send an email
        for (const id of asssignies) {
            const docRef = query(collection(firestore, 'Users'), where("Uid", "==", id));
            const docSnapshot = await getDocs(docRef);
            if (!docSnapshot.empty) {
                const docEmail = docSnapshot.docs[0].data()['Email'];
                assignedEmail.push(docEmail);
            }
        }
        // const response = await axios.post('http://localhost:5000/finishTask', {assigniesIds: assignedEmail, projectName: projectName, taskId: taskId});
        // console.log(response.status);
        const response = await axios.post('/api/finishTask', { assigniesIds: assignedEmail, projectName: projectName, taskId: taskId });
        console.log(response.status);
    }


    const openStatusDialog = (AssigneeUid: string, Status: boolean) => {
        if (AssigneeUid == uid) {
            setOpenStatusDialog(true);
            setDialogStatus(Status);
            setAssigneeId(AssigneeUid);
            setShowAssignees(false);
        }
    }

    const ChangeStatus = async () => {
        // setDialogStatus(!dialogStatus);
        setShowAssignees(false);
        setOpenStatusDialog(false);
        //  // change status of the person with the task id and it's id in the task document 
        // you have to store the revese dialog status of the current one 

        const taskDocumentDoc = doc(firestore, 'Tasks', taskDocumentId);
        const taskDocumentSnapshot = await getDoc(taskDocumentDoc);
        if (taskDocumentSnapshot.exists()) {
            const assignees = taskDocumentSnapshot.data().Assignies;
            assignees[assigneeId] = !dialogStatus;
            await updateDoc(taskDocumentDoc, { Assignies: assignees });
        }

        setAssigneeId('');
        setDialogStatus(!dialogStatus);

    }

    const CloseStatusChange = () => {
        setAssigneeId('');
        setOpenStatusDialog(false);

    }


    return (
        <main className={styles.mainBody}>
            <div className={styles.creatorData}>
                <img className={styles.creatorImage} src={creatorIamge} alt="Creator profile Image" />
                {/* {
                    creator &&
                    
                        <button onClick={updateFinishStatus} className={styles.finishButton}>Finish</button>
                   
                } */}
                {
                    !isMobile &&
                    <button onClick={updateFinishStatus} className={styles.finishButton}>Finish</button>
                }

            </div>
            <textarea className={styles.taskDescription} value={taskDescription} readOnly></textarea>
            <button className={styles.assigneeStatusButton} onClick={() => setShowAssignees(true)}>Assignees</button>
            {
                isMobile &&
                <button onClick={updateFinishStatus} className={styles.finishButton}>Finish</button>

            }

            {
                showAssignees &&
                <div className={styles.AssigneesDialog}>
                    <div className={styles.AssigneesDialogHeader}>
                        <p className={styles.AssignDialogHeaderHeading}>Assignee Status</p>
                        <button className={styles.AssigneeDialogCloseButton} onClick={() => setShowAssignees(false)}><Image src="../../../CloseIcon.svg" alt="close icon" width={25} height={25} /></button>
                    </div>
                    <div className={styles.assigneeMap}>
                        {
                            assigneeList.map(({ ImageUrl, Status, Uid }) => (
                                <div className={styles.assigneeMapRow} key={Uid}>
                                    <img src={ImageUrl} alt="User image" className={styles.assigneeImage} />
                                    <button disabled={Uid !== uid} className={styles.assigneeButton} onClick={() => openStatusDialog(Uid, Status)}>
                                        {Status ? 'Finished' : 'Assigned'}
                                    </button>
                                </div>
                            ))}
                    </div>
                </div>
            }

            {/* a dialog for showing option status */}
            {
                openStatus &&
                <div className={styles.StatusChangeButtons}>
                    <button className={`${styles.StatusChangeButton} ${styles.firstButton}`} onClick={ChangeStatus}>{openStatus ? 'Assigned' : 'Finish'}</button>
                    <button onClick={CloseStatusChange} className={styles.StatusChangeButton}><Image src="../../../CloseIcon.svg" alt="close icon" width={25} height={25} /></button>
                </div>
            }

        </main>
    )
}