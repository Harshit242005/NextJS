


import { useEffect, useState } from 'react';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { firestore } from '@/app/firebase';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import styles from './assignies.module.css';

interface memberData {
    imageUrl: string,
    name: string,
    uid: string,
    selected: boolean
}

interface AssigniesProps {
    assignies: string[];
    setAssignies: React.Dispatch<React.SetStateAction<string[]>>;
    showAssignOption: boolean;
    setShowAssignOption: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Assignies({ showAssignOption, setShowAssignOption, assignies, setAssignies }: AssigniesProps) {
    const { projectId } = useGlobalProjectIdContext();
    const [memberData, setMemberData] = useState<memberData[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<memberData[]>([]);
    const [selectedId, setSelectedUid] = useState<string[]>([]);

    useEffect(() => {



        const loadMembers = async () => {
            const documentRef = doc(firestore, 'Projects', projectId);
            const document = await getDoc(documentRef);

            if (document.exists()) {
                const members = document.data().members || [];
                const userDataArray: memberData[] = [];

                for (const ID of members) {
                    const q = query(collection(firestore, 'Users'), where('Uid', "==", ID));
                    const documents = await getDocs(q);

                    if (!documents.empty) {
                        const userDocData = documents.docs[0].data();
                        const userData = {
                            'imageUrl': userDocData.ImageUrl,
                            'name': userDocData.Name,
                            'uid': userDocData.Uid,
                            'selected': selectedId.includes(userDocData.Uid)
                        };

                        userDataArray.push(userData);
                    }
                }

                setMemberData(userDataArray);
            }
        };

        loadMembers();
    }, [projectId, firestore]);

    const addUid = (uid: string) => {
        setSelectedUid(selectedId => [...selectedId, uid]);

        setMemberData(prevMembers => prevMembers.map(member => member.uid === uid ? { ...member, selected: true } : member));

    }

    const removeUid = (uid: string) => {
        setSelectedUid(selectedId => selectedId.filter(id => id !== uid));

        setMemberData(prevMembers => prevMembers.map(member => member.uid === uid ? { ...member, selected: false } : member));


    }

    const closeMemberOptions = () => {
        setAssignies(selectedId);
        setShowAssignOption(false);
    }

    const filterMembers = (event: React.ChangeEvent<HTMLInputElement>) => {
        const searchTerm = event.target.value.toLowerCase();
        if (searchTerm.length > 0) {
            const filteredMembers = memberData.filter(member => member.name.toLowerCase().includes(searchTerm));

            setFilteredMembers(filteredMembers);
        } else {
            setFilteredMembers([]);
        }
    }

    return (
        <main>
            <div className={styles.membersOptions}>

                <div className={styles.membersOptionsHeader}>
                    <p style={{paddingLeft: 10, marginTop: 10}}>Members for assginees</p>
                    <button onClick={closeMemberOptions} className={styles.memberOptionCloseButton}><img src="/Cross.png" alt="close icon" /></button>
                </div>

                <input type="text" placeholder='Search member...' className={styles.searchBar} onChange={filterMembers} />

                <div className={styles.membersList}>
                    {filteredMembers.length > 0 ? (

                        filteredMembers.map(member => (

                            <div key={member.uid} className={`${styles.memberTile} ${member.selected ? styles.selectedUser : ''}`} onClick={() => addUid(member.uid)} onDoubleClick={() => removeUid(member.uid)}>
                                <div className={styles.memberTileData}>
                                    <img src={member.imageUrl} className={styles.memberImage} alt={member.name} />
                                    <p className={styles.memberName}>{member.name}</p>
                                </div>
                            </div>

                        ))

                    ) : (

                        memberData.map(member => (

                            <div key={member.uid} className={`${styles.memberTile} ${member.selected ? styles.selectedUser : ''}`} onClick={() => addUid(member.uid)} onDoubleClick={() => removeUid(member.uid)}>
                                <div className={styles.memberTileData}>
                                    <img src={member.imageUrl} className={styles.memberImage} alt={member.name} />
                                    <p className={styles.memberName}>{member.name}</p>
                                </div>
                            </div>

                        ))
                    )}
                </div>
            </div>
        </main>
    )
}
