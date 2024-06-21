
'use client';
// get the uid from the context and check for the Projects array and if their exist one or not 
import { useGlobalUidContext } from "@/app/context/uid"
import { useGlobalProjectIdContext } from "@/app/context/projectId";
import { collection, getDocs, getFirestore, where, addDoc, doc, query, arrayUnion, updateDoc, onSnapshot, } from "firebase/firestore";
import { useEffect, useState } from "react";
import styles from './landing.module.css';
import { firestore } from "@/app/firebase";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export default function landing() {

    interface RequestsMap {
        [key: string]: boolean;
    }


    const router = useRouter();
    const [joinProjectName, setJoinProject] = useState('');
    const [showNewProject, setShowCreateNewProject] = useState<boolean>(false);
    const { uid, imageUrl, userName } = useGlobalUidContext();
    const { projectId, projectName, setProjectId, setProjectName } = useGlobalProjectIdContext();
    console.log('uid value is', uid);
    console.log('image url is', imageUrl);

    const [projects, setProjects] = useState([]);
    const [userPreference, SetUserPreference] = useState('Create')
    const [projectNameCreate, setProjectNameCreate] = useState<string>('');
    const [requestsMap, setRequestsMap] = useState<RequestsMap>({});
    const [showRequest, setShowRequest] = useState<boolean>(false);

   

    const [successfulJoinRequest, setSuccessfulJoinRequest] = useState<boolean>(false);

    useEffect(() => {
        const collectionRef = query(collection(firestore, 'Users'), where('Uid', "==", uid));

        // Set up a real-time listener
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            console.log('Executing the query');
            if (!querySnapshot.empty) {
                const documentData = querySnapshot.docs[0].data();
                // Check if the 'Uid' field in the document matches the provided UID
                if (documentData.Uid === uid) {
                    if (documentData.Projects.length > 0) {
                        setProjects(documentData.Projects);
                    }
                    console.log(projects);
                  
                }
            } else {
                console.log('No matching documents.');
            }
        }, (error) => {
            console.error('Error fetching documents: ', error);
        });

        // Clean up the listener when the component unmounts or uid changes
        return () => unsubscribe();

    }, [uid]);

    // show the requests 
    const showOldRequests = async () => {
        setShowRequest(true);
        // get the requests map with the project name and boolean value 
        // addingg the project name with false value in the map of the user document
        const q = query(collection(firestore, 'Users'), where('Uid', '==', uid));
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
                if (requestsList.includes(uid)) {
                    // Remove MemberId from requests list
                    // const updatedRequestsList = arrayRemove(requestsList, MemberId);
                    const updatedRequestsList = removeFromArray(requestsList, uid);
                    console.log('Updated list after removing the id', updatedRequestsList);

                    // Update the document with the modified requests list
                    await updateDoc(docRef, { requests: updatedRequestsList });

                    console.log(`Member ID ${uid} removed from requests list.`);
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
            const q = query(collection(firestore, 'Users'), where('Uid', "==", uid))
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

                    console.log(`Project ${projectName} removed from user's requests.`);
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
                'createdBy': uid
            }



            // add the 
            const collectionRef = collection(firestore, 'Projects');
            // Add the document to the collection
            const docRef = await addDoc(collectionRef, documentData);
            const document_id = docRef.id;
            console.log('created document id', document_id);


            // setting up the global context id 
            setProjectId(document_id);
            // setting the project name for the global context
            setProjectName(projectName);

            // update the user profile to to add the project name in the user document
            const userRef = collection(firestore, 'Users');
            const querySnapshot = query(userRef, where('Uid', '==', uid));
            const userDocs = await getDocs(querySnapshot);
            if (!userDocs.empty) {
                const userDocument = userDocs.docs[0];
                const doc_refre = doc(firestore, 'Users', userDocs.docs[0].id);
                userDocument.data().Projects
                const updatedProjects = arrayUnion(projectNameCreate);
                await updateDoc(doc_refre, { Projects: updatedProjects });
            }

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
        // get the project id from the project name and then set up the context value and then navigate to it 
        // defining the project id for the name 
        const projectDocumentId = await getDocumentId(projectName);
        setProjectId(projectDocumentId);
        // navigating the landing pagr
        router.push(`/components/interface`);
    }

    return (

        <main className={styles.body}>

            <div className={styles.profileImageDescription}>
                <img src={imageUrl} alt="Profile image" className={styles.profileImage} />
                {/* <p>{userName}</p> */}
            </div>

            {projects && projects.length > 0 ?
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'left', alignItems: 'flex-start' }}>
                    {/* projects exist then allow user to select one and navigate using dynamic routing  */}
                    <h3 className={styles.projectsStatus}>Select project</h3>
                    {/* building map button for the project */}


                    <div className="container" style={{ marginLeft: -10 }}>
                        <div className="row">
                            {projects.map((element, index) => (
                                <div className="col-md-4 mb-3" key={index}>
                                    <button className="btn btn-dark btn-lg btn-block"
                                        style={{ fontSize: 16 }}
                                        onClick={() => navigateProject(element)}
                                    >{element}</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setShowCreateNewProject(true)} style={{ width: 200 }} className={styles.projectButton}>Create new project</button>
                </div>
                :
                <div>
                    {projects.length == 0 ?
                        <div>
                            <h3 className={styles.projectsStatus}>Oops! No project exist yet!</h3></div> : ''
                    }
                    <div className="d-flex flex-row justify-center align-center" style={{ gap: 10 }}>
                        <button className={`${styles.userPreferenceButton} ${userPreference === 'Create' ? styles.preferred : ''}`} onClick={() => SetUserPreference('Create')}>Create one</button>
                        <button className={`${styles.userPreferenceButton} ${userPreference === 'Join' ? styles.preferred : ''}`} onClick={() => SetUserPreference('Join')}>Join one</button>
                    </div>

                    {/* this section should be changeable according to the user pref */}
                    {
                        userPreference === 'Create' ?
                            <div style={{ marginTop: 25 }}>
                                <div className={styles.createProject}>
                                    <p>Project name</p>
                                    <input type="text" className={styles.projectName} placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />
                                </div>
                                <button onClick={createProject} className={styles.createButton}>Create</button>
                            </div> :
                            // then show join
                            // this would be conditionally shown if the member does exist then hide this and how that project itself

                            <div style={{ marginTop: 25 }}>


                                <div>
                                    <div className={styles.createProject}>
                                        <p>Project name</p>
                                        <input type="text" className={styles.projectName} placeholder="Type name of project..." onChange={(e) => setJoinProject(e.target.value)} />
                                    </div>
                                    <div className="d-flex flex-row" style={{ gap: 10 }}>
                                        <button onClick={joinProject} className={styles.createButton}>Join</button>
                                        <button onClick={showOldRequests} className={styles.requestButton}>Old Requests</button>
                                    </div>
                                </div>

                                <div>

                                    <button onClick={showOldRequests} className={styles.requestButton}>Old Requests</button>
                                </div>

                            </div>

                    }
                </div>}


            {/* show the user it's requests data */}
            {showRequest &&
                <div className={styles.showRequestsDialog}>
                    <div className={styles.showRequestHeader}>
                        <p>Project requests</p>
                        <button className={styles.cancelButton} onClick={() => setShowRequest(false)}>Close</button>
                    </div>
                    <div className={styles.requestsData}>
                        {/* show the map data */}
                        {Object.entries(requestsMap).map(([projectName, value]) => (
                            <div key={projectName} style={{ display: 'flex', flexDirection: 'row', gap: 100, alignItems: 'baseline', justifyContent: 'center' }}>
                                <p style={{ fontFamily: 'ReadexPro', fontSize: 18, color: 'black' }}>{projectName} </p>
                                <div key={projectName} style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'baseline', justifyContent: 'center' }}>
                                    <p style={{ color: value ? 'green' : 'grey', fontSize: 16 }}>{value ? 'Accepted' : 'Waiting'}</p>
                                    <button onClick={() => DeleteRequest(projectName)} className={styles.deleteButton}><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }



            {/* for creating new project */}
            {showNewProject &&
                <div className={styles.NewProjectPopup}>
                    <div className={styles.createProject}>
                        <p>Project name</p>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end' }}>
                            <input type="text" placeholder="Type name of project..." onChange={(e) => setProjectNameCreate(e.target.value)} />

                            <div style={{ display: 'flex', gap: 10, flexDirection: 'row' }}>
                                <button className={styles.projectButton} onClick={() => setShowCreateNewProject(false)}>cancel</button>
                                <button onClick={createProject} className={styles.projectButton}>Create</button>
                            </div>
                        </div>

                    </div>
                </div>
            }


            {successfulJoinRequest &&
                <div className={`${successfulJoinRequest} ? ${styles.successfullyInvited} : ' '`}>
                    <img src="/invite.png" alt="Successful invite icon" />
                    <p>Successfully invited</p>
                </div>
            }
        </main>
    )
}