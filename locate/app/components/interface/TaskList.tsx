interface TaskListProps {
    setShowTaskList: React.Dispatch<React.SetStateAction<boolean>>;
}

interface AssignedTaskMap {
    [key: string]: string[];
}

// interface for the task document structure 
interface TaskDocument {
    DocId: string;
    TaskName: string;
    Deadline: string;
    Status: string;
}

import { useGlobalUidContext } from "@/app/context/uid";
import { useGlobalProjectIdContext } from "@/app/context/projectId";

import styles from './tasklist.module.css';
import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/app/firebase";
export default function TaskList({ setShowTaskList }: TaskListProps) {
    const { projectName } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();

    const [assignedTasks, setAssignedTasks] = useState<string[]>([]);
    const [taskDocument, setTaskDocument] = useState<TaskDocument[]>([]);

    useEffect(() => {
        const fetchAssignedTasks = async () => {
            try {
                const docRef = query(collection(firestore, 'Users'), where('Uid', "==", uid));
                const querySnapshot = await getDocs(docRef);

                if (!querySnapshot.empty) {
                    const userData = querySnapshot.docs[0].data();
                    const assignedTaskMap = userData.AssignedTask as AssignedTaskMap;

                    const tasksMap = new Map<string, string[]>();

                    for (const [project, taskIds] of Object.entries(assignedTaskMap)) {

                        if (project == projectName) {
                            // loop over the taskIds to get the document view 
                            // store the objects in the list
                            setAssignedTasks(taskIds);
                        }
                    }
                }
                const documentData = [];
                // make a for loop over the list and get the list of document created 
                for (const id of assignedTasks) {
                    const docRef = doc(firestore, 'Tasks', id);
                    const docSnap = await getDoc(docRef);
                    const docData = docSnap.data(); // gather the document data
                    if (docData != null) {
                        const docStructure = {
                            DocId: id,
                            TaskName: docData['Heading'],
                            Deadline: docData['Deadline'],
                            Status: docData['Status']
                        }

                        documentData.push(docStructure);
                    }
                }
                setTaskDocument(documentData);
            } catch (error) {
                console.error("Error fetching assigned tasks: ", error);
            }
        };

        fetchAssignedTasks();
    }, [uid, assignedTasks]);


    const selectedTask = () => {
        // this function would change the outling of the task adn hide the list of task
        setShowTaskList(false); // hide the current task list 
        
    }





    return (
        <div className={styles.TaskList}>
            <div className={styles.TaskListHeader}>
                <p className={styles.taskListHeading}>Project Tasks</p>
                <button className={styles.closeTaskListButton} onClick={() => setShowTaskList(false)}><img src="/Cross.png" alt='Close icon' /></button>
            </div>
            <div className={styles.taskColumn}>
                {/* here i would show the assigned tasks */}
                {/* looping over the map and the ids to show task */}
                {taskDocument.map(task => (
                    // had to add a onclick for the each task assigned to the user so can some details about the task
                    <div onClick={selectedTask} key={task.DocId} className={`${task.Status == 'Completed' ? styles.CompletedTasks : styles.tasks}`}>
                        <p className={styles.taskHeading}>{task.TaskName}</p>
                        <p className={styles.taskDeadline}>{task.Deadline}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}