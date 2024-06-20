
'use client';


import styles from './request.module.css';
import { useGlobalProjectIdContext } from '@/app/context/projectId';
import { useGlobalUidContext } from '@/app/context/uid';
import { useEffect, useState } from 'react';
import { firestore } from '@/app/firebase';
import { collection, doc, getDoc, where, query, getDocs, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore';
export default function Requests() {

    interface requestMemberData {
        Uid: string;
        ImageUrl: string;
        Name: string;
    }

    const { projectId, projectName } = useGlobalProjectIdContext();
    const [requestMembersIds, setRequestMembersIds] = useState([]);
    const [requestMembersData, setRequestMembersData] = useState<requestMemberData[]>([]);


    const AcceptRequest = async (MemberId: string) => {
        try {
            const docRef = doc(firestore, 'Projects', projectId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const projectData = docSnap.data();
                const { createdBy, members, requests } = projectData;

                // Remove MemberId from requests list
                const updatedRequests = requests.filter((request: string) => request !== MemberId);

                // Add MemberId to members list if not already present
                const updatedMembers = arrayUnion(...members, MemberId);

                // Update the document
                await updateDoc(docRef, {
                    requests: updatedRequests,
                    members: updatedMembers
                });

                console.log('Member request accepted successfully.');
            } else {
                console.log('Project document does not exist.');
            }
        } catch (error) {
            console.error('Error accepting member request:', error);
        }


        // second step
        // update the user request map for the project name with true value 

        try {
            // Query the user document
            const userQuery = query(collection(firestore, 'Users'), where('Uid', '==', MemberId));
            const userDocuments = await getDocs(userQuery);

            if (!userDocuments.empty) {
                const userDoc = userDocuments.docs[0]; // Assuming there's only one user document for a given Uid
                const userData = userDoc.data();

                // Update the Member keyword with the projectName for the user
                userData.Member = projectName;

                const requestsMap = userData.Requests || {}; // Access the Requests map, defaulting to an empty object if it doesn't exist

                if (requestsMap.hasOwnProperty(projectName)) {
                    // Update the value of the boolean to true
                    requestsMap[projectName] = true;

                    // Update the user document with the modified Requests map and Member
                    await updateDoc(doc(firestore, 'Users', userDoc.id), { Requests: requestsMap, Member: projectName });

                    console.log(`Member updated to ${projectName} successfully.`);
                } else {
                    console.log(`${projectName} does not exist in the Requests map.`);
                }
            } else {
                console.log(`User document with UID ${MemberId} does not exist.`);
            }
        } catch (error) {
            console.error('Error updating the user document:', error);
        }
    };


    // remove the memberId 
    function removeFromArray(array: [], element: string) {
        return array.filter(item => item !== element);
    }



    const RejectRequest = async (MemberId: string) => {
        try {
            console.log('Rejecting the member to join', MemberId, projectId);

            const docRef = doc(firestore, 'Projects', projectId);
            const docSnapshot = await getDoc(docRef);

            if (docSnapshot.exists()) {
                const projectData = docSnapshot.data();
                const requestsList = projectData.requests || [];
                console.log(requestsList);
                if (requestsList.includes(MemberId)) {
                    // Remove MemberId from requests list
                    // const updatedRequestsList = arrayRemove(requestsList, MemberId);
                    const updatedRequestsList = removeFromArray(requestsList, MemberId);
                    console.log('Updated list after removing the id', updatedRequestsList);

                    // Update the document with the modified requests list
                    await updateDoc(docRef, { requests: updatedRequestsList });

                    console.log(`Member ID ${MemberId} removed from requests list.`);
                } else {
                    console.log(`Member ID ${MemberId} not found in requests list.`);
                }
            } else {
                console.log('Document snapshot does not exist.');
            }
        } catch (error) {
            console.error('Error deleting the member ID from the requests list:', error);
        }


        // second step
        // update the map of the user by removing the projectName
        try {
            // Query the user document
            const userQuery = query(collection(firestore, 'Users'), where('Uid', '==', MemberId));
            const userDocuments = await getDocs(userQuery);

            if (!userDocuments.empty) {
                const userDoc = userDocuments.docs[0]; // Assuming there's only one user document for a given Uid
                const userData = userDoc.data();
                let requestsMap = userData.Requests || {}; // Access the Requests map, defaulting to an empty object if it doesn't exist

                if (requestsMap.hasOwnProperty(projectName)) {
                    // Remove the projectName key from the requestsMap
                    delete requestsMap[projectName];

                    // Update the user document with the modified Requests map
                    await updateDoc(doc(firestore, 'Users', userDoc.id), { Requests: requestsMap });

                    console.log(`${projectName} removed successfully from the Requests map.`);
                } else {
                    console.log(`${projectName} does not exist in the Requests map.`);
                }
            } else {
                console.log(`User document with UID ${MemberId} does not exist.`);
            }
        } catch (error) {
            console.error('Error updating the user Requests map:', error);
        }
    };


    useEffect(() => {

        console.log('project id is', projectId);
        const getMembersIds = async () => {
            const docRef = doc(firestore, 'Projects', projectId);
            const docSnap = await getDoc(docRef);
            const requestMembers = docSnap.data()!.requests;
            console.log(requestMembers);
            setRequestMembersIds(requestMembers);
            const membersData = [];
            for (const requestMemberId of requestMembers) {
                // get the document using the where 
                console.log('request member id is', requestMemberId);
                const q = query(collection(firestore, 'Users'), where('Uid', '==', requestMemberId));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const documentData = querySnapshot.docs[0].data();
                    console.log('document data is', documentData);
                    const { Uid, ImageUrl, Name } = documentData;
                    const memberObject = { Uid, ImageUrl, Name };
                    membersData.push(memberObject);
                }
            }
            setRequestMembersData(membersData);

        }

        getMembersIds();
    }, [projectId]);

    return (
        <main className={styles.body}>
            
            {/* load the uid from the requests list  */}
            {requestMembersData.length > 0 ?
                <div className={styles.requests}>
                    {requestMembersData.map((userData, index) => (
                        <div key={userData.Uid} className={styles.requestMemberData}>
                            <div className={styles.requestData}>
                                <img src={userData.ImageUrl} style={{ width: 50, height: 50, border: 'none', 'borderRadius': '50%' }} alt={userData.Name} />
                                <p className={styles.requestName}>{userData.Name}</p>
                            </div>
                            <div className={styles.buttons}>
                                <button className={styles.button} onClick={() => AcceptRequest(userData.Uid)}>Accept</button>
                                <button className={styles.button} onClick={() => RejectRequest(userData.Uid)}>Reject</button>
                            </div>
                        </div>
                    ))}
                </div> : 
                <div className={styles.noRequest}>
                    <p>No requests yet!</p>
                </div>
            }
        </main>
    )
}