import { useEffect, useState } from 'react';
import styles from './task.module.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/app/firebase';

interface TaskPage {
    taskId: string;
}

export default function Task({ taskId }: TaskPage) {
    console.log('Task id is', taskId);
    const [creatorName, setCreatorName] = useState<string>('');
    const [creatorImage, setCreatorImage] = useState<string>('');
    const [taskStatus, setTaskStatus] = useState<string>('');

    const [deadline, setDeadline] = useState<string>('');
    const [createdAt, setCreatedAt] = useState<string>('');
    const [taskName, setTaskName] = useState<string>('');
    const [taskDescription, setTaskDescription] = useState<string>('');

    useEffect(() => {

        const getName = async (creatorBy: string) => {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", creatorBy));
            const docs = await getDocs(q);
            if (!docs.empty) {
                const docData = docs.docs[0].data();
                const creator_name = docData['Name'];
                return creator_name;
            }
        }
        const getTaskData = async () => {
            const q = query(collection(firestore, 'Tasks'), where('TaskID', "==", taskId));
            const docs = await getDocs(q);
            if (!docs.empty) {
                const docData = docs.docs[0].data();
                const creator_name = await getName(docData['CreatedBy']);
                setCreatorName(creator_name);
                setCreatedAt(docData['CreatedAt']);
                setCreatorImage(docData['CreatorImage']);

                setDeadline(docData['Deadline']);
                setTaskName(docData['Heading']);
                setTaskDescription(docData['Description']);
                setTaskStatus(docData['Status']);
            }
        }

        getTaskData();
    }, [taskId]);

    return (
        <main style={{padding: 25}}>
            <div className={styles.Task}>
                <div className={styles.creatorData}>
                    <img className={styles.creatorImage} src={creatorImage} alt="Creator image" />
                    <p className={styles.creatorName}>{creatorName}</p>
                </div>
                <button className={styles.taskStatus}>{taskStatus}</button>
            </div>

            <div className={styles.TaskRow}>
                <div className={styles.TaskDataColumn}>
                    <div className={styles.TaskData}>
                        <p className={styles.taskheading}>Task Name</p>
                        <p className={styles.taskdata}>{taskName}</p>
                    </div>
                    <div className={styles.TaskData}>
                        <p className={styles.taskheading}>Task Description</p>
                        <p style={{width:460}} className={styles.taskdata}>{taskDescription}</p>
                    </div>
                </div>
                <div className={styles.TaskDataColumn}>
                    <div className={styles.TaskData}>
                        <p className={styles.taskheading}>Created At</p>
                        <p className={styles.taskdata}>{createdAt}</p>
                    </div>
                    <div className={styles.TaskData}>
                        <p className={styles.taskheading}>Deadline</p>
                        <p className={styles.taskdata}>{deadline}</p>
                    </div>
                </div>
            </div>
        </main>
    )
}