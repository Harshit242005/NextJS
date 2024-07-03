import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/app/firebase';
import { useGlobalUidContext } from '@/app/context/uid';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import styles from './tasklist.module.css';

interface TaskListProps {
    setShowTaskList: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentComponent: React.Dispatch<React.SetStateAction<string>>;
    setTaskDocumentId: React.Dispatch<React.SetStateAction<string>>;
}

interface AssignedTaskMap {
    [key: string]: boolean;
}

interface TaskDocument {
    DocId: string;
    TaskData: {
        TaskName: string;
        Deadline: string;
    }
}

export default function TaskList({ setShowTaskList, setTaskDocumentId, setCurrentComponent }: TaskListProps) {
    const { projectId } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [taskDocument, setTaskDocument] = useState<TaskDocument[]>([]);

    useEffect(() => {
        const fetchAssignedTasks = async () => {
            try {
                const docRef = query(collection(firestore, 'Tasks'), where('Project', "==", projectId));
                const querySnapshot = await getDocs(docRef);

                if (!querySnapshot.empty) {
                    const tasksMap: TaskDocument[] = [];
                    querySnapshot.forEach((doc) => {
                        const assignedTaskMap = doc.data().Assignies as AssignedTaskMap;
                        const docData = doc.data();
                        for (const [memberId, status] of Object.entries(assignedTaskMap)) {
                            if (memberId === uid && status === false) {
                                tasksMap.push({
                                    DocId: doc.id,
                                    TaskData: {
                                        TaskName: docData.Heading,
                                        Deadline: docData.Deadline
                                    }
                                });
                            }
                        }
                    });
                    setTaskDocument(tasksMap); // Set state once, after processing all documents
                }
            } catch (error) {
                console.error("Error fetching assigned tasks: ", error);
            }
        };

        fetchAssignedTasks();
    }, [uid, projectId]);

    const selectedTask = (taskId: string) => {
        // This function would change the outline of the task and hide the list of tasks
        // setShowTaskList(false); // Hide the current task list
        console.log(taskId);

        // // load and change the current component - 
        setTaskDocumentId(taskId);
        setCurrentComponent('TaskDetails');
    }


    for (const [taskData, data] of Object.entries(taskDocument)) {
        for (const task in data) {
            console.log(task);
        }
    }

    return (
        <div className={styles.TaskList}>
            <div className={styles.TaskListHeader}>
                <p className={styles.taskListHeading}>Project Tasks</p>
                <button className={styles.closeTaskListButton} onClick={() => setShowTaskList(false)}>
                    <img src="/Cross.png" alt='Close icon' />
                </button>
            </div>
            <div className={styles.taskColumn}>
                {
                    taskDocument.map(task => (
                        <div key={task.DocId} className={styles.taskTile} onClick={() => selectedTask(task.DocId)}>
                            <p className={styles.taskName}>{task.TaskData.TaskName}</p>
                            <p className={styles.deadline}>{task.TaskData.Deadline}</p>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}
