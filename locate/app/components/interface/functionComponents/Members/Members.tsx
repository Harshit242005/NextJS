

import { useState, useEffect, SetStateAction, useRef } from "react"
import { useGlobalProjectIdContext } from "@/app/context/projectId"
import { useGlobalUidContext } from "@/app/context/uid"
import { firestore } from "@/app/firebase"
import { where, doc, getDoc, collection, query, onSnapshot, getDocs, orderBy, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import styles from './members.module.css';
import Image from "next/image"
import axios from "axios"
import Success from "../../../Animations/Success";


// group chat message 
interface messageDoc {
    messageDoc: string;
    docData: {
        From: string;
        Message: string;
        TimeStamp: string;
        ViewedBy: string[];
        Date: string;
    }
}

// normal message 
interface normalMessageDoc {
    messageDocId: string;
    docData: {
        From: string;
        To: string;
        MessageText: string;
        Timestamp: string;
        Status: boolean;
        Date: string;
    }
}


// reference document
interface TaskDocument {
    DocId: string;
    TaskName: string;
    Deadline: string;
}


// users data
interface userData {
    Name: string;
    ImageUrl: string;
    Uid: string;
    Status: boolean;
}

interface MemberFunctionProps {
    setOpenMessage: React.Dispatch<React.SetStateAction<boolean>>;
    setCurrentComponenet: React.Dispatch<React.SetStateAction<string>>;
    setTaskId: React.Dispatch<React.SetStateAction<string>>;
    setMessageUid: React.Dispatch<React.SetStateAction<string>>;
    messageUid: string;
    openMessage: boolean;
    openMessageMenu: boolean;
    setOpenMessageMenu: React.Dispatch<React.SetStateAction<boolean>>;
    RemoveMessage: () => void;
}

export default function Members({ RemoveMessage, setOpenMessage, setTaskId, messageUid, setCurrentComponenet, openMessageMenu, setOpenMessageMenu, setMessageUid, openMessage }: MemberFunctionProps) {
    const { projectId, projectName, projectCreator, setProjectId, setProjectCreator, setProjectName } = useGlobalProjectIdContext();
    const { uid, email, setUid, setEmail, } = useGlobalUidContext();

    const [showCompletedTask, setShowCompletedTask] = useState<boolean>(false);
    const [showPopupMessage, setShowPopupMessage] = useState<string>('');


    useEffect(() => {
        // Retrieve user data from localStorage if it exists
        if (typeof window !== 'undefined') {
            const storedUid = localStorage.getItem('UserUid');
            const storedEmail = localStorage.getItem('UserEmail');
            setProjectId(localStorage.getItem('ProjectId') || '');
            setProjectName(localStorage.getItem('ProjectName') || '');
            setProjectCreator(localStorage.getItem('ProjectCreator') || '');

            if (storedUid) {
                setUid(storedUid);
                setEmail(storedEmail || '');


            }
        }
    }, []);


    const [users, setUsers] = useState<userData[]>([]);
    const [selectedButton, setSelectedButton] = useState(projectName);
    const [taskDocument, setTaskDocument] = useState<TaskDocument | null>(null);
    const [messageText, setMessageText] = useState<string>('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [chatMessages, setChatMessages] = useState<messageDoc[]>([]);


    const [enableSelectChats, setEnableSelectChats] = useState<boolean>(false);
    const [openMessageFunctionButtons, setOpenMessageFunctionButtons] = useState<boolean>(false);
    const [normalChatMessages, setNormalChatMessages] = useState<normalMessageDoc[]>([]);
    const [messageCollectionId, setMessageCollectionId] = useState('');


    const [otherPersonImageUrl, setOtherPersonImageUrl] = useState('');
    const [openMobileChatMenu, setOpenMobileChatMenu] = useState<boolean>(false);
    // const normalMessageIdsSet = new Set<string>();



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const message = e.target.value;
        setMessageText(message);
        chatTyping(message);
    };


    useEffect(() => {


        const q = query(
            collection(firestore, 'GroupChat'),
            where('ProjectId', '==', projectId),
            orderBy('Date', 'asc')
        );



        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const messages: messageDoc[] = [];
            snapshot.forEach((doc: any) => {
                // here to include the viewed by update check conditon if the uid does not exist in the ViewedBy list then add it inside 
                messages.push({
                    messageDoc: doc.id,
                    docData: doc.data() as messageDoc['docData']
                });

                // autoscroll the chat box div 
                const messageBox = document.getElementById('messageBox');
                if (messageBox) {
                    messageBox.scrollTop = messageBox.scrollHeight;
                }

            });

            // should add a for loop to iterate over the array to get the new userId added in the chatmessage viewedby
            for (const message of messages) {
                const viewed_by = message.docData.ViewedBy || [];
                const original_viewed_by = message.docData.ViewedBy || [];
                const message_from = message.docData.From;
                if (uid && !viewed_by.includes(uid) && message_from != uid) {
                    viewed_by.push(uid);
                }

                // if the change data does not change then you should not update it and thus can reduce the write operations

                if (original_viewed_by != viewed_by) {
                    // update the message in the Firestore core itself
                    const docRef = doc(firestore, 'GroupChat', message.messageDoc);
                    updateDoc(docRef, { ViewedBy: viewed_by });
                }

            }



            setChatMessages(messages);
            // console.log(chatMessages);




            // store the message in the dict and then in the useState hook
            const isReference: { [key: string]: boolean } = {};
            for (const message of messages) {
                const result = checkMessageForReference(message.docData.Message);
                if (result) {
                    checkMessageText(message.messageDoc, message.docData.Message);
                    isReference[message.messageDoc] = true;
                }
            }

            // set the boolean state
            setIsReferenceMessage(isReference);


            // Fetch viewedBy images for each message
            for (const message of messages) {
                await fetchViewedByImages(message.messageDoc, message.docData.ViewedBy);
            }
        });





        const getUsersData = () => {
            // getting the members ids first
            const docRef = doc(firestore, 'Projects', projectId);
            getDoc(docRef).then((document) => {
                if (document.exists()) {
                    const memberIds = document.data().members || [];
                    // console.log(memberIds);
                    const filteredMemberIds = memberIds.filter((memberId: any) => memberId !== uid);
                    // console.log('Filtered members of the projects are', filteredMemberIds);

                    const users_data: userData[] = [];
                    let completedRequests = 0;

                    filteredMemberIds.forEach((id: string) => {
                        const memberQuery = query(collection(firestore, 'Users'), where('Uid', '==', id));

                        onSnapshot(memberQuery, (querySnapshot) => {
                            querySnapshot.forEach((doc) => {
                                const userDoc = doc.data();
                                const userData: userData = {
                                    Name: userDoc.Name,
                                    ImageUrl: userDoc.ImageUrl,
                                    Uid: userDoc.Uid,
                                    Status: userDoc.Status,
                                };

                                // Add user data to users_data array if not already present
                                if (!users_data.some((user) => user.Uid === userData.Uid)) {
                                    users_data.push(userData);
                                }
                            });

                            // Increment the completedRequests counter and check if all requests are done
                            completedRequests += 1;
                            if (completedRequests === filteredMemberIds.length) {
                                // console.log(users_data);
                                setUsers(users_data);
                                // console.log('All users:', users_data);
                            }
                        });
                    });

                } else {
                    console.log('Project does not exist');
                }
            });
        };

        // clean up the listner after unmounting the component

        if (messageUid != '') {
            unsubscribe();
        }


        getUsersData();




    }, [projectId, projectName, messageUid]); // Listen for changes in projectId



    const messageBoxRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef<boolean>(false);



    useEffect(() => {

        // autoscroll the chat box div 
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.scrollTop = messageBox.scrollHeight;
        }

    }, [chatMessages]);

    useEffect(() => {
        // autoscroll the chat box div 
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.scrollTop = messageBox.scrollHeight;
        }
    }, [normalChatMessages]);




    const handleScroll = () => {

        const messageBox = document.getElementById('messageBox');

        if (messageBox) {
            const isAtBottom = messageBox.scrollHeight - messageBox.scrollTop === messageBox.clientHeight;
            isAtBottomRef.current = isAtBottom;
        }
    };

    useEffect(() => {
        // autoscroll the chat box div 
        const messageBox = document.getElementById('messageBox');

        if (messageBox) {

            messageBox.addEventListener('scroll', handleScroll);

            return () => {
                messageBox.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);


    function getCurrentDate() {
        const currentDate = new Date();
        return currentDate.toISOString(); // returns the date in ISO 8601 format
    }

    // function for formatting the document 
    const formatDate = (dateString: string) => {
        const options: any = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // grouping the messages with the date 
    const groupMessagesByDate = (messages: messageDoc[]) => {
        const groupedMessages: { [key: string]: messageDoc[] } = {};

        messages.forEach(message => {
            const date = formatDate(message.docData.Date);
            if (!groupedMessages[date]) {
                groupedMessages[date] = [];
            }
            groupedMessages[date].push(message);
        });

        return groupedMessages;
    };

    const groupedMessages = groupMessagesByDate(chatMessages);
    const closeTaskReference = () => {
        setTaskDocument(null);
    }

    const sendMessage = async () => {
        if (messageText.trim() !== "") {
            const currentTime = new Date();
            const hours = String(currentTime.getHours()).padStart(2, '0');
            const minutes = String(currentTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            const currentDate = getCurrentDate() // function to get current date

            // Add the message
            const messageData = {
                'From': uid,
                'Message': messageText.trim(),
                'TimeStamp': formattedTime,
                'ViewedBy': [],
                'Date': currentDate,
                'ProjectId': projectId
            };

            const collectionRef = collection(firestore, 'GroupChat');
            await addDoc(collectionRef, messageData);

        }
        closeTaskReference();
        if (taskDocument) {
            setTaskDocument(null);
        }
        setMessageText('');

        // autoscroll the chat box div 
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.scrollTop = messageBox.scrollHeight;
        }


    };


    useEffect(() => {
        if (!messageCollectionId) {
            console.log('messages collection ref id does not exist');
        }; // If messageCollectionId is not set, don't run the effect

        const messagesRef = query(
            collection(firestore, 'Messages'),
            where('ChatRefId', '==', messageCollectionId),
            orderBy('Date', 'asc')
        );

        console.log('calling the messages from the chat reference');
        const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
            console.log('calling unsubscribe');

            const messages: normalMessageDoc[] = [];
            snapshot.forEach(async (document) => {
                if (!document.data()['Status']) {
                    const messageChatDocRef = doc(firestore, 'Messages', document.id);
                    await updateDoc(messageChatDocRef, { Status: true });
                }

                messages.push({
                    messageDocId: document.id,
                    docData: document.data() as normalMessageDoc['docData']
                });
            });
            console.log(messages);
            setNormalChatMessages(messages);
        });

        const getOtherPersonImageUrl = async () => {

            const q = query(collection(firestore, 'Users'), where('Uid', "==", messageUid));

            const usersDocs = await getDocs(q);

            if (!usersDocs.empty) {
                const userImage = usersDocs.docs[0].data().ImageUrl;
                setOtherPersonImageUrl(userImage);
            }

        }

        // Cleanup function to unsubscribe from snapshot listener
        return () => {
            unsubscribe();
            getOtherPersonImageUrl();
        }
    }, [messageCollectionId, messageUid]);



    const OpenChat = async (fromUid: string) => {
        console.log('calling open chat');
        const chatCollectionRef = query(collection(firestore, 'Chats'), where('Members', 'array-contains-any', [fromUid, uid]));
        const getChatCollection = await getDocs(chatCollectionRef);
        let foundMessageCollectionId = '';

        if (!getChatCollection.empty) {
            getChatCollection.forEach((doc) => {
                const memberArray = doc.data().Members;
                console.log(memberArray);
                if (memberArray && memberArray.includes(fromUid) && memberArray.includes(uid)) {
                    foundMessageCollectionId = doc.id;
                    console.log(foundMessageCollectionId);
                    setMessageCollectionId(foundMessageCollectionId);
                }
            });
        }

        if (!foundMessageCollectionId) {
            // Create a new chat document if it doesn't exist
            const newChatDocRef = await addDoc(collection(firestore, 'Chats'), {
                Members: [fromUid, uid]
            });

            const newChatDocId = newChatDocRef.id;
            setMessageCollectionId(newChatDocId);
        }
    };

    useEffect(() => {
        if (messageUid) {
            OpenChat(messageUid);
        }
    }, [messageUid]);

    const AddMessageTab = async (Uid: string, index_number: number) => {
        console.log(Uid, index_number, selectedIndex);
        if (index_number == selectedIndex) {
            setSelectedIndex(null);
            setMessageUid('');
            // console.log(messageUid, selectedIndex);
            setMessageCollectionId('');

        }
        else {
            setSelectedIndex(index_number);
            setMessageUid(Uid);

            // // check for if the document exist in the chats collection 
            // await OpenChat(Uid);
        }

        setSelectedMessages([]);
        setEnableSelectChats(false);


        // close the chat options
        if (isMobile) {
            setOpenMobileChatMenu(!openMobileChatMenu);
        }
    }


    // switch to the group chat
    const addProjectChat = () => {
        setSelectedIndex(null);
        // setOpenMessage(true);
        // setting up the new call up
        setMessageUid('');
        if (isMobile) {
            setOpenMobileChatMenu(!openMobileChatMenu);
        }
    }


    const chatTyping = async (message: string) => {
        const regex = /@\w+-\w+-\w+-\w+-\w+/g;
        const matches = message.match(regex);
        // console.log(matches);
        if (matches) {
            const id = matches[0].slice(1); // Extract the first matched ID without the @

            const docRef = query(collection(firestore, 'Tasks'), where('TaskID', "==", id));
            const querySnapshot = await getDocs(docRef);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                const docData = doc.data();
                console.log(docData);
                const fetchedTask: TaskDocument = {
                    DocId: doc.id,
                    TaskName: docData['Heading'],
                    Deadline: docData['Deadline']
                };
                setTaskDocument(fetchedTask); // Store the fetched document in the state
            }
        }
    };



    const [storeMessageForReference, setStoreMessageForReference] = useState<{ [key: string]: string[] }>({});
    // a useState hook based dict to store the boolean value with the message doc id and the nature of being a reference either true or false 
    const [isReferenceMessage, setIsReferenceMessage] = useState<{ [key: string]: boolean }>({}); // docId: boolean result 



    const fetchTaskDetails = async (taskId: string) => {
        const docRef = query(collection(firestore, 'Tasks'), where('TaskID', "==", taskId));
        const querySnapshot = await getDocs(docRef);

        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const docData = doc.data();
            return [docData['Heading'], taskId]; // Return the heading and the task ID
        }
        return [];
    };

    const checkMessageForReference = (chatMessage: string) => {
        const regex = /\b\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\b/g; // Updated regex to match UUIDs
        const matches = chatMessage.match(regex);
        if (matches) {
            return true;
        }
        return false;
    }

    const checkMessageText = async (messageDocId: string, chatMessage: string) => {
        const regex = /\b\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\b/g; // Updated regex to match UUIDs
        const matches = chatMessage.match(regex);
        if (matches) {


            // Extract the task ID from the matches array
            const taskId = matches[0]; // No need to remove '@' character

            // Fetch task details
            const taskDetails = await fetchTaskDetails(taskId);

            if (taskDetails.length > 0) {
                setStoreMessageForReference((prev) => ({
                    ...prev,
                    [messageDocId]: taskDetails
                }));
            }
        }
    };

    const [senderImages, setSenderImages] = useState<{ [key: string]: string }>({});
    const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
    // to store the doc id for the messages with the url
    const [viewedByImages, setViewedByImages] = useState<{ [key: string]: string[] }>({});


    const fetchViewedByImages = async (docId: string, viewedBy: string[]) => {
        const imageUrls: string[] = await Promise.all(viewedBy.map(async (userId) => {
            const docRef = query(collection(firestore, 'Users'), where('Uid', "==", userId));
            const docSnapshot = await getDocs(docRef);
            if (!docSnapshot.empty) {
                const docData = docSnapshot.docs[0].data();
                return docData['ImageUrl'];
            }
            return '';
        }));

        setViewedByImages((prev) => ({ ...prev, [docId]: imageUrls }));
    }



    const getSenderImage = async (senderId: string) => {
        if (senderImages[senderId]) {
            return senderImages[senderId];
        }
        const docRef = query(collection(firestore, 'Users'), where('Uid', "==", senderId));
        const docSnapshot = await getDocs(docRef);
        if (!docSnapshot.empty) {
            const docData = docSnapshot.docs[0].data();
            const imageUrl = docData['ImageUrl'];
            setSenderImages((prev) => ({ ...prev, [senderId]: imageUrl }));
            return imageUrl;
        }
        return '';
    }

    const getSenderName = async (senderId: string) => {
        if (senderNames[senderId]) {
            return senderNames[senderId];
        }
        const docRef = query(collection(firestore, 'Users'), where('Uid', "==", senderId));
        const docSnapshot = await getDocs(docRef);
        if (!docSnapshot.empty) {
            const docData = docSnapshot.docs[0].data();
            const name = docData['Name'];
            setSenderNames((prev) => ({ ...prev, [senderId]: name }));
            return name;
        }
        return '';
    }

    useEffect(() => {
        const fetchData = async () => {
            const senderIds = chatMessages.map(msg => msg.docData.From);
            for (const senderId of senderIds) {
                await getSenderImage(senderId);
                await getSenderName(senderId);
            }



        };

        fetchData();
    }, [chatMessages]);


    const [OpenViewedBy, setOpenViewedBy] = useState(false);
    // Create a new useState for the for the dict view personImageUrl: name from his doc
    const [viewedBy, setViewedBy] = useState<{ [key: string]: string }>({});
    // function to open the message viewed div for the peoples
    const openViewedBy = async (viewedByUrls: string[]) => {
        setOpenViewedBy(true);
        const viewedByUrlDict: { [key: string]: string } = {};
        for (const viewedByUrl of viewedByUrls) {
            const docRef = query(collection(firestore, 'Users'), where('ImageUrl', "==", viewedByUrl));
            const docSnaphsot = await getDocs(docRef);
            if (!docSnaphsot.empty) {
                const docData = docSnaphsot.docs[0].data();
                viewedByUrlDict[viewedByUrl] = docData['Name']
            }
        }

        setViewedBy(viewedByUrlDict);
    }

    const closeViewedBy = () => {
        setViewedBy({});
        setOpenViewedBy(false);
    }

    // function to navigate to the next Page
    const navigateToTask = (docData: string[]) => {
        // console.log(docData);


        const taskId = docData[1];
        setTaskId(taskId);
        setCurrentComponenet('Task'); // set the current component blank
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



    const [messageImageUrl, setMessagUserImageUrl] = useState<string>('');
    const [messageName, setMessageUserName] = useState<string>('');
    const [messageUserStatus, setMessageUserStatus] = useState<boolean>(false);
    const [showDeleteButton, setShowDeleteButton] = useState<boolean>(false);

    // let's check how can i set up the value
    useEffect(() => {
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


    const shiftMobileChatSidebar = () => {


        if (openMobileChatMenu == true) {
            setOpenMobileChatMenu(false);
        }
        else {
            setOpenMobileChatMenu(true);
        }

    }




    // grouping the messages with the date 
    const groupNormalMessagesByDate = (messages: normalMessageDoc[]) => {
        const groupedMessages: { [key: string]: normalMessageDoc[] } = {};

        messages.forEach(message => {
            const date = formatDate(message.docData.Date);
            if (!groupedMessages[date]) {
                groupedMessages[date] = [];
            }
            groupedMessages[date].push(message);
        });

        return groupedMessages;
    };

    const normalMessages = groupNormalMessagesByDate(normalChatMessages);


    const sendNormalMessage = async () => {
        if (messageText.trim() !== "") {
            const currentTime = new Date();
            const hours = String(currentTime.getHours()).padStart(2, '0');
            const minutes = String(currentTime.getMinutes()).padStart(2, '0');
            const formattedTime = `${hours}:${minutes}`;

            const currentDate = getCurrentDate() // function to get current date

            // Add the message
            const messageData = {
                'From': uid,
                'To': messageUid,
                'MessageText': messageText.trim(),
                'Timestamp': formattedTime,
                'Status': false,
                'Date': currentDate,
                'ChatRefId': messageCollectionId
            };

            const collectionRef = collection(firestore, 'Messages');
            await addDoc(collectionRef, messageData);
            setMessageText('');

            // autoscroll the chat box div 
            const messageBox = document.getElementById('messageBox');
            if (messageBox) {
                messageBox.scrollTop = messageBox.scrollHeight;
            }

        }
    };


    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);


    const SelectMessage = (fromUid: string, docId: string) => {
        if (fromUid === uid) {
            if (!selectedMessages.includes(docId)) {
                setSelectedMessages([...selectedMessages, docId]);
            } else {
                // filter out the doc id from the messages that has been selected 
                const filteredMessages = selectedMessages.filter((id) => id !== docId);
                setSelectedMessages(filteredMessages);
            }
        }
    };


    // Handler for single click
    const handleSingleClick = (fromUid: string, docId: string) => {
        console.log('handle click for chat is clicked', enableSelectChats, selectedMessages);
        if (enableSelectChats) {
            SelectMessage(fromUid, docId);
        }

    };


    const DeleteSelectedChats = async () => {
        console.log(selectedMessages);
        // delete the selected chats
        for (const deleteMessageId of selectedMessages) {
            console.log(deleteMessageId);
            const docRef = doc(firestore, 'Messages', deleteMessageId);
            await deleteDoc(docRef);
        }

        setSelectedMessages([]);
        setEnableSelectChats(false);
        setOpenMessageFunctionButtons(false);

        // show popup for the successful delete message

        setShowCompletedTask(true);
        setShowPopupMessage('Request already sent sucessfully');
        setTimeout(() => {
            setShowCompletedTask(false)
            setShowPopupMessage('');
        }, 1000);
    }


    const enableChatSelection = () => {
        setEnableSelectChats(!enableSelectChats);
        setOpenMessageFunctionButtons(false);
    }


    const RemoveUser = async () => {
        // removing the chat collection and chats involved with that collction and removing the user from the members and from his projects list as well
        // getting collection id 
        const chatCollectionRef = query(collection(firestore, 'Chats'), where('Members', 'array-contains-any', [messageUid, uid]));
        const getChatCollection = await getDocs(chatCollectionRef);
        let foundMessageCollectionId = '';

        if (!getChatCollection.empty) {
            getChatCollection.forEach((doc) => {
                const memberArray = doc.data().Members;
                console.log(memberArray);
                if (memberArray && memberArray.includes(messageUid) && memberArray.includes(uid)) {
                    foundMessageCollectionId = doc.id;
                    console.log(foundMessageCollectionId);

                }
            });
        }

        // remove all the docs from the Messages collection which includes this collection id 
        const messagesRef = query(collection(firestore, 'Messages'), where("ChatRefId", "==", foundMessageCollectionId));
        const messageSnapshot = await getDocs(messagesRef);
        if (!messageSnapshot.empty) {
            messageSnapshot.forEach(async (document) => {
                const docRef = doc(firestore, 'Messages', document.id);
                await deleteDoc(docRef);
            });
        }


        // remove the chat collection as well
        const chatCoollectionSnap = doc(firestore, 'Chats', foundMessageCollectionId);
        await deleteDoc(chatCoollectionSnap);


        // reomve user id from the members
        const projectDoc = doc(firestore, 'Projects', projectId);
        const projectDocSnap = await getDoc(projectDoc);
        if (projectDocSnap.exists()) {
            const project_members = projectDocSnap.data().members || [];
            const filter_members = project_members.filter((id: string) => id !== messageUid)
            await updateDoc(projectDoc, { members: filter_members });
        }


        let userEmail = '';
        // filter the user doument to remove the project name from the projects list of the user
        const userQuery = query(collection(firestore, 'Users'), where('UserId', "==", messageUid));
        const userDocs = await getDocs(userQuery);
        if (!userDocs.empty) {
            const user_projects = userDocs.docs[0].data()['Projects'];
            userEmail = userDocs.docs[0].data()['Email'];
            const filter_projects = user_projects.filter((project_name: string) => project_name !== projectName);
            await updateDoc(user_projects.docs[0].id, { Projects: filter_projects });
        }

        // send an axios email for the removal of the projects
        const send_removal_email_response = await axios.post('https://fern-ivory-lint.glitch.me/removeMember', {
            ownerEmail: email, MemberEmail: userEmail, projectName: projectName
        });
        console.log(send_removal_email_response);
    }


    return (
        <main className={styles.ChatInterface}>
            {/* need to develop a header in this */}
            {
                isMobile ?
                    <div className={styles.selectMemberOption}>
                        {/* selected member should be shown here in this  */}
                        {messageUid != "" ?
                            <div className={styles.messageHeaderMenuRow}>
                                <div className={styles.messageHeaderData} onClick={shiftMobileChatSidebar} >

                                    <div className={styles.messageUserStatus}>

                                        <img className={styles.messageImage} src={messageImageUrl} alt="message user image" />

                                        <div className={`${messageUserStatus ? styles.activeMessageUser : styles.inactiveMessageUser}`}></div>

                                    </div>

                                    <p className={styles.messageUserName}>{messageName}</p>
                                </div>


                                {/* menu button for the member */}
                                <button onClick={() => setOpenMessageFunctionButtons(!openMessageFunctionButtons)} className={styles.menuButtonMessage}><img src="/MenuVertical.png" alt="Menu button" /></button>
                            </div>
                            :
                            <p onClick={shiftMobileChatSidebar} className={styles.projectNameButtonSwitch}>{projectName}</p>
                        }
                    </div>
                    :
                    <div>

                    </div>
            }

            <div className={styles.rowStructure}>
                {/* dividing the two section from this part */}
                <div className={`${styles.LeftContainer} ${isMobile && openMobileChatMenu ? styles.openUp : styles.closeUp}`}>
                    <button onClick={addProjectChat} className={`${styles.chatButton} ${selectedButton == projectName ? styles.activeChat : styles.inactiveChats}`}>{projectName}</button>

                    {/* member data would be here to show in the chat */}
                    {
                        users.length > 0 ?
                            <div className={styles.members}>

                                {users.map((user, index) => (

                                    <div key={user.Uid} className={`${index == selectedIndex ? styles.selectedMemberRow : styles.MemberRow}`}>

                                        <div className={styles.memberData} onClick={() => AddMessageTab(user.Uid, index)}>

                                            <div className={styles.userStatusRow}>
                                                <img className={styles.userImage} src={user.ImageUrl} alt={user.Name} />
                                                <div className={`${user.Status ? styles.active : styles.inactive}`}></div>
                                            </div>

                                            <p className={styles.userName}>{user.Name}</p>

                                        </div>

                                        {!isMobile && index == selectedIndex && <button onClick={() => setOpenMessageFunctionButtons(!openMessageFunctionButtons)} className={styles.messageMenuButton}><Image src="../../MenuVerticalWhite.svg" width={25} height={25} alt="vertical menu icon" /></button>}
                                    </div>

                                ))}

                            </div> :
                            <div>
                                <p className={styles.noMember}>No Member exist yet</p>
                            </div>
                    }

                </div>

                {
                    messageUid == '' ?
                        <div className={styles.RightContainer}>


                            {/* task document to include styles for the reference task based input box */}

                            {/* adding here the conditional statment for the appication to load group message feature or the new peer to 
                            peer normal messages  */}

                            <div id="messageBox" ref={messageBoxRef} onScroll={handleScroll} className={` ${taskDocument ? styles.chatReferenceCreated : styles.chatBox}`}>

                                {
                                    groupedMessages ?
                                        Object.keys(groupedMessages).map(date => (

                                            <div key={date}>

                                                <div className={styles.dateHeader}>{date}</div>

                                                {groupedMessages[date].map((message) => (

                                                    <div style={{ marginTop: 10 }} key={message.messageDoc} className={`${message.docData.From === uid ? styles.myMessage : styles.otherMessage} ${isReferenceMessage[message.messageDoc] ? styles.referenceMessage : styles.normalMessage}`} id={message.messageDoc}>
                                                        {isReferenceMessage[message.messageDoc] ?
                                                            /* styling and data for the reference message */
                                                            <div>

                                                                {message.docData.From != uid ?
                                                                    // styles for the text which are not sent by me 
                                                                    <div className={styles.referenceMessageOther} onClick={() => navigateToTask(storeMessageForReference[message.messageDoc])}>
                                                                        {/* data to hold for the reference */}
                                                                        <div className={styles.referenceMessageHeader}>
                                                                            {storeMessageForReference[message.messageDoc] && (
                                                                                <div className={styles.taskDetails}>
                                                                                    {storeMessageForReference[message.messageDoc].map((detail, index) => (
                                                                                        <p style={{ fontWeight: '400' }} key={index}>{detail}</p>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {/* message data */}
                                                                        {/* here would hold the message and viewed by and the sent time */}
                                                                        <div className={styles.referenceMessageBottom}>
                                                                            <div className={styles.normalMessageHeader}>
                                                                                {senderImages[message.docData.From] && <img className={styles.noramlMessageHeaderImage} src={senderImages[message.docData.From]} alt="Sender profile picture" />}
                                                                                <p className={styles.senderName}>{senderNames[message.docData.From]}</p>
                                                                            </div>
                                                                            <p>{message.docData.Message}</p>
                                                                            <div className={styles.normalMessageBottom}>
                                                                                <div className={styles.viewedByImagesCollection}>
                                                                                    {/* list to show the message is viewed by the person as image */}
                                                                                    {viewedByImages[message.messageDoc] && (
                                                                                        <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                                            {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                                                <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <p className={styles.messageTimestamp}>{message.docData.TimeStamp}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    :
                                                                    // styles for the text which is sent by me
                                                                    <div className={styles.referenceMessageMy}>
                                                                        <div className={styles.referenceMessageHeader} onClick={() => navigateToTask(storeMessageForReference[message.messageDoc])}>
                                                                            {storeMessageForReference[message.messageDoc] && (
                                                                                <div className={styles.taskDetails}>
                                                                                    {storeMessageForReference[message.messageDoc].map((detail, index) => (
                                                                                        <p style={{ fontWeight: '400', color: 'black' }} key={index}>{detail}</p>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className={styles.referenceMessageBottom}>
                                                                            <p className={styles.myReferenceMessage}>{message.docData.Message}</p>
                                                                            <div className={styles.normalMyMessageBottom}>
                                                                                <p className={styles.messageTimestampMyReference}>{message.docData.TimeStamp}</p>
                                                                                <div className={styles.viewedByImagesCollection}>
                                                                                    {/* list to show the message is viewed by the person as image */}
                                                                                    {viewedByImages[message.messageDoc] && (
                                                                                        <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                                            {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                                                <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                                            ))}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                }

                                                            </div>
                                                            :
                                                            /* styling and data for the normal message  */
                                                            <div>
                                                                {message.docData.From != uid ?
                                                                    // message send by someone else in thre group
                                                                    <div style={{ padding: 10 }}>
                                                                        <div className={styles.normalMessageHeader}>
                                                                            {senderImages[message.docData.From] && <img className={styles.noramlMessageHeaderImage} src={senderImages[message.docData.From]} alt="Sender profile picture" />}
                                                                            <p className={styles.senderName}>{senderNames[message.docData.From]}</p>
                                                                        </div>
                                                                        <p>{message.docData.Message}</p>
                                                                        <div className={styles.normalMessageBottom}>
                                                                            <div className={styles.viewedByImagesCollection}>
                                                                                {/* list to show the message is viewed by the person as image */}
                                                                                {
                                                                                    viewedByImages[message.messageDoc] && (
                                                                                        <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                                            {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                                                <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                                            ))}
                                                                                        </div>
                                                                                    )
                                                                                }
                                                                            </div>
                                                                            <p className={styles.messageTimestamp}>{message.docData.TimeStamp}</p>
                                                                        </div>
                                                                    </div>
                                                                    :
                                                                    // message sent by me should be 
                                                                    <div style={{ marginRight: 25, padding: 10 }}>
                                                                        <p>{message.docData.Message}</p>
                                                                        <div className={styles.normalMyMessageBottom}>
                                                                            <p className={styles.messageTimestamp}>{message.docData.TimeStamp}</p>
                                                                            <div className={styles.viewedByImagesCollection}>
                                                                                {/* list to show the message is viewed by the person as image */}
                                                                                {viewedByImages[message.messageDoc] && (
                                                                                    <div className={styles.viewedByImages} onClick={() => openViewedBy(viewedByImages[message.messageDoc])}>
                                                                                        {viewedByImages[message.messageDoc].map((imageUrl, index) => (
                                                                                            <img className={styles.viewedByImage} key={index} src={imageUrl} alt="Viewed by user profile picture" />
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                        </div>
                                                                    </div>
                                                                }
                                                            </div>
                                                        }
                                                    </div>

                                                ))}

                                            </div>

                                        )) : <p className={styles.noMember}>No chat Messages</p>
                                }


                            </div>

                            {/* chat input */}
                            <div className={`${taskDocument ? styles.chatInputReference : styles.chatInput}`}>

                                {/* create a function on the inout to make the chat up and look for the reference id */}
                                <div className={styles.chatMessageReference}>

                                    {
                                        taskDocument ?
                                            <div className={styles.referenceDiv}>



                                                <div className={styles.referenceData}>

                                                    <p className={styles.referenceTaskName}>{taskDocument.TaskName}</p>
                                                    <p className={styles.referenceTaskId}>{taskDocument.DocId}</p>

                                                </div>

                                                <button className={styles.cancelReferenceButton} onClick={closeTaskReference}><img src="/Cross.png" alt="Close icon" /></button>


                                            </div>
                                            :
                                            <div>

                                            </div>
                                    }

                                    <input className={styles.chatMessageInputBox} value={messageText} onChange={handleInputChange} type="text" placeholder="Type message..." />

                                </div>

                                <button onClick={sendMessage} className={styles.sendChatButton}>Send</button>
                            </div>



                        </div> :

                        // this is for the normal peer to peer chats messages  
                        <div className={styles.RightContainer}>
                            <div className={styles.chatBox} id="messageBox" ref={messageBoxRef} onScroll={handleScroll}>



                                {
                                    normalChatMessages.length != 0 ?
                                        Object.keys(normalMessages).map(date => (
                                            <div key={date}>
                                                <div className={styles.normalDateHeader}>{date}</div>
                                                {normalMessages[date].map((message) => (
                                                    <div style={{ marginTop: 10 }} key={message.messageDocId}
                                                        onClick={() => handleSingleClick(message.docData.From, message.messageDocId)}

                                                        className={`${selectedMessages.includes(message.messageDocId) ? styles.myNormalSelectedMessage : message.docData.From == uid ? styles.myNormalMessage : styles.otherNormalMessage}`} id={message.messageDocId}>
                                                        <p>{message.docData.MessageText}</p>
                                                        <div className={`${message.docData.From === uid ? styles.myChatMessageData : styles.chatMessageData}`}>
                                                            <p>{message.docData.Timestamp}</p>
                                                            {message.docData.Status && message.docData.From === uid ? <img className={styles.otherPersonImage} src={messageImageUrl} alt="Other person image" /> : ''}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )

                                        ) : <p className={styles.noMember}>No messsages</p>
                                }


                            </div>
                            {/* now load the peer to peer mssages  */}
                            <div className={`${taskDocument ? styles.chatInputReference : styles.chatInput}`}>

                                {/* create a function on the inout to make the chat up and look for the reference id */}
                                <div className={styles.chatMessageReference}>

                                    {
                                        taskDocument ?
                                            <div className={styles.referenceDiv}>



                                                <div className={styles.referenceData}>

                                                    <p className={styles.referenceTaskName}>{taskDocument.TaskName}</p>
                                                    <p className={styles.referenceTaskId}>{taskDocument.DocId}</p>

                                                </div>

                                                <button className={styles.cancelReferenceButton} onClick={closeTaskReference}><img src="/Cross.png" alt="Close icon" /></button>


                                            </div>
                                            :
                                            <div>

                                            </div>
                                    }

                                    <input className={styles.chatMessageInputBox} value={messageText} onChange={handleInputChange} type="text" placeholder="Type message..." />

                                </div>

                                <button onClick={sendNormalMessage} className={styles.sendChatButton}>Send</button>
                            </div>
                            {/* <Chat messageUid={messageUid} RemoveMessage={RemoveMessage} setOpenMessage={setOpenMessage} openMessageMenu={openMessageMenu} openMessage={openMessage} /> */}
                        </div>
                }
            </div>


            {
                openMessageFunctionButtons &&
                <div className={styles.chatFunctionsDialog}>
                    {
                        projectCreator == uid ?
                            <div className={styles.chatFunctionButtons}>
                                <button onClick={RemoveUser} className={styles.chatFunctionButton}>Remove User</button>
                                <button onClick={DeleteSelectedChats} className={styles.chatFunctionButton}>Delete Chats</button>
                                <button onClick={enableChatSelection} className={styles.chatFunctionButton}>{enableSelectChats ? 'Disable Selection' : 'Enable Selection'}</button>
                            </div> :
                            <div className={styles.chatFunctionButtons}>
                                <button onClick={DeleteSelectedChats} className={styles.chatFunctionButton}>Delete Chats</button>
                                <button onClick={enableChatSelection} className={`${enableSelectChats ? styles.enableChatFunctionButton : styles.chatFunctionButton}`}>{enableSelectChats ? 'Disable Selection' : 'Enable Selection'}</button>
                            </div>
                    }
                </div>
            }



            {
                OpenViewedBy &&
                <div className={styles.viewedByDiv}>
                    {/* show up the viewed by dict for the users  */}
                    <div className={styles.viewedByDivHeader}><p className={styles.viewedByHeaderHeading}>Viewed By</p><button className={styles.viewedByCloseButton} onClick={closeViewedBy}><img src="/Cross.png" alt="close button icon" /></button></div>
                    <div className={styles.viewedByColumn}>
                        {Object.entries(viewedBy).map(([url, name]) => (
                            <div key={url} className={styles.viewedByItem}>
                                <img src={url} alt={name} className={styles.viewedByItemImage} />
                                <p className={styles.viewedByItemName}>{name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            }

            

            {
                showCompletedTask &&
                <Success successMessage={showPopupMessage} />
            }


        </main >
    );
}
