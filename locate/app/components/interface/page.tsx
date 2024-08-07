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
import Success from "../Animations/Success";

export default function Interface() {

    const [showPopup, setShowPopup] = useState<boolean>(false);
    const [showPopupMessage, setShowPopupMessage] = useState<string>('');

    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 425);
    const [openMobileMenu, setOpenMobileMenu] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // console.log(new Date().toISOString());

    const openMobileMenuSection = () => {
        console.log(isMobile, openMobileMenu);
        setOpenMobileMenu(!openMobileMenu);
    }



    const router = useRouter();

    const [inviteEmailUser, setInviteEmailUser] = useState<string>('');
    const { projectId, projectName, setProjectId, setProjectName } = useGlobalProjectIdContext();
    const { uid, setImageUrl, imageUrl, userName, email, setIsProjectMember, isProjectMember, setUid, setEmail, setUserName } = useGlobalUidContext();

    useEffect(() => {
        // Retrieve user data from localStorage if it exists
        if (typeof window !== 'undefined') {
            const storedUid = localStorage.getItem('UserUid');
            const storedEmail = localStorage.getItem('UserEmail');
            const storedImageUrl = localStorage.getItem('UserImageUrl');
            const storedUserName = localStorage.getItem('UserName');
            const storedIsProjectMember = localStorage.getItem('IsProjectMember') || '';
            console.log(typeof storedIsProjectMember, storedIsProjectMember);
            if (storedUid) {
                setUid(storedUid);
                setEmail(storedEmail || '');
                setImageUrl(storedImageUrl || '');
                setUserName(storedUserName || '');
                setIsProjectMember(JSON.parse(storedIsProjectMember));
            }


            // get the project related data as well from the localStorage
        }
    }, []);

    const [currentComponent, setCurrentComponenet] = useState<string>('Create task');
    const [openProfile, setOpenProfile] = useState<boolean>(false);
    const [showShare, setshowShare] = useState<boolean>(false);
    const [shareStatus, setShareStatus] = useState('');
    const [taskId, setTaskId] = useState<string>('');


    const [openMessage, setOpenMessage] = useState<boolean>(false);
    const [messageUid, setMessageUid] = useState('');
    const [messageImageUrl, setMessagUserImageUrl] = useState<string>('');
    const [messageName, setMessageUserName] = useState<string>('');
    const [messageUserStatus, setMessageUserStatus] = useState<boolean>(false);




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
            'creatorEmail': email,
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

        setShowPopupMessage('Task deleted successfully');
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false)
            setShowPopupMessage('');
        }, 1000);


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
                // console.log('created by', createdBy);
                // console.log('uid is', uid);
                if (createdBy != uid) {
                    setIsProjectMember(true);
                    // console.log('is project member value ', isProjectMember);
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
        if (isMobile) {
            setOpenProfile(false);
        }
        setshowShare(!showShare);
        setShareStatus('');
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

                if (typeof window !== 'undefined') {
                    // clear the project data on the local storage 
                    localStorage.setItem('ProjectName', '');
                    localStorage.setItem('ProjectId', '');
                    localStorage.setItem('ProjectCreator', '');
                }
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

        setShowPopupMessage('Task deleted successfully');
        setShowPopup(true);
        setTimeout(() => {
            setShowPopup(false)
            setShowPopupMessage('');
        }, 1000);

        setTimeout(() => {
            // reroute back to the same page
            router.push('/components/landing');
        }, 2000);


    };





    const [clickedButton, setClickedButton] = useState<string>('Create task');

    // Function to handle button click
    const handleButtonClick = (buttonName: string) => {
        setCurrentComponenet(buttonName);
        // Update the state to track the clicked button
        setClickedButton(buttonName);
    };


    const sendInvite = async () => {
        // store the data on the supabase database 
        const response_id = await axios.post('https://supabaseAdd.glitch.me/createRequest', {
            'From': email,
            'To': inviteEmailUser

        });

        console.log(response_id.data.requestId);

        if (response_id.status == 200) {
            if (response_id.data.requestStatus == 'Accpted') {
                console.log('member already accepted');
            }
            if (response_id.data.requestStatus == 'Rejected') {
                console.log('alredy rejected');
            }
            else {
                const unique_url = `https://locatetest.netlify.app/components/invited/${email}/${response_id.data.requestId}/${projectId}`;
                // inviteViaEmail(unique_url);

                const response = await axios.post('https://fern-ivory-lint.glitch.me/sendInvite', {
                    'inviteFrom': email,
                    'inviteTo': inviteEmailUser,
                    'projectName': projectName,
                    'UniqueUrl': unique_url
                });

                console.log(response);


            }

            // invite sent successfully
            setshowShare(!showShare);
            setShareStatus('');



        }

        else {
            console.log('not been able to add the request in the supabase database');
        }
    }

    // function to invite the gamil user
    const Invite = async () => {
        let invite_uid = '';
        // get the uid of the inviting email if exist then check the subconditon
        const user_invite_ref = query(collection(firestore, 'Users'), where('Email', "==", inviteEmailUser));
        const user_invite_snapshot = await getDocs(user_invite_ref);
        if (!user_invite_snapshot.empty) {
            invite_uid = user_invite_snapshot.docs[0].data()['Uid'];
        }

        console.log(invite_uid);

        if (invite_uid == '') {
            // check for being already a member of the project 
            const projectDocRef = query(collection(firestore, 'Projects'), where('members', "==", invite_uid));
            const projectDocRefSnapshot = await getDocs(projectDocRef);
            if (projectDocRefSnapshot.empty) {
                await sendInvite();
            }
            else {
                // notify he is already in the group 
                setShareStatus('Member already existed');
            }
        }
        else {





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

        if (openTask) {
            setOpenTask(false);
            setTaskHeading('');
        }
    }

    // personal profile data
    const [userProfile, setUserProfile] = useState(false);
    const [dataChange, setDataChange] = useState<boolean>(false);
    const [newUserName, setNewUserName] = useState(userName);
    const [uploadedImage, setUploadedImage] = useState<null | string>(null);
    const [showCompletedTask, setShowCompletedTask] = useState<boolean>(false);
    const [showProjects, setShowProjects] = useState<boolean>(false);

    const openJoinDialog = () => {
        setOpenJoinProject(true);
        setShowProjects(false);
    }
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

                    setShowPopupMessage('User data changed successfully');
                    setShowPopup(true);
                    setTimeout(() => {
                        setShowPopup(false)
                        setShowPopupMessage('');
                    }, 1000);
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


    // useEffect(() => {
    //     const memberQuery = query(collection(firestore, 'Users'), where('Uid', '==', uid));

    //     const unsubscribe = onSnapshot(memberQuery, (querySnapshot) => {
    //       if (!querySnapshot.empty) {
    //         const memberSnap = querySnapshot.docs[0];
    //         const all_projects = memberSnap.data()['Projects'];
    //         const filter_projects = all_projects.filter(project => project !== projectName);

    //         console.log(filter_projects);
    //         setProjectsName(filter_projects);
    //       }
    //     });

    //     // Clean up the listener when the component unmounts
    //     return () => unsubscribe();
    //   }, [uid, projectName, setProjectsName]);


    useEffect(() => {

        const memberQuery = query(collection(firestore, 'Users'), where('Uid', '==', uid));
        const unsubscribe = onSnapshot(memberQuery, (querySnapshot) => {
            try {



                if (!querySnapshot.empty) {
                    const memberSnap = querySnapshot.docs[0];
                    const all_projects = memberSnap.data()['Projects'];
                    const filter_projects = [];
                    for (const project of all_projects) {
                        if (project != projectName) {
                            filter_projects.push(project);
                        }
                    }

                    console.log(filter_projects);
                    setProjectsName(filter_projects);
                }


            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        });


        unsubscribe();

    }, [uid]);

    // showing data related to the project
    const selectedProject = async (project: string) => {
        if (typeof window !== 'undefined') {
            // navigating to the correct output for the application 
            setProjectName(project);
            localStorage.setItem('ProjectName', project);
            // changing the projectId as well 
            const docRef = query(collection(firestore, 'Projects'), where('projectName', "==", project));
            const docSnap = await getDocs(docRef);
            if (!docSnap.empty) {
                const docId = docSnap.docs[0].id;
                setProjectId(docId);
                localStorage.setItem('ProjectId', docId);
            }
        }
    }

    const handleMenuButtonClick = (componentName: string) => {
        handleButtonClick(componentName);
        setOpenMobileMenu(!openMobileMenu)
    }

    const logout = () => {
        localStorage.clear();
        router.push('/');
    }


    const OpenShowTasks = () => {
        setOpenProfile(false);
        setShowTaskList(true);
    }

    const [openJoinProject, setOpenJoinProject] = useState(false);
    const [joinProject, setJoinProject] = useState<string>('');


    const addProjectNameInMap = async () => {
        try {
            // addingg the project name with false value in the map of the user document
            const q = query(collection(firestore, 'Users'), where('Uid', '==', uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const documentId = querySnapshot.docs[0].id;
                const documentData = querySnapshot.docs[0].data();

                // Check if Requests map exists in the document data
                const requestsMap = documentData.Requests || {};

                // Check if the project name already exists in the requests map
                if (!(joinProject in requestsMap)) {
                    // Add the project name to the requests map with a false value
                    requestsMap[joinProject] = false;

                    // Update the user document with the modified requests map
                    await updateDoc(doc(firestore, 'Users', documentId), { Requests: requestsMap });

                    console.log('Project name added to the requests map successfully.');
                } else {
                    console.log('Project name already exists in the requests map.');
                }

            }
            else {
                console.log('user does not exist for updating his requests hash map');
            }
        }
        catch (error) {
            console.log(error);
        }
    }


    // function for the join project, send request
    const Join = async () => {
        console.log('project name for join is', joinProject);
        // add thje user uid in the requests list of the project by using the name 
        try {
            const q = query(collection(firestore, 'Projects'), where('projectName', '==', joinProject));
            const querySnapshot = await getDocs(q);
            // Check if any documents were found
            if (!querySnapshot.empty) {
                // Extract the document ID from the first document found
                const documentId = querySnapshot.docs[0].id;
                const documentData = querySnapshot.docs[0].data();

                // Get the current requests array
                let requests = documentData.requests || [];

                // Check if the UID already exists in the requests array
                if (!requests.includes(uid)) {
                    // Push the new UID into the requests array
                    requests.push(uid);
                    console.log('UID added to requests successfully.');
                    setShowPopupMessage('Request added successfully');
                    setShowPopup(true);
                    setTimeout(() => {
                        setShowPopup(false)
                        setShowPopupMessage('');
                    }, 1000);

                } else {
                    console.log('UID already exists in the requests array.');
                    setShowPopupMessage('Request already exist');
                    setShowPopup(true);
                    setTimeout(() => {
                        setShowPopup(false)
                        setShowPopupMessage('');
                    }, 1000);
                }

                // add the project name with the false value in the user Requests map if not already exist
                await addProjectNameInMap();


                // Update the Firestore document with the modified data
                await updateDoc(doc(firestore, 'Projects', documentId), {
                    requests: requests
                });
            } else {
                console.log('no project with this name exist');
                // show a dialog to the user about that no project with that name exist
            }
        }
        catch (error) {
            console.log('we have faced an error', error);
        }


        // close the dialogs for the join project
        setOpenJoinProject(false);
        setJoinProject('');
    }



    return (

        <main className={`${styles.MainContainer}`} >

            {
                isMobile ?
                    openMobileMenu ?
                        <div className={styles.sidebarColumn}>

                            <div className={styles.profileDescription}>
                                <img src={imageUrl} onClick={() => setUserProfile(true)} alt="Profile image" className={styles.sidebarProfileImage} />
                                {/* <p className={styles.projectName}>{projectName}</p> */}
                            </div>


                            <div className={styles.functionButtons}>

                                {/* <button
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

                                </button> */}

                                <button
                                    className={`${styles.functionButton} ${clickedButton === 'Create task' ? styles.clickedButton : ''}`}
                                    onClick={() => handleMenuButtonClick('Create task')}>
                                    {
                                        clickedButton == 'Create task' ?
                                            <Image src="../CreateTask.svg" alt="create task icon" width={25} height={25} /> :
                                            <Image src="../UnCreate.svg" alt="create task icon" width={25} height={25} />
                                    }
                                    Create task
                                </button>

                                <button
                                    className={`${styles.functionButton} ${clickedButton === 'Task status' ? styles.clickedButton : ''}`}
                                    onClick={() => handleMenuButtonClick('Task status')}
                                >
                                    {/* adding an image icon on this  */}
                                    {
                                        clickedButton == 'Task status' ?
                                            <Image src="../TaskStatus.svg" alt="task status icon" width={25} height={25} /> :
                                            <Image src="../UnTaskStatus.svg" alt="task status icon" width={25} height={25} />
                                    }
                                    Task status
                                </button>
                                <button
                                    className={`${styles.functionButton} ${clickedButton === 'Members' ? styles.clickedButton : ''}`}
                                    onClick={() => handleMenuButtonClick('Members')}
                                >
                                    {
                                        clickedButton == 'Members' ?
                                            <Image src="../Members.svg" alt="members icon" width={25} height={25} /> :
                                            <Image src="../UnMembers.svg" alt="members icon" width={25} height={25} />
                                    }
                                    Members
                                </button>

                                {
                                    isProjectMember ? '' :
                                        <button
                                            className={`${styles.functionButton} ${clickedButton === 'Requests' ? styles.clickedButton : ''}`}
                                            onClick={() => handleMenuButtonClick('Requests')}
                                        >
                                            {
                                                clickedButton == 'Requests' ?
                                                    <Image src="../Requests.svg" alt="Task status icon" width={25} height={25} /> :
                                                    <Image src="../UnRequests.svg" alt="Task status icon" width={25} height={25} />
                                            }
                                            Requests
                                        </button>
                                }


                                <button
                                    className={`${isProjectMember ? styles.SettingButtonExtra : styles.SettingButton}`}
                                    onClick={OpenProfile}
                                >
                                    <Image src="../Settings.svg" width={25} height={25} alt="Setting icon" />
                                    Settings

                                </button>



                            </div>
                        </div>
                        :
                        <div>

                        </div>
                    :

                    <div className={styles.sidebarColumn}>

                        <div className={styles.profileDescription}>
                            <img src={imageUrl} onClick={() => setUserProfile(true)} style={{ borderRadius: 50 }} alt="Profile image" className={styles.sidebarProfileImage} />
                            {/* <p className={styles.projectName}>{projectName}</p> */}
                        </div>


                        <div className={styles.functionButtons}>

                            <button
                                className={`${styles.functionButton} ${clickedButton === 'Create task' ? styles.clickedButton : ''}`}
                                onClick={() => handleMenuButtonClick('Create task')}>
                                {
                                    clickedButton == 'Create task' ?
                                        <Image src="../CreateTask.svg" alt="create task icon" width={25} height={25} /> :
                                        <Image src="../UnCreate.svg" alt="create task icon" width={25} height={25} />
                                }
                                Create task
                            </button>

                            <button
                                className={`${styles.functionButton} ${clickedButton === 'Task status' ? styles.clickedButton : ''}`}
                                onClick={() => handleMenuButtonClick('Task status')}
                            >
                                {/* adding an image icon on this  */}
                                {
                                    clickedButton == 'Task status' ?
                                        <Image src="../TaskStatus.svg" alt="task status icon" width={25} height={25} /> :
                                        <Image src="../UnTaskStatus.svg" alt="task status icon" width={25} height={25} />
                                }
                                Task status
                            </button>
                            <button
                                className={`${styles.functionButton} ${clickedButton === 'Members' ? styles.clickedButton : ''}`}
                                onClick={() => handleMenuButtonClick('Members')}
                            >
                                {
                                    clickedButton == 'Members' ?
                                        <Image src="../Members.svg" alt="members icon" width={25} height={25} /> :
                                        <Image src="../UnMembers.svg" alt="members icon" width={25} height={25} />
                                }
                                Members
                            </button>

                            {
                                isProjectMember ? '' :
                                    <button
                                        className={`${styles.functionButton} ${clickedButton === 'Requests' ? styles.clickedButton : ''}`}
                                        onClick={() => handleMenuButtonClick('Requests')}
                                    >
                                        {
                                            clickedButton == 'Requests' ?
                                                <Image src="../Requests.svg" alt="Task status icon" width={25} height={25} /> :
                                                <Image src="../UnRequests.svg" alt="Task status icon" width={25} height={25} />
                                        }
                                        Requests
                                    </button>
                            }


                            <button
                                className={`${isProjectMember ? styles.SettingButtonExtra : styles.SettingButton}`}
                                onClick={OpenProfile}
                            >
                                <Image className={styles.settingButtonIcon} src="../Settings.svg" width={25} height={25} alt="Setting icon" />
                                Settings

                            </button>


                        </div>
                    </div>
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
                                    <div className={styles.headbarData}>

                                        {currentComponent == 'Task' || currentComponent == 'EditTask' && <button className={styles.headbarBackButton} onClick={backMemberPage}><img src="/Back.png" /></button>}

                                        {taskHeading && <p className={styles.editTaskHeading}>{taskHeading} </p>}
                                        {/* showing the task heading to reflect about which task we are talking about */}
                                        {/* {currentComponent == 'EditTask' &&
                                            <div style={{ marginLeft: -900, fontSize: 18, fontFamily: 'ReadexPro', fontWeight: 200 }}>
                                                

                                            </div>
                                        } */}
                                        <button className={` ${currentComponent == 'EditTask' ? styles.distanceButton : styles.ShareButton}`}
                                            onClick={changeShare}
                                        >Share
                                            <Image src="../Share.svg" alt="share icon" width={25} height={25} />
                                        </button>
                                    </div>
                                }
                            </div>

                }


                <div className={styles.loadComponent}>
                    {
                        !isMobile && openMessage ? (
                            <div>
                                {/* showing the chat message box  */}
                                <Chat setOpenMessage={setOpenMessage} openMessage={openMessage} messageUid={messageUid} openMessageMenu={openMessageMenu} RemoveMessage={RemoveMessage} />
                            </div>
                        ) :
                            openTask ?
                                (
                                    // component to show the task details 
                                    <div>
                                        <EditTask taskDocumentId={taskDocumentId} isMobile={isMobile} deleteTask={deleteTask} />
                                        {/* <TaskDetails taskDocumentId={taskDocumentId} setOpenTask={setOpenTask} setCurrentComponenet={setCurrentComponenet} /> */}
                                    </div>
                                )
                                :
                                <div>
                                    {/* here the component should be rendered  */}
                                    {currentComponent === 'Create task' && <CreateTask setCurrentComponenet={setCurrentComponenet} />}
                                    {currentComponent === 'Task status' && <TaskStatus setCurrentComponenet={setCurrentComponenet} setOpenTask={setOpenTask} setTaskHeading={setTaskHeading} setTaskDocumentId={setTaskDocumentId} setTaskAuthor={setTaskAuthor} />}
                                    {currentComponent === 'Members' && <Members RemoveMessage={RemoveMessage} setTaskId={setTaskId} openMessage={openMessage} setCurrentComponenet={setCurrentComponenet} setOpenMessage={setOpenMessage} openMessageMenu={openMessageMenu} setOpenMessageMenu={setOpenMessageMenu} messageUid={messageUid} setMessageUid={setMessageUid} />}
                                    {/* this should be load conditionally */}
                                    {currentComponent === 'TaskDetails' && <TaskDetails setCurrentComponenet={setCurrentComponenet} setOpenTask={setOpenTask} taskDocumentId={taskDocumentId} isMobile={isMobile} />}
                                    {currentComponent === 'Requests' && <Requests />}
                                    {currentComponent === 'Task' && <Task taskId={taskId} />}
                                    {currentComponent === 'EditTask' && <EditTask taskDocumentId={taskDocumentId} deleteTask={deleteTask} isMobile={isMobile} />}
                                </div>
                    }
                </div>
            </div>

            {showShare &&
                <div className={styles.shareProject}>
                    <p className={styles.inviteHeading}>Share your project</p>
                    {shareStatus && <p>{shareStatus}</p>}
                    <div className={styles.InviteEmailSection}>
                        <input className={styles.InviteEmail} type="email" placeholder="Type email" onChange={(e) => setInviteEmailUser(e.target.value)} />
                        <div className={`${isMobile ? styles.shareDivButtona : ''}`}>
                            <button className={styles.InviteEmailButton} onClick={Invite}>Invite</button>
                            {isMobile && <button className={styles.closeShareButton} onClick={() => setshowShare(false)}>Close</button>}
                        </div>
                    </div>
                </div>
            }


            {/* join project */}
            {openJoinProject &&
                <div className={styles.shareProject}>
                    <p className={styles.inviteHeading}>Join project</p>
                    {shareStatus && <p>{shareStatus}</p>}
                    <div className={styles.InviteEmailSection}>
                        <input className={styles.InviteEmail} type="text" placeholder="Type project name" onChange={(e) => setJoinProject(e.target.value)} value={joinProject} />
                        <div className={styles.shareDivButtona}>
                            <button className={styles.InviteEmailButton} onClick={Join}>Join</button>
                            <button className={styles.closeShareButton} onClick={() => setOpenJoinProject(false)}>Close</button>
                        </div>
                    </div>
                </div>
            }


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
                        <button className={styles.showList} onClick={OpenShowTasks}>Show  Tasks</button> {/* to show the task list as a component */}
                        {
                            isMobile &&

                            <button className={styles.shareButtonForMobile} onClick={changeShare}>Share</button>

                        }
                        <button onClick={logout} className={styles.logOutButton}>Log out</button>

                    </div>


                    <button onClick={() => leaveProject()} className={styles.leaveProject}>Leave Project</button>
                </div>
            }



            {/* show the Task list profile */}
            {showTaskList && <TaskList setShowTaskList={setShowTaskList} setCurrentComponent={setCurrentComponenet} setTaskDocumentId={setTaskDocumentId} />}




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
                <div className={styles.userProjects}>
                    <div className={styles.userProjectsHeader}>
                        <p className={styles.userProjectsDialogHeading}>Projects</p>
                        <button onClick={() => setShowProjects(false)} className={styles.closeCompletedUserProjectsButton}><img src="/Cross.png" alt="close icon" /></button>
                    </div>

                    {/* use map to show the data from the completed task list */}
                    <div className={styles.userProjectsName}>
                        {projects.map((project, index) => (
                            <div className={styles.userProjectsNames} onClick={() => selectedProject(project)}>
                                <p style={{ marginTop: 10 }} key={index}>{project}</p>
                            </div>
                        ))}
                    </div>
                    <button onClick={openJoinDialog} className={styles.joinProjectButton}>Join Project</button>
                </div>
            }

            {
                showPopup &&
                <Success successMessage={showPopupMessage} />
            }


        </main>
    )
}

