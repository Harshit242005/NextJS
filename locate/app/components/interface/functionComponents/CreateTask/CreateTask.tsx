// Importing a Material-UI button component
'use client'
// import { Typography, TextField } from '@mui/material'
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
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
import useBeforeUnload from '@/app/inactive';
import Image from 'next/image';
import axios from 'axios';

export default function CreateTask() {



    const { projectName, projectId } = useGlobalProjectIdContext();
    const { uid, userName } = useGlobalUidContext();


    const [attachedFiles, setAttachedFiles] = useState<boolean>(false);


    const [showAssignOption, SetShowAssigniesOption] = useState<boolean>(false);

    const [heading, setHeading] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');

    const [assignies, setAssignies] = useState<string[]>([]);

    const [fileObject, setFileObject] = useState<any>(null);
    const [fileObjectView, setFileObjectForView] = useState<any>({});

    const [openAttachmentView, setOpenAttachmentView] = useState(false);



    const askForFile = () => {
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




    const addFiles = () => {
        askForFile(); // call for the file input and select more files 
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

    const createTaskFunction = async () => {

        console.log('file objects are', fileObject);
        console.log('assignies are', assignies);

        const created_at = getCurrentDate();
        // construct the map
        const assigneeMap: { [key: string] : boolean} = {};
        for (const assigneeId of assignies) {
            assigneeMap[assigneeId] = false;
        }

        // code to create the task 
        const task = {
            'Heading': heading,
            'Description': description,
            'CreatedBy': uid,
            'Deadline': deadline,
            'CreatedAt': created_at,  // current date in dd/mm/yy format
            'Assignies': assigneeMap,
            'Project': projectId,
            'Files': fileObject,  // associated files 
            'CreatorImage': await getCreatorImage(uid),
            'AssignieesImages': await getAssignieesImageUrls(assignies)
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



        const response = await axios.post('http://localhost:5000/sendTaskCreate', {
            'Headline': heading,
            'Deadline': deadline,
            'CreatedAt': created_at,
            'CreatedBy': userName,
            'Members': userGmails
        });
        console.log(response)
    }

    // update the list
    const updateListInDocument = async (collectionName: string, documentId: string, listKey: string, newData: any) => {
        try {
            // Reference to the document
            const documentRef = doc(firestore, collectionName, documentId);

            // Get the current data of the document
            const documentSnapshot = await getDoc(documentRef);
            if (!documentSnapshot.exists()) {
                throw new Error('Document does not exist');
            }

            // Get the current data object
            const currentData = documentSnapshot.data();

            // Ensure that the listKey exists in the currentData object
            if (!currentData.hasOwnProperty(listKey) || !Array.isArray(currentData[listKey])) {
                throw new Error(`Key "${listKey}" is not a list in the document`);
            }

            // Add the newData to the list
            currentData[listKey].push(newData);

            // Update the document with the modified data
            await updateDoc(documentRef, { [listKey]: currentData[listKey] });

            console.log('List updated successfully');
            return true;
        } catch (error) {
            console.error('Error updating list in document:', error);
            return false;
        }
    };

    const getCurrentDate = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0'); // Get the day and pad it with leading zero if necessary
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Get the month (months are zero-based) and pad it with leading zero if necessary
        const yy = String(today.getFullYear()).slice(-2); // Get the last two digits of the year

        return `${dd}/${mm}/${yy}`;
    };


    // const selectDeadline = () => {
    //     const deadlineInput = document.getElementById('deadline') as HTMLInputElement;
    //     if (deadlineInput) {
    //         deadlineInput.focus();
    //     }
    // };


    // const handleDeadlineChange = (event: Event) => {
    //     const target = event.target as HTMLInputElement;
    //     setDeadline(target.value);
    // };

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



    return (
        <main className={styles.mainBody}>


            <div className={styles.topBar}>

                <input type="text" className={styles.TaskHeading} placeholder='Type heading...' onChange={(e) => setHeading(e.target.value)} />
                {/* 
                <button className={styles.deadline} onClick={selectDeadline}>

                    <img src="/Deadline.png" alt="Calendar icon" />
                    Select deadline

                    <input type="date" id='deadline' style={{ display: 'none' }} onChange={()=>handleDeadlineChange} placeholder='Select Deadline' />
                </button>
                */}
                <div className={styles.datepickerContainer}>
                    {/* <LocalizationProvider dateAdapter={AdapterDayjs}>

                        <DatePicker className={styles.datepicker} label="Select deadline" />

                    </LocalizationProvider> */}

                    <input type="date" onChange={handleDateChange} className={styles.datepicker}  />
                </div>

            </div>

            <div className={styles.midBar}>
                <textarea className={styles.TaskDescription} onChange={(e) => (setDescription(e.target.value))} placeholder='Type description...' style={{ padding: 10, fontFamily: 'ReadexPro' }} />
            </div>




            <div className={styles.bottomBar}>
                <div className={styles.attachmentBar}>
                    {/* onChange={handleFileSelection} */}
                    <input type="file" id='attachments' multiple style={{ display: 'none' }} />

                    <button className={styles.attachmentButton} style={{ height: 50, marginTop: 5 }}
                        // define the function call for asking for the file input
                        onClick={askForFile}>
                        <img src="/Attach.png" alt="Attachement icon" />
                        Attach Files
                    </button>

                    <div>
                        {/* onClick={showAttachementFiles} */}
                        {attachedFiles && <button onClick={() => setOpenAttachmentView(true)} className={styles.attachments} >Attachments</button>}
                    </div>
                </div>

                {
                    openAttachmentView &&
                    // show the attachment for the view of the task 

                    <div className={styles.attachementViewPopup}>
                        <div className={styles.attachmentHeder}>
                            <h3>Files to upload</h3>
                            <button className={styles.closeButton} onClick={() => setOpenAttachmentView(false)}>Close</button>
                        </div>
                        <div className={styles.files}>
                            {Object.keys(fileObjectView).map((fileName, index) => (
                                <div key={index} className={styles.fileData}>
                                    <span>{fileName}</span>
                                    <button className={styles.deleteFileButton} onClick={() => handleDeleteFile(fileName)}><FontAwesomeIcon icon={faTrash} /></button>
                                </div>
                            ))}
                        </div>
                        <div className={styles.fileHandlingButtons}>
                            <button onClick={addFiles} className={styles.fileHandlingButton}>Add</button>
                            <button onClick={uploadFiles} className={styles.fileHandlingButton}>Upload</button>
                        </div>
                    </div>
                }

                {/* button to add assignies */}
                <div >

                    <button onClick={() => SetShowAssigniesOption(true)} className={styles.assignButton}>
                        <img src="/Peoples.png" alt="Peoples icon" />
                        {assignies.length} Assign</button>
                </div>
            </div>


            {
                showAssignOption &&
                // call a component to show up
                <Assignies setShowAssignOption={SetShowAssigniesOption} showAssignOption={showAssignOption} setAssignies={setAssignies} assignies={assignies} />
            }

            <button onClick={createTaskFunction} style={{ width: 915, border: 'none', borderRadius: 5, marginTop: 10, height: 50, fontSize: 20, fontFamily: 'ReadexPro', backgroundColor: 'black', color: 'whitesmoke' }}>Create</button>
        </main>
    )
}