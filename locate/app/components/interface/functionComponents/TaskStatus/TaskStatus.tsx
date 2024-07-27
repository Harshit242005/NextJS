// component  for the task status 
'use client'
import Image from 'next/image';
import styles from './taskstatus.module.css';
import React, { Dispatch, useEffect, useState } from 'react';
import { collection, onSnapshot, where, query, getDocs } from 'firebase/firestore';
import { firestore, storage } from '@/app/firebase'; // Import your Firestore instance
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { getDownloadURL, ref } from 'firebase/storage';



interface documentStructure {

    id: string,

    data: {
        // define the structure of the data
        Assignies: string[];
        CreatedAt: string;
        CreatedBy: string;
        Deadline: string;
        Description: string;
        Files: { [key: string]: string };
        Heading: string;
        Project: string;
        AssignieesImages: string[];
        CreatorImage: string;
        Status: string;
    }
}

interface TaskStatusProps {
    setOpenTask: React.Dispatch<React.SetStateAction<boolean>>;
    setTaskHeading: React.Dispatch<React.SetStateAction<string>>;
    setTaskAuthor: React.Dispatch<React.SetStateAction<string>>;
    setTaskDocumentId: React.Dispatch<React.SetStateAction<string>>;
    setCurrentComponenet: React.Dispatch<React.SetStateAction<string>>;
}

export default function TaskStatus({ setOpenTask, setTaskHeading, setTaskDocumentId, setCurrentComponenet, setTaskAuthor }: TaskStatusProps) {
    // Define state to store the documents
    const [documents, setDocuments] = useState<documentStructure[]>([]);
    const { projectId, setProjectId } = useGlobalProjectIdContext();
    const [showFileDialog, setShowFileDialog] = useState(false);
    const [filesToShow, setFilesToShow] = useState<any>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setProjectId(localStorage.getItem('ProjectId') || '');
        }
    }, [projectId]);

    function getCurrentDate() {
        const currentDate = new Date();
        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = currentDate.getFullYear();

        return `${day}/${month}/${year}`;

    }
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 425);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 425);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const replaceHyphensWithSlashes = (dateStr: string) => {

        const modifiedStr = dateStr.replace(/-/g, '/');
        console.log(modifiedStr);
        console.log(modifiedStr.split('/'));
        const [year, month, day] = modifiedStr.split('/');

        return `${day}/${month}/${year}`;
    };

    const getCurrentDateResult = (deadline: string) => {
        const current_date_str = getCurrentDate();

        console.log("Current Date String:", current_date_str);
        const replaced_deadline = replaceHyphensWithSlashes(deadline);
        console.log(replaced_deadline);

        // Function to parse date string in dd/MM/yyyy format to a Date object
        const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day); // month is 0-indexed in Date object
        }

        // Parse current date and deadline into Date objects
        const currentDate = parseDate(current_date_str);
        const deadlineDate = parseDate(replaced_deadline);

        console.log("Parsed Current Date:", currentDate);
        console.log("Parsed Deadline Date:", deadlineDate);

        // Check if parsed dates are valid
        if (isNaN(currentDate.getTime()) || isNaN(deadlineDate.getTime())) {
            console.error("Invalid Date Parsing");
            return false;
        }

        // Compare the dates
        const result_date = currentDate < deadlineDate;
        console.log("Comparison Result:", result_date);
        return result_date;
    }




    useEffect(() => {
        // Reference to the Firestore collection you want to listen to
        const collectionRef = collection(firestore, 'Tasks');

        // Use onSnapshot to listen for real-time updates
        const unsubscribe = onSnapshot(
            query(collectionRef, where('Project', '==', projectId)),
            async (querySnapshot) => {
                const updatedDocuments: any = [];
                querySnapshot.forEach(async (doc) => {
                    console.log('The doc is', doc.data());


                    // Convert the document to JSON and add it to the updatedDocuments array
                    updatedDocuments.push({
                        id: doc.id,
                        data: doc.data()
                    });
                });



                // Update the documents state with the updatedDocuments array
                setDocuments(updatedDocuments);
            }
        );

        // Return a cleanup function to unsubscribe from the listener when the component unmounts
        return () => {
            unsubscribe();

        }
    }, [projectId]); // Add projectId to the dependency array

    const openFilesDialogs = (files: { [key: string]: string; }) => {
        setShowFileDialog(true);

        setFilesToShow(files);
    }

    const downloadFile = async (fileUrl: string) => {
        console.log(fileUrl);
        try {
            const anchor = document.createElement('a');
            anchor.href = fileUrl;
            anchor.target = '_blank'; // Open in a new tab

            anchor.click();

        } catch (error) {
            console.error("Error downloading file:", error);
        }
    }

    const setTaskValues = (taskHeading: string, documentId: string, createdBy: string) => {
        setOpenTask(true);
        setTaskHeading(taskHeading);
        setTaskDocumentId(documentId);

        setTaskAuthor(createdBy);
        setCurrentComponenet('EditTask');
    }


    // Now you can use the documents state to render your UI
    return (
        <main>
            <div className={styles.TaskCollection}>
                {/* Render UI using the documents state */}
                {
                    documents.length != 0 ?
                        documents.map((document) => (
                            <div key={document.id} className={styles.Task}>
                                {/* top bar of the task div */}
                                <div className={styles.taskTopbar}>
                                    <img className={styles.creatorImage} src={document.data.CreatorImage} />
                                    <div className={styles.taskTextDescription}>
                                        <p className={styles.taskHeading}>{document.data.Heading}</p>
                                        {
                                            !isMobile ?
                                                <p className={styles.taskDescription}>{document.data.Description}</p>
                                                : ""
                                        }
                                    </div>
                                    <div className={`${isMobile ? styles.mobileTaskCardButtons : ''}`}>
                                        {isMobile ? <div><button className={styles.attachmentButton} onClick={() => openFilesDialogs(document.data.Files)}>
                                            <Image src="../../FilesButton.svg" alt='file icon' width={50} height={50} />

                                        </button></div> : ""}
                                        <button
                                            onClick={() => setTaskValues(document.data.Heading, document.id, document.data.CreatedBy)}
                                            className={styles.taskStatus}>{document.data.Status}</button>
                                    </div>
                                </div>
                                <div className={styles.bottomBar}>

                                    <div className={styles.AssigneeDescription}>


                                        <p>Assignees</p>

                                        {/* image would be shown here in this  */}
                                        <div className={styles.taskAssigneesImages}>
                                            {document.data.AssignieesImages.slice(0, 2).map((image, index) => (
                                                <img className={styles.assigneeImage} key={index} src={image} alt={`Assignee ${index + 1}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.sideDescriptionTask}>
                                        <div className={styles.fileDeadlineStatus}>
                                            {
                                                !isMobile ?
                                                    <button className={styles.attachmentButton} onClick={() => openFilesDialogs(document.data.Files)}>
                                                        <Image src="../../FilesButton.svg" alt='file icon' width={50} height={50} />
                                                    </button>
                                                    : ""
                                            }

                                            {!isMobile ?


                                                <p className={getCurrentDateResult(document.data.Deadline) ? styles.validDate : styles.invalidDate}
                                                >{document.data.Deadline}</p>

                                                : ""}
                                        </div>

                                    </div>
                                </div>

                            </div>
                        ))

                        : <p className={styles.noTask}>No task has been created yet</p>

                }
            </div>

            {showFileDialog &&
                <div className={styles.filesDialog}>
                    <div className={styles.filesDialogHeader}>
                        <p className={styles.fileDialogHeaderHeading}>Task files</p>
                        <button onClick={() => setShowFileDialog(false)} className={styles.cancelFileDialogButton}><img src='/Cross.png' alt='Close button' /></button>
                    </div>
                    <div className={styles.fileDialogBottom}>
                        {/* showing files map with the download button with their names  */}
                        {
                            filesToShow && Object.keys(filesToShow).length > 0 ?
                                <div>
                                    <div className={styles.filesColumn}>
                                        {Object.keys(filesToShow).map((fileName, index) => (
                                            <div key={index} className={styles.fileRow}>
                                                <p className={styles.fileName}>{fileName}</p>
                                                <button className={styles.downloadFileButton} onClick={() => downloadFile(filesToShow[fileName])}><img src="/download.png" /></button>
                                            </div>
                                        ))}
                                    </div>

                                </div>
                                :
                                <div>
                                    <p className={styles.noFileExist}>No files to show!</p>
                                </div>
                        }
                    </div>
                </div>
            }

        </main>
    );
}