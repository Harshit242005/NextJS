
'use client';
import { useState, useEffect } from "react";
import styles from './Chat.module.css';
import Image from "next/image";


interface messageText {
    text: string;
    time: string;
}

export default function Chat() {

    const [message, setChatMessage] = useState<string>('');
    const [messages, setMessages] = useState<messageText[]>([]);

    const getCurrentTime = (): string => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    const addMessage = () => {
        if (message != '') {
            const user_message: messageText = { text: message, time: getCurrentTime() };
            setMessages([...messages, user_message]);
            setChatMessage('');
        }
    }





    return (
        <main>
            <div className={styles.chatBlock}>
                <div className={styles.containerText}>
                    <p className={styles.heading}>4.<br />
                        Message Friends
                    </p>
                    <p className={styles.subText}>Talk with your friends and
                        stay connected about project
                        and updates </p>
                </div>

                <div className={styles.container}>
                    <div className={styles.messageHeader}>
                        <img className={styles.messageImage} src="./First.png" alt="Member image" />
                        <p className={styles.messageName}>James</p>
                    </div>
                    <div className={styles.showMessaeges}>
                        {
                            messages.length > 0 ?
                                <div className={styles.messages}>
                                    {
                                        messages.map((chatmessage, index) => (
                                            <div className={styles.mymessage}>
                                                <p className={styles.messageText}>{chatmessage.text}</p>
                                                <p className={styles.messageTime}>{chatmessage.time}</p>
                                            </div>
                                        ))
                                    }
                                </div>
                                :
                                <p className={styles.noMessags}>No Messages yet!</p>
                        }
                    </div>
                    <div className={styles.createMessageSction}>
                        <input value={message} onChange={(e) => setChatMessage(e.target.value)} type="text" placeholder="Type message..." className={styles.messageInput} />
                        <button onClick={addMessage} className={styles.sendMessage}><Image src="./Chat.svg" alt="" width={50} height={40} /></button>
                    </div>
                </div>

            </div>
        </main>
    )
}