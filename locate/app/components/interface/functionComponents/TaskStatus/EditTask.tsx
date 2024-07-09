import { useEffect, useRef, useState } from 'react';
import styles from './edittask.module.css';
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { firestore, storage } from '@/app/firebase';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { useGlobalUidContext } from '@/app/context/uid';
interface EditTask {
    taskDocumentId: string;
    isMobile: boolean;
}

export default function EditTask({ taskDocumentId, isMobile }: EditTask) {
    const [taskHeading, setTaskHeading] = useState<string>('');
    const [taskDescription, setTaskDescription] = useState<string>('');
    const [taskDeadline, setTaskDeadline] = useState('');
    const [assginieDocData, setAssignieDocData] = useState<{ [key: string]: string[] }>({});
    const [optionAssginieDocData, setOptionAssignieDocData] = useState<{ [key: string]: string[] }>({});
    const [taskFileData, setTaskFileData] = useState<{ [key: string]: string }>({});
    const [assignieImages, setAssignieImage] = useState<string[]>([]);
    const [openFile, setOpenFile] = useState(false);
    const [openAssignie, setOpenAssignie] = useState(false);
    const { projectId } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [createdBy, setCreatedBy] = useState('');

    const getUserData = async (userId: string): Promise<string[] | undefined> => {
        const q = query(collection(firestore, 'Users'), where('Uid', "==", userId));
        const docSnapshot = await getDocs(q);
        if (!docSnapshot.empty) {
            const docData = docSnapshot.docs[0].data();
            return [docData['Name'], docData['ImageUrl']];
        }
        return undefined; // Explicitly return undefined if no document is found
    };

    const getAssignees = async () => {
        const docRef = doc(firestore, 'Tasks', taskDocumentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const docData = docSnap.data();

            // now setting up the Assignies data
            const assignie_data = docData.Assignies;
            if (typeof assignie_data === 'object' && assignie_data !== null) {
                const updatedAssignieDocData: { [key: string]: string[] } = {};
                for (const [key, value] of Object.entries(assignie_data)) {
                    const userData = await getUserData(key);
                    if (userData) {
                        // Add the key and userData to updatedAssignieDocData
                        updatedAssignieDocData[key] = userData;
                    }
                }
                return updatedAssignieDocData;
            }

        }
    };


    useEffect(() => {


        // get the data related to the task using its document id
        const getTaskData = async () => {
            const docRef = doc(firestore, 'Tasks', taskDocumentId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const docData = docSnap.data();
                setCreatedBy(docData.CreatedBy);
                setTaskHeading(docData.Heading);
                setTaskDescription(docData.Description);
                setTaskDeadline(docData.Deadline);
                const file_data = docData.Files;
                setTaskFileData(file_data);

                const assginies = docData.AssignieesImages.slice(0, 2);
                setAssignieImage(assginies);


                // now setting up the Assignies data
                const assignie_data = docData.Assignies;
                if (typeof assignie_data === 'object' && assignie_data !== null) {
                    const updatedAssignieDocData: { [key: string]: string[] } = {};
                    for (const [key, value] of Object.entries(assignie_data)) {
                        const userData = await getUserData(key);
                        if (userData) {
                            // Add the key and userData to updatedAssignieDocData
                            updatedAssignieDocData[key] = userData;
                        }
                    }
                    setAssignieDocData(updatedAssignieDocData);
                }


            }
        };

        getTaskData();
    }, [taskDocumentId]);


    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        // Trigger the hidden file input click event
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: any) => {
        const files: any = Array.from(event.target.files);
        setSelectedFiles(files);
    };

    useEffect(() => {
        const uploadFiles = async () => {
            const newFileURLs: { [key: string]: string } = {};

            for (const file of selectedFiles) {
                const storageRef = ref(storage, `uploads/${file.name}`);
                await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(storageRef);
                newFileURLs[file.name] = downloadURL;
            }

            setTaskFileData(prevTaskFileData => {
                const updatedData = { ...prevTaskFileData, ...newFileURLs };

                // Update Firestore document with the new data
                const docRef = doc(firestore, 'Tasks', taskDocumentId);
                updateDoc(docRef, { Files: updatedData });

                return updatedData;
            });

            // empty the selectedFiles with the blank data
            setSelectedFiles([]);
        };

        if (selectedFiles.length > 0) {
            uploadFiles();
        }
    }, [selectedFiles, storage]);


    const handleDeleteFile = async (fileName: string) => {
        const storageRef = ref(storage, `uploads/${fileName}`);
        await deleteObject(storageRef);

        setTaskFileData(prevTaskFileData => {
            const updatedData = { ...prevTaskFileData };
            delete updatedData[fileName];

            // Update Firestore document with the new data
            const docRef = doc(firestore, 'Tasks', taskDocumentId);
            updateDoc(docRef, { Files: updatedData });

            return updatedData;
        });
    };

    const [openOptionAssignie, setOpenOptionAssignie] = useState(false);

    const deleteAssignee = async (assigneeId: string) => {
        // Remove the key-value pair from the assginieDocData state
        setAssignieDocData(prevState => {
            const updatedState = { ...prevState };
            delete updatedState[assigneeId];
            return updatedState;
        });

        // Use getUserData to get the assignee's image URL
        const key_value_data = await getUserData(assigneeId);
        if (!key_value_data) {
            console.error('User data not found');
            return;
        }

        const assigneeUrl = key_value_data[1];

        try {
            const docRef = doc(firestore, 'Tasks', taskDocumentId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const docData = docSnapshot.data();
                const assigneeImages = docData.AssignieesImages || [];
                const assignees = docData.Assignies || {};

                // Create a new array without the removed URL
                const updatedAssigneeImages = assigneeImages.filter((url: string) => url !== assigneeUrl);

                // Remove the assignee ID from the map
                const { [assigneeId]: removed, ...updatedAssignees } = assignees;

                // Update the Firestore document
                await updateDoc(docRef, {
                    AssignieesImages: updatedAssigneeImages,
                    Assignies: updatedAssignees
                });

                console.log('Assignee deleted successfully');
            } else {
                console.error('No such document!');
            }
        } catch (error) {
            console.error('Error updating document:', error);
        }
    };


    const addAssignee = async (key: string) => {
        setAssignieDocData((prevData) => ({
            ...prevData,
            [key]: optionAssginieDocData[key],
        }));

        setOptionAssignieDocData((prevData) => {
            const newData = { ...prevData };
            delete newData[key];
            return newData;
        });

        // add some data in the 
        const key_value_data = await getUserData(key) || [];
        const assigneeUrl = key_value_data[1];
        const docRef = doc(firestore, 'Tasks', taskDocumentId);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
            const docData = docSnapshot.data();
            const assigneeImages = docData.AssignieesImages || [];
            const assignees = docData.Assignies || {};

            // Update the AssignieesImages array and Assignies map
            await updateDoc(docRef, {
                assigneeImages: arrayUnion(assigneeUrl),
                [`assignees.${key}`]: 'Assigned'
            });

        }
    };

    // function to get get the member data 
    useEffect(() => {
        const getMembers = async () => {
            const docRef = doc(firestore, 'Projects', projectId);
            const docData = await getDoc(docRef);

            if (docData.exists()) {
                const assignie_data = docData.data().members;

                const updatedAssignieDocData: { [key: string]: string[] } = {};
                for (const member_id of assignie_data) {
                    const userData = await getUserData(member_id);
                    if (userData) {
                        // Add the key and userData to updatedAssignieDocData
                        updatedAssignieDocData[member_id] = userData;
                    }
                }
                const assignee_data = await getAssignees() || {};
                console.log(assignee_data);
                console.log(updatedAssignieDocData);
                // filter the data from the assignies set data and then set
                const filteredAssignieDocData: { [key: string]: string[] } = {};
                for (const [key, value] of Object.entries(updatedAssignieDocData)) {
                    if (!(key in assignee_data)) {
                        filteredAssignieDocData[key] = value;
                    }
                }

                setOptionAssignieDocData(filteredAssignieDocData);

            }
        }

        getMembers();
    }, [projectId]);



    return (
        <main className={`${isMobile ? styles.mobileTaskShowData : ''}`}>
            <div className={styles.headRowData}>
                {/* column for the doc heading */}
                <div className={styles.headData}>
                    <p className={styles.heading}>Task</p>
                    <input className={styles.textHeading} disabled={!(uid == createdBy)} type="text" value={taskHeading} onChange={(e) => setTaskHeading(e.target.value)} />
                </div>
                {/* column for the doc Deadline */}
                <div className={styles.headData}>
                    <p className={styles.heading}>Deadline</p>
                    {/* deadline showing  */}
                    <div className={styles.deadlineBox} >
                        <div className={`${uid == createdBy ? styles.deadlineData : styles.nodeadlineData}`}>
                            <img src='/Calendar.png' /><p className={styles.deadline}>{taskDeadline}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${isMobile ? styles.mobileColData : ''}`}>
                {/* showing the task description  */}
                <div className={styles.headData}>
                    <p className={styles.heading}>Description</p>
                    <textarea className={styles.taskDescription} disabled={!(uid == createdBy)} value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}></textarea>
                </div>


                <div className={styles.BottomButtonCollection}>
                    {/* Attach files */}
                    <div className={styles.filesRowData} onClick={() => setOpenFile(true)}>
                        <img src='/Files.png' /><p className={styles.fileRowHeading}>Files</p>
                    </div>

                    {/* handle assignies  */}
                    <div onClick={() => setOpenAssignie(true)} className={styles.assignieImageRowData}>
                        <div className={styles.assignieImageRow}>
                            {assignieImages.map((imageUrl, index) => (
                                <img className={styles.assignieImage} src={imageUrl} alt="Image Url" />
                            ))}
                        </div>
                        <p className={styles.assignieText}>Assignees</p>
                    </div>
                    <button className={`${uid == createdBy ? styles.updateTaskButton : styles.noUpdateTaskButton}`}>Update Task</button>
                </div>
            </div>

            {/* opening the file to show the description */}
            {openFile &&
                <div className={styles.fileDialog}>
                    <div className={styles.fileDialogHeader}>
                        <p className={styles.fileDialogHeaderHeading}>Task Files</p>
                        <button className={styles.fileDialogCloseButton} onClick={() => setOpenFile(false)}><img src='/Cross.png' /></button>
                    </div>
                    {/* using the map to show the data */}
                    <div className={styles.fileColumn}>
                        {
                            taskFileData ?
                                Object.entries(taskFileData).map(([key, value]) => (
                                    <div className={styles.fileRow}>
                                        <p className={styles.fileName}>{key}</p>
                                        <button onClick={() => handleDeleteFile(key)} className={styles.fileDeleteButton}><img src='/deleteIcon.png' /></button>
                                    </div>
                                )) :
                                <p className={styles.noFileToShow}>No file to show!</p>
                        }
                        <input type="file"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple />
                        <button onClick={handleButtonClick} className={`${uid == createdBy ? styles.addFileButton : styles.noAddFileButton}`}>Add files</button>
                    </div>
                </div>
            }


            {openAssignie &&
                <div className={styles.fileDialog}>
                    <div className={styles.fileDialogHeader}>
                        <p className={styles.fileDialogHeaderHeading}>Assignees</p>
                        <button className={styles.fileDialogCloseButton} onClick={() => setOpenAssignie(false)}><img src='/Cross.png' /></button>
                    </div>
                    <div className={styles.fileColumn}>

                        {Object.entries(assginieDocData).map(([key, value]) => (
                            <div className={styles.fileRow}>
                                <div className={styles.assignieData}>

                                    <img className={styles.assignieImage} src={value[1]} />
                                    <p className={styles.assignieName}>{value[0]}</p>
                                </div>
                                <button onClick={() => deleteAssignee(key)} className={` ${uid != createdBy ? styles.noDeleteAssigneeButton : styles.fileDeleteButton}`}><img src='/deleteIcon.png' /></button>
                            </div>
                        ))}
                        <button onClick={() => setOpenOptionAssignie(true)} className={`${uid == createdBy ? styles.addFileButton : styles.noAddFileButton}`}>Add Assignies</button>
                    </div>
                </div>
            }

            {
                openOptionAssignie &&
                <div className={styles.fileDialog}>
                    <div className={styles.fileDialogHeader}>
                        <p className={styles.fileDialogHeaderHeading}>Project Members</p>
                        <button className={styles.fileDialogCloseButton} onClick={() => setOpenOptionAssignie(false)}><img src='/Cross.png' /></button>
                    </div>
                    <div className={styles.fileColumn}>

                        {Object.entries(optionAssginieDocData).map(([key, value]) => (
                            <div className={styles.fileRow}>
                                <div className={styles.assignieData}>

                                    <img className={styles.assignieImage} src={value[1]} />
                                    <p className={styles.assignieName}>{value[0]}</p>
                                </div>
                                <button onClick={() => addAssignee(key)} className={styles.fileDeleteButton}><img src='/AddCircle.png' /></button>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </main>
    );
}
