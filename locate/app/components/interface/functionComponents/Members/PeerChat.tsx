// exporting functions and useState for the peer to peer chat communication 

// chatEffect.js
firestore
import { firestore } from '@/app/firebase';
import { query, collection, where, orderBy, onSnapshot, getDocs, updateDoc, doc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { useEffect } from 'react';

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




export const PeerChatUseEffect = (
   
    messageUid: string,
    uid: string | null,
    normalMessageIdsSet: Set<string>,
    setNormalChatMessages: React.Dispatch<React.SetStateAction<normalMessageDoc[]>>,
    setOtherPersonImageUrl: React.Dispatch<React.SetStateAction<string>>
) => {
    useEffect(() => {
        const q1 = query(
            collection(firestore, 'Chats'),
            where('From', '==', messageUid),
            where('To', '==', uid),
            orderBy('Date', 'asc')
        );

        const q2 = query(
            collection(firestore, 'Chats'),
            where('From', '==', uid),
            where('To', '==', messageUid),
            orderBy('Date', 'asc')
        );

        const handleSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
            const messages: { messageDocId: any; docData: any; }[] = [];
            snapshot.forEach((doc) => {
                const docId = doc.id;
                if (!normalMessageIdsSet.has(docId)) {
                    if (doc.data().Status !== true && doc.data().To === uid) {
                        updateDoc(doc.ref, { Status: true });
                    }
                    messages.push({
                        messageDocId: doc.id,
                        docData: doc.data()
                    });
                    normalMessageIdsSet.add(docId);
                    const messageBox = document.getElementById('messageBox');
                    if (messageBox) {
                        messageBox.scrollTop = messageBox.scrollHeight;
                    }
                }
            });
            setNormalChatMessages((prevMessages) => [...prevMessages, ...messages]);
        };

        const unsubscribeQ1 = onSnapshot(q1, handleSnapshot);
        const unsubscribeQ2 = onSnapshot(q2, handleSnapshot);

        const getOtherPersonImageUrl = async () => {
            const q = query(collection(firestore, 'Users'), where('Uid', '==', messageUid));
            const usersDocs = await getDocs(q);
            if (!usersDocs.empty) {
                const userImage = usersDocs.docs[0].data().ImageUrl;
                setOtherPersonImageUrl(userImage);
            }
        };

        getOtherPersonImageUrl();

      
            unsubscribeQ1();
            unsubscribeQ2();
        
    }, [firestore, messageUid, uid, normalMessageIdsSet, setNormalChatMessages, setOtherPersonImageUrl]);
};
