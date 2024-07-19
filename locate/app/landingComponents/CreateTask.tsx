
'use client';
import styles from './CreateTask.module.css';
import Image from 'next/image';
import { useState, useEffect } from 'react';


interface Task {
    project_name: string;
    task_name: string;
}

export default function CreateTask() {
    const [projectName, setProjectName] = useState<string>('');
    const [taskName, setTaskName] = useState<string>('');
    const [tasks, setTasks] = useState<Task[]>([]);


    const createTask = () => {
        if (projectName !== '' && taskName !== '') {
            const newTask: Task = { project_name: projectName, task_name: taskName };
            setTasks([...tasks, newTask]);
            setProjectName('');
            setTaskName('');
        }
    }

    const deleteTask = (taskName: string) => {
        const filteredTasks = tasks.filter(task => task.task_name !== taskName);
        setTasks(filteredTasks);
    }


    return (
        <main>
            <div className={styles.taskCreateBlock}>
                <div className={styles.containerText}>
                    <p className={styles.heading}>3.<br />
                        Create task
                    </p>
                    <p className={styles.subText}>Create task and assign
                        them to your friends
                        in the project</p>
                </div>


                {/* lets write the container  */}
                <div className={styles.container}>
                    <div className={styles.showTasks}>
                        {
                            tasks.length > 0 ?
                                <div className={styles.tasks}>
                                    {tasks.map((task, index) => (
                                        <div key={index} className={styles.taskItem}>
                                            <div className={styles.taskDataColumn}>
                                            <p className={styles.projectName}>{task.project_name}</p>
                                            <p className={styles.taskName}>{task.task_name}</p>
                                            </div>
                                            <button onClick={() => deleteTask(task.task_name)} className={styles.deleteTask}>
                                                <Image src="/DeleteIconSVG.svg" alt='Delete icon' width={25} height={25} />
                                            </button>
                                        </div>
                                    ))}
                                </div> :
                                <p className={styles.noTask}>No tasks created yet!</p>
                        }
                    </div>
                    <div className={styles.createTaskSection}>
                        <button onClick={createTask} className={styles.createTaskButton}><Image src="./createTask.svg" alt='Create task icon' width={75} height={75} /></button>
                        <div className={styles.createTaskInputSection}>
                            <input className={styles.createTaskInput} type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder='Type project name...' />
                            <input className={styles.createTaskInput} type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder='Type task name...' />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}