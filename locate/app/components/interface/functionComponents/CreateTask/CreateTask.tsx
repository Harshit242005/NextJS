// Importing a Material-UI button component
'use client'

import styles from './createask.module.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';
import { firestore, storage } from '@/app/firebase';
import { collection, addDoc, updateDoc, getDoc, doc, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { useGlobalUidContext } from '@/app/context/uid';
import Assignies from './assignies';

import Image from 'next/image';
import axios from 'axios';
import Success from '@/app/components/Animations/Success';


interface CreateTaskProps {
    setCurrentComponenet: React.Dispatch<React.SetStateAction<string>>;
}


export default function CreateTask({ setCurrentComponenet }: CreateTaskProps) {


    const [showCompletedTask, setShowCompletedTask] = useState<boolean>(false);
    
    const { projectName, projectId, setProjectName, setProjectId } = useGlobalProjectIdContext();
    const { uid, userName, setUid, setUserName } = useGlobalUidContext();

    useEffect(() => {
        // Retrieve user data from localStorage if it exists
        if (typeof window !== 'undefined') {
            const storedUid = localStorage.getItem('UserUid');

            const storedUserName = localStorage.getItem('UserName');

            setProjectId(localStorage.getItem('ProjectId') || '');
            setProjectName(localStorage.getItem('ProjectName') || '');

            if (storedUid) {
                setUid(storedUid);
                setUserName(storedUserName || '');

            }
        }
    }, []);


    const [attachedFiles, setAttachedFiles] = useState<boolean>(false);


    const [showAssignOption, SetShowAssigniesOption] = useState<boolean>(false);

    const [heading, setHeading] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');

    const [assignies, setAssignies] = useState<string[]>([]);
    const [selectedId, setSelectedUid] = useState<string[]>([]);

    const [fileObject, setFileObject] = useState<any>(null);
    const [fileObjectView, setFileObjectForView] = useState<any>({});

    const [openAttachmentView, setOpenAttachmentView] = useState(false);

    const isDisabled = () => {
        if (description == '' || heading == '' || deadline == '') {
            return true;
        }
        return false;
    }


    // unmount the component 
    useState(() => {
        return () => {
            SetShowAssigniesOption(false);
            setAttachedFiles(false);
            setHeading('');
            setDescription('');
            setDeadline('');
            setAssignies([]);
            setFileObject(null);
            setFileObjectForView({});
            setOpenAttachmentView(false);
            setSelectedUid([]);
        }
    })



    const askForFile = () => {
        console.log('file object is not null and looking for more files');
        // Get the file input element
        const fileInput: any = document.getElementById('attachments');
        // Set up an event listener for the change event on the file input
        fileInput.addEventListener('change', handleFileUpload);
        // Trigger a click event on the file input element
        fileInput.click();


    }

    const uploadFiles = async () => {
        // Create an object to store download URLs
        const downloadURLs: Record<string, string> = {};

        try {
            // Iterate through each file in fileObjectView
            for (const fileName in fileObjectView) {
                if (fileObjectView.hasOwnProperty(fileName)) {
                    const file = fileObjectView[fileName];

                    // Upload the file to cloud storage
                    const storageRef = ref(storage, fileName);
                    const snapshot = await uploadBytes(storageRef, file);

                    // Get the download URL of the uploaded file
                    const downloadURL = await getDownloadURL(storageRef);

                    // Store the download URL in the downloadURLs object with the file name as key
                    downloadURLs[fileName] = downloadURL;
                }
            }

            // Update the fileObject state with the download URLs
            setFileObject(downloadURLs);


        } catch (error) {
            console.error('Error uploading files:', error);
        }

        // after successful upload hide all the dialogs 
        setAttachedFiles(false);
        setOpenAttachmentView(false);
    };

    const askForAttachment = () => {
        // condition based opening of the asking for the attachement 
        if (fileObjectView != null) {
            setOpenAttachmentView(true);
        }
    }

    const addFiles = () => {
        askForFile();
    }

    const handleFileUpload = async () => {
        // Get the file input element
        const fileInput = document.getElementById('attachments') as HTMLInputElement;
        fileInput.removeEventListener('change', handleFileUpload);
        const files = fileInput.files;
        if (!files || files.length === 0) {
            console.error('No files selected for upload');
            return;
        }
        setAttachedFiles(true);


        try {
            // Convert FileList to array of File objects
            const fileList = Array.from(files) as File[];

            // Create a copy of the existing fileObjectView state
            const updatedFileObjectView = { ...fileObjectView };

            // Iterate through each new file
            for (const file of fileList) {
                const fileName = file.name;
                // Add the new file to the updatedFileObjectView
                updatedFileObjectView[fileName] = file;
            }
            // Update the fileObjectView state with the merged files
            setFileObjectForView(updatedFileObjectView);


        } catch (error) {
            console.error('Error uploading files:', error);
        }


    };

    const getCreatorImage = async (uid: string | null) => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", uid))
        const documents = await getDocs(q);
        if (!documents.empty) {
            console.log(`Image url for the uid: ${uid} is ${documents.docs[0].data().ImageUrl}`);
            return documents.docs[0].data().ImageUrl;
        }
        return ''; // Return a default value if image URL is not found
    }

    const getAssignieesImageUrls = async (uids: string[]) => {
        const imageUrls = [];
        for (const uid of uids) {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", uid))
            const documents = await getDocs(q);
            if (!documents.empty) {
                console.log(`Image url for the uid: ${uid} is ${documents.docs[0].data().ImageUrl}`);
                imageUrls.push(documents.docs[0].data().ImageUrl);
            }
        }

        return imageUrls;
    }

    const fetchUuid = async () => {
        try {
            const uuid_response = await axios.get('https://fern-ivory-lint.glitch.me/getUuid');

            if (uuid_response.status === 200) {
                const uid = uuid_response.data.UID;
                return uid
            }

        } catch (error) {
            console.error('Error fetching UUID:', error);
        }
    };

    const createTaskFunction = async () => {
        // a check should be added in this to get the details of the deadline and task heading which are not none 
        const UID = await fetchUuid();
 
        const created_at = getCurrentDate();
        // construct the map
        const assigneeMap: { [key: string]: boolean } = {};
        for (const assigneeId of assignies) {
            assigneeMap[assigneeId] = false;
        }

        // code to create the task 
        const task = {
            'Heading': heading,
            'Description': description,
            'CreatedBy': uid,
            'Deadline': deadline,
            'CreatedAt': created_at,
            'Assignies': assigneeMap,
            'Project': projectId,
            'Files': fileObject,
            'CreatorImage': await getCreatorImage(uid),
            'AssignieesImages': await getAssignieesImageUrls(assignies),
            'Status': 'Assigned',
            'TaskID': UID
        };

        console.log('Task we are adding is', task);
        // Reference to the Firestore collection where you want to add the document
        const collectionRef = collection(firestore, 'Tasks');

        // Add a document with an automatically generated ID
        const docRef = await addDoc(collectionRef, task);
        console.log('Document added with ID: ', docRef.id);
        const new_task_id = docRef.id;
        try {
            // add the task id in the project tasksids list 
            const q = query(collection(firestore, 'Projects'), where('projectName', "==", projectName))
            const documents = await getDocs(q);
            if (!documents.empty) {
                const project_document = documents.docs[0];
                const documentId = project_document.id;

                const docRef = doc(firestore, 'Projects', documentId)
                await updateDoc(docRef, {
                    TasksIds: arrayUnion(new_task_id) // Using arrayUnion to ensure unique IDs
                });
            }
        }
        catch (error) {
            console.log('Not been able to update the TasksIds list of the project', error);
        }

        // function to send an mail to all the assigned user 
        // get each user gmail who has been assigned with the body
        const userGmails = [];
        for (const id of assignies) {
            const q = query(collection(firestore, 'Users'), where('Uid', "==", id));
            const documents = await getDocs(q);
            if (!documents.empty) {
                const userDocEmail = documents.docs[0].data().Email;
                userGmails.push(userDocEmail);
            }
        }





        const response = await axios.post('https://fern-ivory-lint.glitch.me/sendTaskCreate', {
            'Headline': heading,
            'Deadline': deadline,
            'CreatedAt': created_at,
            'CreatedBy': userName || localStorage.getItem('UserName'),
            'Members': userGmails
        });

        // clear of the task inputs 
        SetShowAssigniesOption(false);
        setAttachedFiles(false);
        setHeading('');
        setDescription('');
        setDeadline('');
        setAssignies([]);
        setFileObject(null);
        setFileObjectForView({});
        setOpenAttachmentView(false);
        setSelectedUid([]);


        console.log(response);
        setShowCompletedTask(true);
        setTimeout(() => {
            setShowCompletedTask(false)
        }, 1000);

    }



    const getCurrentDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0'); // Get the day and pad it with leading zero if necessary
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Get the month (months are zero-based) and pad it with leading zero if necessary
        const yy = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

        return `${dd}/${mm}/${yy}`;
    };




    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const date = event.target.value; // This will give you the date as a string in YYYY-MM-DD format
        setDeadline(date);
        console.log('Selected Date type:', typeof date); // Log the selected date
    };

    const handleDeleteFile = (fileName: string) => {
        // Create a copy of the fileObjectForView state
        const updatedFileObject = { ...fileObjectView };
        // Remove the file with the specified file name
        delete updatedFileObject[fileName];
        // Update the fileObjectForView state with the updated fileObject
        setFileObjectForView(updatedFileObject);
    };

    const handleFocus = (event: { target: { type: string; }; }) => {
        event.target.type = 'date';
    };

    const handleBlur = (event: { target: { value: string; type: string; }; }) => {
        if (event.target.value === '') {
            event.target.type = 'text';
        }
    };



    return (
        <main className={styles.mainBody}>


            <div className={styles.topBar}>

                <input type="text" className={styles.TaskHeading} value={heading} placeholder='Type heading...' onChange={(e) => setHeading(e.target.value)} />

                <div className={styles.datepickerContainer}>
                    <input
                        placeholder='Select deadline...'
                        onChange={handleDateChange}
                        value={deadline}
                        className={styles.datepicker}
                        type="text"
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    {/* <input type="date" onChange={handleDateChange} value={deadline} className={styles.datepicker} placeholder='Select deadline...' /> */}
                </div>

            </div>

            <div className={styles.midBar}>
                <textarea className={styles.TaskDescription} value={description} onChange={(e) => (setDescription(e.target.value))} placeholder='Type description...' style={{ padding: 10, fontFamily: 'ReadexPro' }} />
            </div>




            <div className={styles.bottomBar}>
                <div className={styles.attachmentBar}>
                    {/* onChange={handleFileSelection} */}
                    <input type="file" id='attachments' multiple style={{ display: 'none' }} />

                    <button
                        className={fileObjectView == null ? styles.attachmentButton : styles.fileObjectButton}
                        style={{ height: 50, marginTop: 5 }}
                        onClick={askForAttachment}
                    >
                        {fileObjectView == null ? (
                            <>
                                <img src="/Attach.png" alt="Attachment icon" />
                                Attach Files
                            </>
                        ) : (
                            'Attachments'
                        )}
                    </button>

                </div>

                {/* shoowing up the attachments for the user profile */}
                {
                    openAttachmentView &&


                    <div className={styles.attachementViewPopup}>
                        <div className={styles.attachmentHeader}>
                            <p className={styles.attachmentHeaderHeading}>Upload files</p>
                            <button className={styles.closeButton} onClick={() => setOpenAttachmentView(false)}><img src='/Cross.png' /></button>
                        </div>
                        <div className={styles.files}>
                            {Object.keys(fileObjectView).map((fileName, index) => (
                                <div key={index} className={styles.fileData}>
                                    <p className={styles.fileName}>{fileName}</p>
                                    <button className={styles.deleteFileButton} onClick={() => handleDeleteFile(fileName)}><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.fileHandlingButtons}>
                            <button style={{ borderBottomLeftRadius: 10 }} onClick={addFiles} className={styles.fileHandlingButton}>Add</button>
                            <button style={{ borderBottomRightRadius: 10 }} onClick={uploadFiles} className={styles.fileHandlingButton}>Upload</button>
                        </div>
                    </div>
                }

                {/* button to add assignies */}
                <div style={{ marginTop: 5 }}>
                    <button onClick={() => SetShowAssigniesOption(true)} className={styles.assignButton}>
                        <img src="/Peoples.png" alt="Peoples icon" />
                        {assignies.length} Assign</button>
                </div>
            </div>




            {
                showAssignOption &&
                // call a component to show up
                <Assignies setShowAssignOption={SetShowAssigniesOption} showAssignOption={showAssignOption} setAssignies={setAssignies} setSelectedUid={setSelectedUid} selectedId={selectedId} assignies={assignies} />
            }

            {
                isDisabled() ?
                    <button onClick={createTaskFunction} disabled className={styles.createButton}>Create</button> :
                    <button onClick={createTaskFunction} className={styles.createButton}>Create</button>
            }


            {
                showCompletedTask &&
                <Success successMessage='Created task successfully' />
            }

        </main>
    )
}