'use client'
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"

import styles from './interface.module.css'
import { useState, useEffect } from "react";
import Image from "next/image"
import TaskList from './TaskList';
import TaskStatus from "./functionComponents/TaskStatus/TaskStatus";
import CreateTask from "./functionComponents/CreateTask/CreateTask";
import Members from "./functionComponents/Members/Members";
import Requests from "./functionComponents/Requests/page";
import Chat from "./functionComponents/Members/Chat"
import TaskDetails from "./functionComponents/TaskStatus/TaskDetails";
import EditTask from "./functionComponents/TaskStatus/EditTask";
import Task from "./Task";
import { useRouter } from "next/navigation";
// import inviteViaEmail from "../../../../External/invite";
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';
// import mailgun from 'mailgun-js';
import axios from 'axios';

import { collection, where, query, getDocs, updateDoc, doc, getDoc, onSnapshot, deleteDoc } from "firebase/firestore";
import { firestore, storage } from "@/app/firebase";
import { arrayBuffer } from "stream/consumers";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function Interface() {

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 425);
    const [openMobileMenu, setOpenMobileMenu] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const openMobileMenuSection = () => {
        console.log(isMobile, openMobileMenu);
        setOpenMobileMenu(!openMobileMenu);
    }



    const router = useRouter();

    const [inviteEmailUser, setInviteEmailUser] = useState<string>('');
    const { projectId, projectName, setProjectId, setProjectName } = useGlobalProjectIdContext();
    const { uid, setImageUrl, imageUrl, userName, email, setIsProjectMember, isProjectMember } = useGlobalUidContext();
    const [currentComponent, setCurrentComponenet] = useState<string>('Create task');
    const [openProfile, setOpenProfile] = useState<boolean>(false);
    const [showShare, setshowShare] = useState<boolean>(false);
    const [successfulInvite, setSuccessfulInviteUser] = useState<boolean>(false);
    const [taskId, setTaskId] = useState<string>('');


    const [openMessage, setOpenMessage] = useState<boolean>(false);
    const [messageUid, setMessageUid] = useState('');
    const [messageImageUrl, setMessagUserImageUrl] = useState<string>('');
    const [messageName, setMessageUserName] = useState<string>('');
    const [messageUserStatus, setMessageUserStatus] = useState<boolean>(false);
    const [showDeleteButton, setShowDeleteButton] = useState<boolean>(false); // to hide and show the delete button for the message header

    const changeDeleteButtonShow = () => {
        setShowDeleteButton(!showDeleteButton)
    }

    // to hold the function that i am going to call for the deletion of the chat
    const [deleteFunction, setDeleteFunction] = useState<(() => void) | undefined>(undefined);
    const [openMessageMenu, setOpenMessageMenu] = useState<boolean>(false);

    // for the task status 
    const [openTask, setOpenTask] = useState(false);
    const [taskHeading, setTaskHeading] = useState('');
    const [taskDocumentId, setTaskDocumentId] = useState('');
    const [taskAuthor, setTaskAuthor] = useState('');

    const deleteTask = async () => {
        // delete the task for the user 
        const assigniees_email = [];
        const docRef = doc(firestore, 'Tasks', taskDocumentId);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            const assignees = docSnapshot.data().Assignies;
            console.log(assignees);
            for (const [id, boolean_value] of Object.entries(assignees)) {
                const assignee_docRef = query(collection(firestore, 'Users'), where('Uid', "==", id));
                const assignee_docSnapshot = await getDocs(assignee_docRef);
                if (!assignee_docSnapshot.empty) {
                    assigniees_email.push(assignee_docSnapshot.docs[0].data()['Email']);
                }
            }
        }

        // send this to the glitch server to get the notification
        const response = await axios.post('https://fern-ivory-lint.glitch.me/sendTaskDelete', {
            'Headline': taskHeading,
            'Members': assigniees_email
        });
        console.log(response);


        // deleting the document itself 
        deleteDoc(docRef)
            .then(() => {
                console.log("Entire Document has been deleted successfully.")
            })
            .catch(error => {
                console.log(error);
            });

        // removing the current details for the user 
        RemoveTask();
    }



    const RemoveTask = () => {
        setTaskHeading('');
        setOpenTask(false);
        setTaskAuthor('');
        setTaskDocumentId('');
        setCurrentComponenet('Task status');
    }

    const RemoveMessage = () => {
        setOpenMessage(false);
        setMessageUid('');
        setMessagUserImageUrl('');
        setMessageUserName('');
    }


    // state hook to show the task list component
    const [showTaskList, setShowTaskList] = useState<boolean>(false);


    // use the useEffect to cross check if the user is a member or creator of the project
    useEffect(() => {
        const checkForMember = async () => {
            const q = query(collection(firestore, 'Projects'), where('projectName', "==", projectName));
            const documents = await getDocs(q);
            if (!documents.empty) {
                const createdBy = documents.docs[0].data().createdBy;
                console.log('created by', createdBy);
                console.log('uid is', uid);
                if (createdBy != uid) {
                    setIsProjectMember(true);
                    console.log('is project member value ', isProjectMember);
                }
            }
        }

        checkForMember();

        // Function to fetch user data and listen for user status
        const fetchUserDataAndListenStatus = async () => {
            if (messageUid !== '') {
                // Query to get user data
                const userDataQuery = query(collection(firestore, 'Users'), where('Uid', '==', messageUid));

                // Subscribe to real-time updates for user status
                const statusUnsubscribe = onSnapshot(userDataQuery, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'modified') {
                            const userData = change.doc.data();
                            setMessageUserStatus(userData.Status);
                        }
                        // if not modified then get the back value of the status which already exist
                        else {
                            const userData = change.doc.data();
                            setMessageUserStatus(userData.Status);
                        }
                    });
                });

                // Get user data
                const userDataDocs = await getDocs(userDataQuery);
                if (!userDataDocs.empty) {
                    const userDocData = userDataDocs.docs[0].data();
                    setMessageUserName(userDocData.Name);
                    setMessagUserImageUrl(userDocData.ImageUrl);
                }

                // Return an object with unsubscribe functions for cleanup
                return {
                    statusUnsubscribe
                };
            }
        };

        fetchUserDataAndListenStatus();


    }, [messageUid]);

    const changeShare = () => {
        setshowShare(!showShare);
        // setSuccessfulInviteUser(!successfulInvite);
    }

    const OpenProfile = () => {
        setOpenProfile(true);
        if (isMobile) {
            setOpenMobileMenu(!openMobileMenu);
        }
    }

    // remove the memberId 
    function removeFromArray(array: [], element: string | null) {
        return array.filter(item => item !== element);
    }

    const leaveProject = async () => {
        console.log('leave project is called');
        // first step
        try {
            // Query the user document
            const q = query(collection(firestore, 'Users'), where('Uid', '==', uid));
            const documents = await getDocs(q);

            if (!documents.empty) {
                const userDoc = documents.docs[0];
                const userDocId = userDoc.id;
                const userDocData = userDoc.data();

                // Update the Member variable value with an empty string
                await updateDoc(doc(firestore, 'Users', userDocId), { Member: '' });

                console.log('Member variable updated successfully.');
            } else {
                console.log('No user document found for the provided UID.');
            }
        } catch (error) {
            console.error('Error updating the Member variable:', error);
        }


        // second step
        try {
            const docRef = doc(firestore, 'Projects', projectId);
            const document = await getDoc(docRef);

            if (document.exists()) {
                const documentId = document.id;
                const documentData = document.data();
                const documentMembers = documentData.members || [];

                if (documentMembers.includes(uid)) {
                    const removedMember = removeFromArray(documentMembers, uid);
                    await updateDoc(docRef, { members: removedMember });
                    console.log('Members list has been updated');
                } else {
                    console.log('UID is not included in the member list');
                }
            } else {
                console.log('Document does not exist');
            }
        } catch (error) {
            console.log('Error removing UID from the member list of the project:', error);
        }


        // reroute back to the same page
        router.push('/components/landing');

    };





    const [clickedButton, setClickedButton] = useState<string>('Create task');

    // Function to handle button click
    const handleButtonClick = (buttonName: string) => {
        setCurrentComponenet(buttonName);
        // Update the state to track the clicked button
        setClickedButton(buttonName);
    };




    // function to invite the gamil user
    const Invite = async () => {

        // let's see how to run a nodemailer service to send the mail
        // for the unique URL formation
        const unique_url = `https://locatetest.netlify.app/components/invited/${projectId}`;
        // inviteViaEmail(unique_url);

        const response = await axios.post('https://fern-ivory-lint.glitch.me/sendInvite', {
            'inviteFrom': email,
            'inviteTo': inviteEmailUser,
            'projectName': projectName,
            'UniqueUrl': unique_url
        });

        console.log(response);

        if (response.status === 200) {
            // invite sent successfully
            setshowShare(!showShare);
            setSuccessfulInviteUser(true);
            // After 2 seconds, reset successfulInviteUser to false
            setTimeout(() => {
                setSuccessfulInviteUser(false);
            }, 2000); // 2000 milliseconds = 2 seconds
        }


    };


    const backMemberPage = () => {
        if (currentComponent == 'Task') {
            setCurrentComponenet('Members');
            setTaskId('');
        }
        else {
            setCurrentComponenet('Task status');
        }
    }

    // personal profile data
    const [userProfile, setUserProfile] = useState(false);
    const [dataChange, setDataChange] = useState<boolean>(false);
    const [newUserName, setNewUserName] = useState(userName);
    const [uploadedImage, setUploadedImage] = useState<null | string>(null);
    const [showCompletedTask, setShowCompletedTask] = useState<boolean>(false);
    const [showProjects, setShowProjects] = useState<boolean>(false);
    const [completedTaskList, setCompletedTaskList] = useState<string[]>([]);
    const [projects, setProjectsName] = useState<string[]>([]);


    const changePersonalImage = () => {
        const inputElement = document.getElementById('personalImage') as HTMLInputElement;
        if (inputElement) {
            inputElement.click();
        }
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDataChange(true);
                if (typeof reader.result === 'string') {
                    setUploadedImage(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };


    const changePersonalName = (newName: string) => {
        if (newName != userName) {
            setDataChange(true);
            setNewUserName(newName)
        }
    }

    // chnage the data from the ground level up 
    const changePersonalData = async () => {
        if (dataChange && uploadedImage) {

            // update the doc data first 


            // upload the file and get it's url back from the firebase storage 
            try {
                // Get the file from the input
                const fileInput = document.getElementById('personalImage') as HTMLInputElement;
                const file = fileInput.files?.[0];

                if (file) {
                    // Upload the file to Firebase Storage
                    const storageRef = ref(storage, file.name);
                    const fileRef = await uploadBytes(storageRef, file);

                    // Get the file's URL
                    const fileURL = await getDownloadURL(storageRef);

                    // Update the Firestore document
                    const userDocRef = query(collection(firestore, 'Users'), where('Uid', "==", uid));
                    const docSnapshot = await getDocs(userDocRef);
                    if (!docSnapshot.empty) {
                        const doc = docSnapshot.docs[0].data();
                        await doc.update({
                            imageUrl: fileURL,
                            Name: newUserName
                        });
                    }

                    // Update the local state with the new image URL
                    setImageUrl(fileURL);
                    setDataChange(false);
                }
            } catch (error) {
                console.error('Error uploading file or updating Firestore:', error);
            }
        }
    }


    useEffect(() => {
        const GetCompletedTaskList = async () => {
            const docRef = query(collection(firestore, 'Users'), where('Uid', "==", uid));
            const docSnapshot = await getDocs(docRef);
            if (!docSnapshot.empty) {
                const docData = docSnapshot.docs[0].data();
                const completedTask = docData['CompletedTasks'];
                console.log(completedTask);
                const taskNames = [];
                for (const docId of completedTask) {
                    console.log(docId);
                    const taskDocRef = doc(firestore, 'Tasks', docId);
                    const taskDocRefSnapshot = await getDoc(taskDocRef);
                    if (taskDocRefSnapshot.exists()) {
                        const task_name = taskDocRefSnapshot.data().Heading;
                        console.log(task_name);
                        taskNames.push(task_name);
                    }
                }
                console.log('task names are ', taskNames);
                setCompletedTaskList(taskNames);
            }
        }

        GetCompletedTaskList();
    }, [uid]);

    const selectedTask = async (taskName: string) => {
        // get the taskId from it's document 
        const docRef = query(collection(firestore, 'Tasks'), where('Heading', "==", taskName));
        const docSnap = await getDocs(docRef);
        if (!docSnap.empty) {
            const docTaskId = docSnap.docs[0].data()['TaskID'];
            setTaskId(docTaskId);
        }
        setCurrentComponenet('Task');

    }

    const CloseUserProfile = () => {
        setUserProfile(false);
        setDataChange(false);
        setNewUserName(userName);
    }


    useEffect(() => {
        const getProjects = async () => {
            try {

                // Query for projects where the user is a member
                const memberQuery = query(collection(firestore, 'Projects'), where('members', 'array-contains', uid));
                const memberSnap = await getDocs(memberQuery);

                // Use a Set to store project names to avoid duplicates
                const projectNamesSet: Set<string> = new Set();

                // Process member query results
                memberSnap.forEach(doc => {
                    const data = doc.data();
                    projectNamesSet.add(data.projectName);
                });

                // Convert Set to Array and update the state
                setProjectsName(Array.from(projectNamesSet));
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };

        if (uid) {
            getProjects();
        }
    }, [uid]);

    // showing data related to the project
    const selectedProject = async (project: string) => {
        // navigating to the correct output for the application 
        setProjectName(project);
        // changing the projectId as well 
        const docRef = query(collection(firestore, 'Projects'), where('projectName', "==", project));
        const docSnap = await getDocs(docRef);
        if (!docSnap.empty) {
            const docId = docSnap.docs[0].id;
            setProjectId(docId);
        }
    }

    const handleMenuButtonClick = (componentName: string) => {
        handleButtonClick(componentName);
        setOpenMobileMenu(!openMobileMenu)
    }



    return (

        <main className={`${styles.MainContainer}`} >

            {isMobile && openMobileMenu ?
                <div className={styles.sidebarColumn}>

                    <div className={styles.profileDescription}>
                        <img src={imageUrl} onClick={() => setUserProfile(true)} alt="Profile image" className={styles.sidebarProfileImage} />
                        {/* <p className={styles.projectName}>{projectName}</p> */}
                    </div>


                    <div className={styles.functionButtons}>

                        <button
                            className={`${styles.functionButton} ${clickedButton === 'Create task' ? styles.clickedButton : ''}`}
                            onClick={() => handleMenuButtonClick('Create task')}>
                            Create task
                        </button>

                        <button
                            className={`${styles.functionButton} ${clickedButton === 'Task status' ? styles.clickedButton : ''}`}
                            onClick={() => handleMenuButtonClick('Task status')}
                        >
                            Task status
                        </button>
                        <button
                            className={`${styles.functionButton} ${clickedButton === 'Members' ? styles.clickedButton : ''}`}
                            onClick={() => handleMenuButtonClick('Members')}
                        >
                            Members
                        </button>

                        {
                            isProjectMember ? '' :
                                <button
                                    className={`${styles.functionButton} ${clickedButton === 'Requests' ? styles.clickedButton : ''}`}
                                    onClick={() => handleMenuButtonClick('Requests')}
                                >
                                    Requests
                                </button>
                        }


                        <button
                            className={`${isProjectMember ? styles.SettingButtonExtra : styles.SettingButton}`}
                            onClick={OpenProfile}
                        >
                            <img src="/Settings.png" alt="Setting icon" />
                            Settings

                        </button>


                    </div>
                </div>
                : <div></div>
            }

            <div className={styles.mainBody}>

                {/* conditional rendering of the headerbox  */}

                {
                    !isMobile && openMessage ? (
                        <div className={styles.messageHeader}>
                            { /* show the profile header for the user */}
                            <div className={styles.messageHeaderStatus}>

                                <button className={styles.backButton} onClick={RemoveMessage}><img src="/Back.png" alt="Back image" /></button>

                                <div className={styles.messageHeaderMenuRow}>

                                    <div className={styles.messageHeaderData}>

                                        <div className={styles.messageUserStatus}>

                                            <img className={styles.messageImage} src={messageImageUrl} alt="message user image" />

                                            <div className={`${messageUserStatus ? styles.activeMessageUser : styles.inactiveMessageUser}`}></div>

                                        </div>

                                        <p className={styles.messageUserName}>{messageName}</p>
                                    </div>


                                    {/* menu button for the member */}
                                    <button onClick={() => setOpenMessageMenu(!openMessageMenu)} className={styles.menuButtonMessage}><img src="/MenuVertical.png" alt="Menu button" /></button>
                                </div>
                            </div>



                        </div>

                    ) :
                        // header according to the openTask if this is open or not
                        isMobile && openTask ?
                            (
                                <div className={styles.messageHeaderStatus}>
                                    <button className={styles.backButton} onClick={RemoveTask}><img src="/Back.png" alt="Back image" /></button>
                                    <div className={styles.messageHeaderData}>
                                        {/* here we would pass down the heading of the task to show  */}
                                        <p className={styles.taskHeadingText}>{taskHeading}</p>
                                        {
                                            taskAuthor == uid ?
                                                <button onClick={deleteTask} className={styles.deleteTaskButton}><img src="/Delete.png" alt="delete icon" /></button>
                                                :
                                                ''
                                        }
                                    </div>
                                </div>
                            )
                            :

                            // Normal message 
                            // styling the headbar for the task related components  
                            <div className={styles.headerBar}>
                                {/* new type of header for the application */}
                                {isMobile ?
                                    <div className={styles.mobileViewHeader}>
                                        <div onClick={() => setUserProfile(true)} className={styles.mobileHeaderData}>
                                            <img src={imageUrl} className={styles.mobileHeaderUserImage} alt="User profile photo" />
                                            <p className={styles.mobileComponentName}>{currentComponent}</p>
                                        </div>
                                        <button onClick={openMobileMenuSection} className={styles.mobileMenuButton}><img src="/Menu.png" alt="Menu icon" /></button>
                                    </div>
                                    :
                                    <div>

                                        {currentComponent == 'Task' || currentComponent == 'EditTask' && <img onClick={backMemberPage} src="/Back.png" />}
                                        {/* showing the task heading to reflect about which task we are talking about */}
                                        {currentComponent == 'EditTask' &&
                                            <div style={{ marginLeft: -900, fontSize: 18, fontFamily: 'ReadexPro', fontWeight: 200 }}>
                                                <p className={styles.editTaskHeading}>{taskHeading} </p>

                                            </div>
                                        }
                                        <button className={` ${currentComponent != 'Task' ? styles.distanceButton : styles.ShareButton}`}
                                            onClick={changeShare}
                                        >Share
                                            <img src="/Share.png" alt="share icon" />
                                        </button>
                                    </div>
                                }
                            </div>

                }


                <div style={{ padding: 10 }} className={styles.loadComponent}>
                    {
                        !isMobile && openMessage ? (
                            <div>
                                {/* showing the chat message box  */}
                                <Chat setOpenMessage={setOpenMessage} openMessage={false} messageUid={messageUid} openMessageMenu={openMessageMenu} RemoveMessage={RemoveMessage} />
                            </div>
                        ) :
                            openTask ?
                                (
                                    // component to show the task details 
                                    <div>
                                        <EditTask taskDocumentId={taskDocumentId} isMobile={isMobile} />
                                        {/* <TaskDetails taskDocumentId={taskDocumentId} setOpenTask={setOpenTask} setCurrentComponenet={setCurrentComponenet} /> */}
                                    </div>
                                )
                                :
                                <div>
                                    {/* here the component should be rendered  */}
                                    {currentComponent === 'Create task' && <CreateTask />}
                                    {currentComponent === 'Task status' && <TaskStatus setCurrentComponenet={setCurrentComponenet} setOpenTask={setOpenTask} setTaskHeading={setTaskHeading} setTaskDocumentId={setTaskDocumentId} setTaskAuthor={setTaskAuthor} />}
                                    {currentComponent === 'Members' && <Members setTaskId={setTaskId} setCurrentComponenet={setCurrentComponenet} setOpenMessage={setOpenMessage} openMessageMenu={openMessageMenu} setOpenMessageMenu={setOpenMessageMenu} openMessage={false} messageUid={messageUid} setMessageUid={setMessageUid} />}
                                    {/* this should be load conditionally */}
                                    {currentComponent === 'TaskDetails' && <TaskDetails setCurrentComponenet={setCurrentComponenet} setOpenTask={setOpenTask} taskDocumentId={taskDocumentId} />}
                                    {currentComponent === 'Requests' && <Requests />}
                                    {currentComponent === 'Task' && <Task taskId={taskId} />}
                                    {currentComponent === 'EditTask' && <EditTask taskDocumentId={taskDocumentId} isMobile={isMobile} />}
                                </div>
                    }
                </div>
            </div>

            {showShare &&
                <div className={styles.shareProject}>
                    <p className={styles.inviteHeading}>Share your project</p>
                    <div className={styles.InviteEmailSection}>
                        <input className={styles.InviteEmail} type="email" placeholder="Type email" onChange={(e) => setInviteEmailUser(e.target.value)} />
                        <button className={styles.InviteEmailButton} onClick={Invite}>Invite</button>
                    </div>
                </div>}


            {/* user profile for the setting page  */}
            {openProfile &&
                <div className={styles.showProfile} >
                    <div className={styles.profileDescriptionHeader}>

                        <div className={styles.profile}>
                            <img src={imageUrl} alt="profle image" className={styles.profileImage} />
                            <p className={styles.projectName} style={{ color: 'black' }}>{projectName} Settings</p>
                        </div>


                        <button className={styles.cancelButton} onClick={() => setOpenProfile(false)}><img src="/Cross.png" /></button>
                    </div>

                    {/* content for the profile component */}
                    <div className={styles.userFunctions}>
                        <button className={styles.showList} onClick={() => setShowTaskList(true)}>Show  Tasks</button> {/* to show the task list as a component */}
                    </div>

                    <button onClick={() => leaveProject()} className={styles.leaveProject}>Leave Project</button>
                </div>
            }



            {/* show the Task list profile */}
            {showTaskList && <TaskList setShowTaskList={setShowTaskList} setCurrentComponent={setCurrentComponenet} setTaskDocumentId={setTaskDocumentId} />}

            {successfulInvite &&
                <div className={`${successfulInvite} ? ${styles.successfullyInvited} : ' '`}>
                    <img src="/invite.png" alt="Successful invite icon" />
                    <p>Successfully invited</p>
                </div>
            }


            {/* user profile with personal data to use */}
            {userProfile &&
                <div className={styles.personalProfile}>
                    <div className={styles.personalProfileHeader}>
                        <div className={styles.personalProfileHeaderData}>
                            <img className={styles.personalProfileImage} src={imageUrl} alt="profile image" />
                            <p className={styles.personalProfileName}>{userName}</p>
                        </div>
                        <button onClick={CloseUserProfile} className={styles.personalProfileHeaderDeleteButton}><img src="/Cross.png" alt="close button icon" /></button>
                    </div>

                    {/* data related to the personal usage */}
                    <div className={styles.personalData}>
                        <div className={styles.personalDataBlock}>
                            <div className={styles.personalImageChangeData}>
                                <img style={{ width: 100, height: 100, border: 'none', borderRadius: '50%' }} src={uploadedImage != null ? uploadedImage : imageUrl} alt="personal profile imagge" />
                                <input
                                    type="file"
                                    style={{ display: 'none' }}
                                    id="personalImage"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <button onClick={changePersonalImage} className={styles.changeImageIcon}><img src="/Add.png" alt="add icon" /></button>
                            </div>
                            <input onChange={(e) => changePersonalName(e.target.value)} type="text" placeholder="Type name" value={newUserName || ''} className={styles.personalUserNameInput} />
                        </div>

                        <div className={`${isMobile ? '' : styles.personalProfileButtons}`}>
                            <div className={`${isMobile ? styles.mobileProfileButtons : ''}`}>
                            <div className={styles.personalProfileButtons}>
                                <button onClick={() => setShowProjects(true)} className={styles.personalProfileButton}>Projects</button>
                                <button onClick={() => setShowCompletedTask(true)} className={styles.personalProfileButton}>Tasks</button>
                            </div>
                            <div>
                                {dataChange && <button onClick={changePersonalData} className={styles.personalProfileButtonDataChange}>Update</button>}
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            }


            {showCompletedTask &&
                <div className={styles.completedTask}>
                    <div className={styles.completedTaskHeader}>
                        <p className={styles.taskNameDialogHeading}>Completed task</p>
                        <button onClick={() => setShowCompletedTask(false)} className={styles.closeCompletedTaskButton}><img src="/Cross.png" alt="close icon" /></button>
                    </div>
                    {/* use map to show the data from the completed task list */}
                    <div className={styles.completedTaskNames}>
                        {completedTaskList.map((task, index) => (
                            <div className={styles.taskName} onClick={() => selectedTask(task)}>
                                <p style={{ marginTop: 10 }} key={index}>{task}</p>
                            </div>
                        ))}
                    </div>
                </div>
            }



            
            {showProjects &&
                <div className={styles.completedTask}>
                    <div className={styles.completedTaskHeader}>
                        <p className={styles.taskNameDialogHeading}>Projects</p>
                        <button onClick={() => setShowProjects(false)} className={styles.closeCompletedTaskButton}><img src="/Cross.png" alt="close icon" /></button>
                    </div>
                    {/* use map to show the data from the completed task list */}
                    <div className={styles.completedTaskNames}>
                        {projects.map((project, index) => (
                            <div className={styles.taskName} onClick={() => selectedProject(project)}>
                                <p style={{ marginTop: 10 }} key={index}>{project}</p>
                            </div>
                        ))}
                    </div>
                </div>
            }


        </main>
    )
}

