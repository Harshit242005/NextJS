'use client';
import styles from './Invite.module.css';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Invite() {

    const [inviteEmail, setInviteEmail] = useState<string>('');
    const [Invites, setInvites] = useState<string[]>([]);


    const addProject = () => {
        console.log('clicked');
        if (inviteEmail !== '') {
            setInvites([...Invites, inviteEmail]);
        }
        setInviteEmail('');
    }

    const deleteProject = (invite_email: string) => {
        const filteredProjects = Invites.filter(project => project !== invite_email);

        setInvites(filteredProjects);
    }

    const imagePaths = [
        './First.png',
        // Add more image paths as needed
    ];

    const getRandomImagePath = () => {
        const randomIndex = Math.floor(Math.random() * imagePaths.length);
        return imagePaths[randomIndex];
    }


    return (
        <main>
            <div className={styles.InviteBlock}>

                <div className={styles.container}>
                    <div className={styles.showInvites}>
                        {
                            Invites.length > 0 ?
                                <div className={styles.Invites}>

                                    {
                                        Invites.map((invitee, index) => (
                                            <div key={index} className={styles.projectItem}>
                                                {/* get random image place */}
                                                <img className={styles.randomImage} src={getRandomImagePath()} alt='Random image' />
                                                <p className={styles.projectName}>{invitee}</p>
                                                <button onClick={() => deleteProject(invitee)} className={styles.deleteProject}><Image src="./DeleteIconSVG.svg" alt='Delete icon' width={25} height={25} /></button>
                                            </div>
                                        ))
                                    }
                                </div> :
                                <p className={styles.noMember}>No Members yet!</p>
                        }
                    </div>
                    <div className={styles.inviteCreateSection}>
                        <button onClick={addProject} className={styles.createInvite}><Image src="./Invite.svg" alt='Invite icon' width={50} height={50} /></button>
                        <input className={styles.inviteEmailInput} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="text" placeholder='Type email...' />
                    </div>
                </div>

                <div className={styles.containerText}>
                    <p className={styles.heading}>2.<br />
                        Invite friends
                    </p>
                    <p className={styles.subText}>Invite your friends in your
                        project and build together</p>
                </div>
            </div>
        </main>
    )
}