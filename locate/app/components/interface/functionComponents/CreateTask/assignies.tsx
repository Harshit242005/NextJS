

import { useGlobalUidContext } from '@/app/context/uid';
import { useEffect, useState } from 'react';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { firestore } from '@/app/firebase';
import { doc, getDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import styles from './assignies.module.css';

interface memberData {
    imageUrl: string,
    name: string,
    uid: string,

}

interface AssigniesProps {
    assignies: string[];
    setAssignies: React.Dispatch<React.SetStateAction<string[]>>;
    showAssignOption: boolean;
    setShowAssignOption: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedUid: React.Dispatch<React.SetStateAction<string[]>>;
    selectedId: string[];
}

export default function Assignies({ setShowAssignOption, selectedId, setSelectedUid, setAssignies }: AssigniesProps) {
    const { projectId } = useGlobalProjectIdContext();
    const { uid } = useGlobalUidContext();
    const [memberData, setMemberData] = useState<memberData[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<memberData[]>([]);


    useEffect(() => {

        console.log(selectedId);
        const loadMembers = async () => {
            const documentRef = doc(firestore, 'Projects', projectId);
            const document = await getDoc(documentRef);

            if (document.exists()) {
                const members = document.data().members || [];
                const filtered_members = members.filter((member: string) => member != uid)
                const userDataArray: memberData[] = [];

                for (const ID of filtered_members) {
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



    const addUid = (selectedUid: string) => {
        if (!selectedId.includes(selectedUid)) {
            setSelectedUid(selectedId => [...selectedId, selectedUid]);
        }
        else {
            removeUid(selectedUid);
        }
    }

    const removeUid = (selectedUid: string) => {
        console.log(selectedUid);
        setSelectedUid(selectedId => selectedId.filter(id => id !== selectedUid));
        console.log(selectedId);
    }

    const closeMemberOptions = () => {
        console.log(selectedId);
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
                    <p className={styles.assigneeDialogHeading} style={{ paddingLeft: 10, marginTop: 10 }}>Members for assginees</p>
                    <button onClick={closeMemberOptions} className={styles.memberOptionCloseButton}><img src="/Cross.png" alt="close icon" /></button>
                </div>

                <input type="text" placeholder='Search member...' className={styles.searchBar} onChange={filterMembers} />

                <div className={styles.membersList}>
                    {filteredMembers.length > 0 ? (


                        filteredMembers.map(member => (

                            <div key={member.uid} className={`${styles.memberTile} ${selectedId.includes(member.uid) ? styles.selectedUser : ''}`} onClick={() => addUid(member.uid)} >
                                <div className={styles.memberTileData}>
                                    <img src={member.imageUrl} className={styles.memberImage} alt={member.name} />
                                    <p className={styles.memberName}>{member.name}</p>
                                </div>
                            </div>

                        ))

                    ) : (

                        memberData.length > 0 ?
                            memberData.map(member => (

                                <div key={member.uid} className={`${styles.memberTile} ${selectedId.includes(member.uid) ? styles.selectedUser : ''}`} onClick={() => addUid(member.uid)}>
                                    <div className={styles.memberTileData}>
                                        <img src={member.imageUrl} className={styles.memberImage} alt={member.name} />
                                        <p className={styles.memberName}>{member.name}</p>
                                    </div>
                                </div>

                            ))
                            :
                            <p className={styles.noMember}>No member exist</p>
                    )}
                </div>
            </div>
        </main>
    )
}
