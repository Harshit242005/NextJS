
'use client';
// get the uid from the context and check for the Projects array and if their exist one or not 
import { useGlobalUidContext } from "@/app/context/uid"
import { useGlobalProjectIdContext } from "@/app/context/projectId";
import { collection, getDocs, getFirestore, where, addDoc, doc, query, arrayUnion, updateDoc, onSnapshot, getDoc, } from "firebase/firestore";
import { useEffect, useState } from "react";
import styles from './landing.module.css';
import { firestore } from "@/app/firebase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
export default function landing() {

    interface RequestsMap {
        [key: string]: boolean;
    }


    const router = useRouter();
    const [showProjectOptions, setShowProjectOptions] = useState<boolean>(false);
    const [joinProjectName, setJoinProject] = useState('');
    const [showNewProject, setShowCreateNewProject] = useState<boolean>(false);
    const { uid, imageUrl, userName, setEmail, setImageUrl, setUserName, setUid } = useGlobalUidContext();
    const { projectId, projectName, setProjectId, setProjectName, setProjectCreator } = useGlobalProjectIdContext();


    const [projects, setProjects] = useState([]);
    const [userPreference, SetUserPreference] = useState('Create')
    const [projectNameCreate, setProjectNameCreate] = useState<string>('');
    const [requestsMap, setRequestsMap] = useState<RequestsMap>({});
    const [showRequest, setShowRequest] = useState<boolean>(false);

    const [successfulJoinRequest, setSuccessfulJoinRequest] = useState<boolean>(false);

    useEffect(() => {
        // Retrieve user data from localStorage if it exists
        if (typeof window !== 'undefined') {
            const storedUid = localStorage.getItem('UserUid');
            const storedEmail = localStorage.getItem('UserEmail');
            const storedImageUrl = localStorage.getItem('UserImageUrl');
            const storedUserName = localStorage.getItem('UserName');

            if (storedUid) {
                setUid(storedUid);
                setEmail(storedEmail || '');
                setImageUrl(storedImageUrl || '');
                setUserName(storedUserName || '');
            }
        }
    }, []);

    useEffect(() => {
        const collectionRef = query(collection(firestore, 'Users'), where('Uid', "==", uid ));

        // Set up a real-time listener
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            console.log('Executing the query');
            if (!querySnapshot.empty) {
                const documentData = querySnapshot.docs[0].data();

                console.log(documentData['Projects']);
                if (documentData.Projects.length > 0) {
                    setProjects(documentData.Projects);
                }
                console.log(projects);

            } else {
                console.log('No matching documents.');
            }
        }, (error) => {
            console.error('Error fetching documents: ', error);
        });

        return () => unsubscribe();

    }, [uid ]);

    // show the requests 
    const showOldRequests = async () => {
        setShowRequest(true);
        // get the requests map with the project name and boolean value 
        // addingg the project name with false value in the map of the user document
        const q = query(collection(firestore, 'Users'), where('Uid', '==', uid ));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const documentId = querySnapshot.docs[0].id;
            const documentData = querySnapshot.docs[0].data();

            // Check if Requests map exists in the document data
            const requestsMap = documentData.Requests || {};
            console.log(requestsMap);
            setRequestsMap(requestsMap);

        }
        else {
            console.log('user does not exist for updating his requests hash map');
        }
    }

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
                if (!(projectNameCreate in requestsMap)) {
                    // Add the project name to the requests map with a false value
                    requestsMap[joinProjectName] = false;

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


    const joinProject = async () => {
        console.log('project name for join is', joinProjectName);
        // add thje user uid in the requests list of the project by using the name 
        try {
            const q = query(collection(firestore, 'Projects'), where('projectName', '==', joinProjectName));
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

                    // set the sucessful request sent for the joining of the group
                    setSuccessfulJoinRequest(true);

                    // After 2 seconds, reset successfulInviteUser to false
                    setTimeout(() => {
                        setSuccessfulJoinRequest(false);
                    }, 2000);


                } else {
                    console.log('UID already exists in the requests array.');
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


    }


    // remove the memberId 
    function removeFromArray(array: [], element: string | null) {
        return array.filter(item => item !== element);
    }

    const DeleteRequest = async (projectName: string) => {
        try {
            // delete the request and remove from the requests from my map as well as project
            const q = query(collection(firestore, 'Projects'), where('projectName', "==", projectName))
            const documents = await getDocs(q);
            if (!documents.empty) {
                // get the first document 
                const documentId = documents.docs[0].id;
                const data = documents.docs[0].data();
                const docRef = doc(firestore, 'Projects', documentId)
                const requestsList = data.requests;
                if (requestsList.includes(uid )) {
                    // Remove MemberId from requests list
                    // const updatedRequestsList = arrayRemove(requestsList, MemberId);
                    const updatedRequestsList = removeFromArray(requestsList, uid );
                    console.log('Updated list after removing the id', updatedRequestsList);

                    // Update the document with the modified requests list
                    await updateDoc(docRef, { requests: updatedRequestsList });


                } else {
                    console.log(`Member ID ${uid} not found in requests list.`);
                }
            }
        }
        catch (error) {
            console.log('not been able to remove the uid from the project document', error);
        }

        // second step 
        // remove from the map as well 
        try {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", uid ))
            const documents = await getDocs(q)
            if (!documents.empty) {
                const documentId = documents.docs[0].id;
                const documentData = documents.docs[0].data(); // requests map
                const requestsMap = documentData.Requests || {}; // Get the Requests map
                if (requestsMap.hasOwnProperty(projectName)) {
                    // Remove the projectName from the Requests map
                    delete requestsMap[projectName];

                    // Update the document with the modified Requests map
                    await updateDoc(doc(collection(firestore, 'Users'), documentId), { Requests: requestsMap });


                } else {
                    console.log(`Project ${projectName} not found in user's requests.`);
                }
            }

        }
        catch (error) {
            console.log('not been able to remove the projectName from the users map', error)
        }

        // hide the request panel
        setShowRequest(false);
    }

    // creating new project
    const createProject = async () => {
        if (projectNameCreate.length != 0) {
            const documentData = {
                'projectName': projectNameCreate,
                'createdBy': uid ,
                'requests': [],
                'TasksIds': [],
                'members': [],
                
            }



            // add the 
            const collectionRef = collection(firestore, 'Projects');
            // Add the document to the collection
            const docRef = await addDoc(collectionRef, documentData);
            const document_id = docRef.id;



            // setting up the global context id 
            setProjectId(document_id);
            // setting the project name for the global context
            setProjectName(projectName);

            localStorage.setItem('ProjectId', document_id);
            localStorage.setItem('ProjectName', projectName);
            localStorage.setItem('ProjectCreator', localStorage.getItem('UserId') || '');

            // update the user profile to to add the project name in the user document
            const userRef = collection(firestore, 'Users');
            const querySnapshot = query(userRef, where('Uid', '==', uid ));
            const userDocs = await getDocs(querySnapshot);
            if (!userDocs.empty) {
                const userDocument = userDocs.docs[0];
                const doc_refre = doc(firestore, 'Users', userDocs.docs[0].id);
                userDocument.data().Projects
                const updatedProjects = arrayUnion(projectNameCreate);
                await updateDoc(doc_refre, { Projects: updatedProjects });
            }

            setShowCreateNewProject(false);
            // after creating the project navigate the interface pgae 
            router.push(`/components/interface`);

        }
    }

    const getDocumentId = async (projectName: string) => {
        const collection_ref = collection(firestore, 'Projects');
        const querySnapshot = query(collection_ref, where('projectName', '==', projectName));

        const userDocs = await getDocs(querySnapshot);
        const userDocumentId = userDocs.docs[0].id;
        return userDocumentId;
    }

    const navigateProject = async (projectName: string) => {

        setProjectName(projectName);
        localStorage.setItem('ProjectName', projectName);
        // get the project id from the project name and then set up the context value and then navigate to it 
        // defining the project id for the name 
        const projectDocumentId = await getDocumentId(projectName);
        setProjectId(projectDocumentId);
        localStorage.setItem('ProjectId', projectDocumentId);

        // get the creatorid from the document of the project
        const projectDocRef = doc(firestore, 'Projects', projectDocumentId);
        const docSnapshot = await getDoc(projectDocRef);
        if (docSnapshot.exists()) {
            const creator = docSnapshot.data().createdBy;
            setProjectCreator(creator)
            localStorage.setItem('ProjectCreator', creator);
        }

        // navigating the landing pagr
        router.push(`/components/interface`);
    }

    const handlePreferenceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        SetUserPreference(event.target.value);
    };

    return (

        <main >
            <div className={styles.UserData}>
                <img className={styles.userImage} src={imageUrl} alt="User Image" />
                <p className={styles.appName}>ProjeKt</p>
            </div>
            <div className={styles.RowPage}>
                <Image className={styles.backImage} src="../../LandingPageBackImage.svg" height={500} width={500} alt="Background images" />
                <div className={styles.body}>



                    {
                        projects && projects.length > 0 ?
                            <div className={styles.projectsData}>

                                <button onClick={() => setShowProjectOptions(true)} className={styles.projectExistButton}>Projects</button>

                                <button onClick={() => setShowCreateNewProject(true)} className={styles.projectExistButton}>Create new project</button>
                            </div>
                            :
                            <div>
                                <div className={styles.topSection}>
                                    <img src={imageUrl } alt="Profile image" className={styles.profileImage} />
                                    <p className={styles.userPreferenceText}>{userPreference}</p>


                                    <select
                                        id="userPreference"
                                        className={styles.userPreferenceDropdown}
                                        value={userPreference}
                                        onChange={handlePreferenceChange}
                                    >
                                        <option value="Create">Create one</option>
                                        <option value="Join">Join one</option>
                                    </select>
                                </div>

                                {/* this section should be changeable according to the user pref */}
                                {
                                    userPreference === 'Create' ?
                                        <div >


                                            <input type="text" className={styles.projectName} placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />

                                            <button onClick={createProject} className={styles.createButton}>Create</button>
                                        </div> :


                                        <div >


                                            <div>
                                                <div className={styles.createProject}>

                                                    <input type="text" className={styles.projectName} placeholder="Type name of project..." onChange={(e) => setJoinProject(e.target.value)} />
                                                </div>
                                                <div className={styles.joinProjectButtons}>
                                                    <button onClick={joinProject} className={styles.createButton}>Join</button>
                                                    <button onClick={showOldRequests} className={styles.requestButton}>Requests</button>
                                                </div>
                                            </div>


                                        </div>

                                }
                            </div>

                    }
                </div>
            </div>


            {/* show the user it's requests data */}
            {showRequest &&
                <div className={styles.showRequestsDialog}>
                    <div className={styles.showRequestHeader}>
                        <p className={styles.showRequestHeaderHeading}>Project requests</p>
                        <button className={styles.cancelButton} onClick={() => setShowRequest(false)}><img src="/Cross.png" /></button>
                    </div>
                    <div className={styles.requestsData}>
                        {/* show the map data */}
                        {Object.entries(requestsMap).map(([projectName, value]) => (
                            <div
                                key={projectName}
                                className={`${styles.requestDataRow} ${value ? styles.Accepted : styles.Waiting}`}
                            >
                                <p className={styles.requestDataRowName}>{projectName} </p>
                                <div key={projectName} style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'baseline', justifyContent: 'center' }}>
                                    <button onClick={() => DeleteRequest(projectName)} className={styles.deleteButton}><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }

            {showProjectOptions &&
                <div className={styles.projectsOptionsPopup}>
                    <div className={styles.projectsOptionsPopupHeader}>

                        <p className={styles.projectsOptionsPopupHeading}>Projects</p>
                        <button onClick={() => setShowProjectOptions(false)} className={styles.projectsOptionsPopupCloseButton}><img src="/Cross.png" alt="close icon" /></button>

                    </div>

                    {/* <p>{projects}</p> */}

                    <div className={styles.projectsOptionsPopupData}>
                        {
                            projects.map((element, index) => (
                                <div onClick={() => navigateProject(element)} className={styles.projectsPopupName} key={index}>
                                    {element}
                                </div>
                            ))
                        }
                    </div>

                </div>
            }



            {/* for creating new project */}
            {showNewProject &&
                <div className={styles.NewProjectPopup}>

                    <div className={styles.NewProjectPopupHeader}>

                        <p className={styles.popupHeaderHeading}>Create Project</p>
                        <button onClick={() => setShowCreateNewProject(false)} className={styles.NewProjectPopupCloseButton}><img src="/Cross.png" alt="close icon" /></button>

                    </div>

                    <input type="text" className={styles.NewProjectInput} placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />
                    <button onClick={createProject} className={styles.NewProjectCreateButton}>Create</button>



                </div>
            }


            {/* {
            successfulJoinRequest &&
                <div className={`${successfulJoinRequest} ? ${styles.successfullyInvited} : ' '`}>
                    <img src="/invite.png" alt="Successful invite icon" />
                    <p>Successfully invited</p>
                </div>
            } */}
        </main>
    )
}