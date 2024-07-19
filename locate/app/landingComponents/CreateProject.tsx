'use client';
import styles from './CreateProject.module.css';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CreateProject() {
    const [ProjectName, setProjectName] = useState<string>('');
    const [Projects, setProjects] = useState<string[]>([]);


    const addProject = () => {
        console.log('clicked');
        if (ProjectName !== '') {
            setProjects([...Projects, ProjectName]);
        }
        setProjectName('');
    }

    const deleteProject = (projectName: string) => {
        const filteredProjects = Projects.filter(project => project !== projectName);

        setProjects(filteredProjects);
    }





    return (
        <main className={styles.createProjectBlock}>
            {/* some text description for the container */}
            <div className={styles.containerText}>
                <p className={styles.heading}>1.<br />
                    Create Project
                </p>
                <p className={styles.subText}>We help you create
                    projects to start-up your
                    idea</p>
            </div>
            <div className={styles.Container}>
                <div className={styles.showProjects}>
                    {/* Projects */}
                    {Projects.length > 0 ?
                        <div className={styles.Projects}>
                            {
                                Projects.map((project, index) => (
                                    <div key={index} className={styles.projectItem}>
                                        <p className={styles.projectName}>{project}</p>
                                        <button onClick={() => deleteProject(project)} className={styles.deleteProject}><Image src="./DeleteIconSVG.svg" alt='Delete icon' width={25} height={25} /></button>
                                    </div>
                                ))
                            }
                        </div> : <p className={styles.noProjects}>No Projects</p>}
                </div>
                <div className={styles.createProjectSection}>
                    <button onClick={addProject} className={styles.createProjectButton}><Image src="./CreateProjectLandingPage.svg" alt="" width={50} height={50} /></button>
                    <input type="text" onChange={(e) => setProjectName(e.target.value)} value={ProjectName} className={styles.projectInput} placeholder='Type project name...' />
                </div>
            </div>
        </main>
    )
}