'use client'
interface MemberFunctionProps {
    setOpenMessage: React.Dispatch<React.SetStateAction<boolean>>;
    openMessage: boolean;
    messageUid: string;
    changeDeleteButtonShow: () => void;
    onDelete: React.Dispatch<React.SetStateAction<any>>;
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
import { collection, addDoc, onSnapshot, getDocs, query, where, updateDoc, doc, deleteDoc, orderBy } from "firebase/firestore";
import Image from "next/image";


export default function Chat({ setOpenMessage, messageUid, changeDeleteButtonShow, onDelete }: MemberFunctionProps) {
    const { } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [messageText, setMessaeText] = useState<string>('');
    const [chatMessages, setChatMessages] = useState<messageDoc[]>([]);
    const [otherPersonImageUrl, setOtherPersonImageUrl] = useState('');

    const [enableClickSelection, setEnableClickSelection] = useState<boolean>(false);
    const [selectedChatsAfterDoubleClicks, setSelectedChatsAfterDoubleClicks] = useState<string[]>([]);


    useEffect(() => {
        onDelete(deleteChatMessageDocId);
        // Set up listener for real-time updates to chat messages
        const q = query(
            collection(firestore, 'Chats'),
            orderBy('Date', 'asc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messages: messageDoc[] = [];
            snapshot.forEach((doc: any) => {
                // here apply the function to change the status value of the text
                if (doc.data().Status !== true && doc.data().To === uid) {
                    const docRef = doc.ref;
                    updateDoc(docRef, { Status: true });
                }
                messages.push({
                    messageDocId: doc.id,
                    docData: doc.data() as messageDoc['docData']
                });
            });
            setChatMessages(messages);
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
            unsubscribe();
            getOtherPersonImageUrl();
        };
    }, [chatMessages, otherPersonImageUrl, onDelete]); // Empty dependency array to run only once when component mounts

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

    const selectChatMessage = (messageFromId: string, selectChatMessage: string) => {


        addInSelectedChats(messageFromId, selectChatMessage); // start the populating of the list that hold message doc id 
        if (enableClickSelection) { // hide the button and selection functionality if it's true 
            setEnableClickSelection(!enableClickSelection); //  do not have to contain an extra button at the header for deselection
            changeDeleteButtonShow(); // show and hide the delete button     

            setSelectedChatsAfterDoubleClicks([]); // clear the selected chat's from the list
        }
    }

    // function to delete the chat messages list
    const deleteChatMessageDocId = async () => {
        for (const messageDocID of selectedChatsAfterDoubleClicks) {
            const docRef = doc(firestore, "Chats", messageDocID);
            await deleteDoc(docRef);
        }
    }

    // function to add the chat message doc id in the list of ids
    const addInSelectedChats = (messageFrom: string, messageDocId: string) => {
        if (messageFrom == uid && enableClickSelection) {
            // add the messageDocId in the list
            setSelectedChatsAfterDoubleClicks(prevState => {
                if (prevState.includes(messageDocId)) {
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



    return (
        <main className={styles.body}>


            <div className={styles.messageBox} id="messageBox" ref={messageBoxRef} onScroll={handleScroll}>

               

                {Object.keys(groupedMessages).map(date => (
                    <div key={date}>
                        <div className={styles.dateHeader}>{date}</div>
                        {groupedMessages[date].map((message) => (
                            <div style={{marginTop:10}} key={message.messageDocId} onClick={() => addInSelectedChats(message.docData.From, message.messageDocId)} onDoubleClick={() => selectChatMessage(message.docData.From, message.messageDocId)} className={`${message.docData.From === uid ? styles.myMessage : styles.otherMessage} ${selectedChatsAfterDoubleClicks.includes(message.messageDocId) ? styles.highlightMessage : ''}`} id={message.messageDocId}>
                                <p>{message.docData.MessageText}</p>
                                <div className={`${message.docData.From === uid ? styles.myChatMessageData : styles.chatMessageData}`}>
                                    <p>{message.docData.Timestamp}</p>
                                    {message.docData.Status && message.docData.From === uid ? <img className={styles.otherPersonImage} src={otherPersonImageUrl} alt="Other person image" /> : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}


            </div>

            {/* message input box  */}
            <div className={styles.messageinputBox}>
              
                <input type="text" className={styles.chatMessageInput} value={messageText} placeholder="Type message..." onChange={(e) => setMessaeText(e.target.value)} />
                <button className={styles.sendChatButton} onClick={sendMessage}><img src="/Send.png" alt="send button icon" /></button>
            </div>
        </main>
    )
}