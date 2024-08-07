'use client'
interface MemberFunctionProps {
    setOpenMessage: React.Dispatch<React.SetStateAction<boolean>>;
    openMessage: boolean;
    messageUid: string;

    openMessageMenu: boolean;
    RemoveMessage: () => void;
}

interface messageDoc {
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

import { useState, useEffect, useRef } from "react";
import styles from './chat.module.css';
import { useGlobalUidContext } from "@/app/context/uid";
import { useGlobalProjectIdContext } from "@/app/context/projectId";
import { firestore } from "@/app/firebase";
import { collection, addDoc, onSnapshot, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy, getDoc, DocumentSnapshot } from "firebase/firestore";
import Image from "next/image";
import axios from "axios";


export default function Chat({ messageUid, openMessageMenu, RemoveMessage }: MemberFunctionProps) {
    const { projectCreator, projectId, projectName } = useGlobalProjectIdContext();
    const { uid, email } = useGlobalUidContext();
    const [messageText, setMessaeText] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<messageDoc[]>([]);
    const [otherPersonImageUrl, setOtherPersonImageUrl] = useState('');

    const [enableClickSelection, setEnableClickSelection] = useState<boolean>(false);
    const [selectedChatsAfterDoubleClicks, setSelectedChatsAfterDoubleClicks] = useState<string[]>([]);


    useEffect(() => {

        

        const q1 = query(
            collection(firestore, 'Chats'),
            where('From', '==', messageUid),
            where('To', '==', uid),
            orderBy('Date', 'asc')
        );

        // Define query q2
        const q2 = query(
            collection(firestore, 'Chats'),
            where('From', '==', uid),
            where('To', '==', messageUid),
            orderBy('Date', 'asc')
        );

        // Listen to q1
        const unsubscribeQ1 = onSnapshot(q1, (snapshot) => {
            const messages: messageDoc[] = [];
            snapshot.forEach((doc) => {
                if (doc.data().Status !== true && doc.data().To === uid) {
                    const docRef = doc.ref;
                    updateDoc(docRef, { Status: true });
                }
                messages.push({
                    messageDocId: doc.id,
                    docData: doc.data() as messageDoc['docData']
                });
            });
            console.log(chatMessages);
            // Merge the messages from q1 with existing chatMessages
            setChatMessages((prevMessages) => [...prevMessages, ...messages]);
        });

        // Listen to q2
        const unsubscribeQ2 = onSnapshot(q2, (snapshot) => {
            const messages: messageDoc[] = [];
            snapshot.forEach((doc) => {
                if (doc.data().Status !== true && doc.data().To === uid) {
                    const docRef = doc.ref;
                    updateDoc(docRef, { Status: true });
                }
                messages.push({
                    messageDocId: doc.id,
                    docData: doc.data() as messageDoc['docData']
                });
            });
            console.log(chatMessages);
            // Merge the messages from q2 with existing chatMessages
            setChatMessages((prevMessages) => [...prevMessages, ...messages]);
        });


        const getOtherPersonImageUrl = async () => {

            const q = query(collection(firestore, 'Users'), where('Uid', "==", messageUid));

            const usersDocs = await getDocs(q);

            if (!usersDocs.empty) {
                const userImage = usersDocs.docs[0].data().ImageUrl;
                setOtherPersonImageUrl(userImage);
            }

        }

        // Clean up the listener when component unmounts
        return () => {
            unsubscribeQ1();
            unsubscribeQ2();
            getOtherPersonImageUrl();
        };
    }, [chatMessages, otherPersonImageUrl]); // Empty dependency array to run only once when component mounts

    const messageBoxRef = useRef<HTMLDivElement>(null);
    const isAtBottomRef = useRef<boolean>(true);

    useEffect(() => {
        const messageBox = messageBoxRef.current;
        if (messageBox) {
            if (isAtBottomRef.current) {
                messageBox.scrollTop = messageBox.scrollHeight;
            }
        }
    }, [chatMessages]);

    const handleScroll = () => {
        const messageBox = messageBoxRef.current;
        if (messageBox) {
            const isAtBottom = messageBox.scrollHeight - messageBox.scrollTop === messageBox.clientHeight;
            isAtBottomRef.current = isAtBottom;
        }
    };



    function getCurrentDate() {
        const currentDate = new Date();
        return currentDate.toISOString(); // returns the date in ISO 8601 format
    }


    // function to delete the chat messages list
    const deleteChatMessageDocId = async () => {
        for (const messageDocID of selectedChatsAfterDoubleClicks) {
            const docRef = doc(firestore, "Chats", messageDocID);
            await deleteDoc(docRef);
        }

        setEnableClickSelection(false);

    }

    // function to add the chat message doc id in the list of ids
    const addInSelectedChats = (messageFrom: string, messageDocId: string) => {
        console.log('clicked');
        console.log(selectedChatsAfterDoubleClicks);
        if (messageFrom == uid && enableClickSelection) {
            // add the messageDocId in the list
            setSelectedChatsAfterDoubleClicks(prevState => {
                if (prevState.includes(messageDocId)) {
                    setEnableClickSelection(!enableClickSelection);
                    // Remove the messageDocId if it already exists
                    return prevState.filter(id => id !== messageDocId);
                } else {
                    // Add the messageDocId if it does not exist
                    return [...prevState, messageDocId];
                }
            });
        }
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
                'To': messageUid,
                'MessageText': messageText.trim(),
                'Timestamp': formattedTime,
                'Status': false,
                'Date': currentDate
            };

            const collectionRef = collection(firestore, 'Chats');
            await addDoc(collectionRef, messageData);
            setMessaeText('');

        }
    };


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

    // function to delete the user 
    const deleteUser = async () => {
        // remove the member id from the projects and also from the user section as well
        const projectDoc = doc(firestore, 'Projects', projectId);
        const projectDocSnapshot = await getDoc(projectDoc);
        if (projectDocSnapshot.exists()) {
            const members = projectDocSnapshot.data().members || [];
            // filter the members to remove the member id 
            const removed_member = members.filter((mem: string) => mem != messageUid);
            await updateDoc(projectDoc, { members: removed_member });
            console.log('members are now updated');
        }

        let removedUserEmail = '';
        // removing project name from the project list from the user doc as well
        const userDocRef = query(collection(firestore, 'Users'), where('Uid', "==", messageUid));
        const docSnapshot = await getDocs(userDocRef);
        if (!docSnapshot.empty) {
            const userDocId = docSnapshot.docs[0].id;
            const user_doc = doc(firestore, 'Users', userDocId);
            const userProjects = docSnapshot.docs[0].data()['Projects'];
            removedUserEmail = docSnapshot.docs[0].data()['Email'];
            const removed_project = userProjects.filter((project: string) => project != projectName);
            await updateDoc(user_doc, { Projects: removed_project });
        }

        // send an notice to the user about the project removal 
        const response = await axios.post('https://fern-ivory-lint.glitch.me/removeMember', {
            ownerEmail: email, MemberEmail: removedUserEmail, projectName: projectName
        });
        console.log(response);
        // navigate back to the members chat
        RemoveMessage();
    }



    return (
        <main className={styles.body}>


            <div className={styles.messageBox} id="messageBox" ref={messageBoxRef} onScroll={handleScroll}>



                {  chatMessages.length != 0 ? 
                    Object.keys(groupedMessages).map(date => (
                        <div key={date}>
                            <div className={styles.dateHeader}>{date}</div>
                            {groupedMessages[date].map((message) => (
                                <div style={{ marginTop: 10 }} key={message.messageDocId} onDoubleClick={() => addInSelectedChats(message.docData.From, message.messageDocId)} className={`${message.docData.From === uid ? styles.myMessage : styles.otherMessage} ${selectedChatsAfterDoubleClicks.includes(message.messageDocId) ? styles.highlightMessage : ''}`} id={message.messageDocId}>
                                    <p>{message.docData.MessageText}</p>
                                    <div className={`${message.docData.From === uid ? styles.myChatMessageData : styles.chatMessageData}`}>
                                        <p>{message.docData.Timestamp}</p>
                                        {message.docData.Status && message.docData.From === uid ? <img className={styles.otherPersonImage} src={otherPersonImageUrl} alt="Other person image" /> : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                    
                ) : <p className={styles.noMessageDesciption}>No messsages</p>
                }


            </div>

            {/* message input box  */}
            <div className={styles.messageinputBox}>

                <input type="text" className={styles.chatMessageInput} value={messageText} placeholder="Type message..." onChange={(e) => setMessaeText(e.target.value)} />
                <button className={styles.sendChatButton} onClick={sendMessage}><img src="/Send.png" alt="send button icon" /></button>
            </div>

            {openMessageMenu &&
                <div className={styles.MessageMenuButtons}>
                    {
                        projectCreator == uid ?
                            <button onClick={deleteUser} className={styles.messageMenuButton}>Remove User</button> : ''
                    }
                    {
                        enableClickSelection ? <button onClick={deleteChatMessageDocId} className={styles.messageMenuButton}>Delete Messages</button>
                            :
                            <button disabled className={styles.messageMenuButton}>Delete Messages</button>
                    }
                </div>
            }
        </main>
    )
}