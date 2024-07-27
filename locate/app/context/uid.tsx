'use client'

import { createContext, useContext, Dispatch, SetStateAction, ReactNode } from "react";
import { useState } from "react";


interface UidContextProps  {
    uid: string | null,
    email: string | null,
    imageUrl: string,
    userName: string | null,
    isProjectMember: boolean,
    setUid: Dispatch<SetStateAction<string | null>>
    setEmail: Dispatch<SetStateAction<string | null>>
    setImageUrl: Dispatch<SetStateAction<string>>
    setUserName: Dispatch<SetStateAction<string | null>>
    setIsProjectMember: Dispatch<SetStateAction<boolean>>
}

// default values
const UidContext = createContext<UidContextProps>({
    uid: '' ,
    email: '',
    imageUrl: '',
    userName: '',
    isProjectMember: false,
    setImageUrl: (): string => '',
    setEmail: (): string => '',
    setUid: (): string => '',
    setUserName: (): string => '',
    setIsProjectMember: (): boolean => false,
})


interface GlobalUidProviderProps {
    children: ReactNode;
}

export const GlobalUidContext = ({ children }: GlobalUidProviderProps) => {
    const [uid, setUid] = useState<string | null>('');
    const [userName, setUserName] = useState<string | null>('');
    const [email, setEmail] = useState<string | null>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [isProjectMember, setIsProjectMember] = useState<boolean>(false);

    return (
        <UidContext.Provider value={{uid, email, imageUrl, userName, isProjectMember, setUserName, setImageUrl, setEmail, setUid, setIsProjectMember }}>
            {children}
        </UidContext.Provider>
    )
}

export const useGlobalUidContext = () => useContext(UidContext);






// // 'use client'

// // import { createContext, useContext, Dispatch, SetStateAction, ReactNode, useEffect } from "react";
// // import { useState } from "react";

// // interface UidContextProps  {
// //     uid: string | null,
// //     email: string | null,
// //     imageUrl: string,
// //     userName: string | null,
// //     isProjectMember: boolean,
// //     setUid: Dispatch<SetStateAction<string | null>>
// //     setEmail: Dispatch<SetStateAction<string | null>>
// //     setImageUrl: Dispatch<SetStateAction<string>>
// //     setUserName: Dispatch<SetStateAction<string | null>>
// //     setIsProjectMember: Dispatch<SetStateAction<boolean>>
// // }

// // // default values
// // const UidContext = createContext<UidContextProps>({
// //     uid: '' ,
// //     email: '',
// //     imageUrl: '',
// //     userName: '',
// //     isProjectMember: false,
// //     setImageUrl: (): string => '',
// //     setEmail: (): string => '',
// //     setUid: (): string => '',
// //     setUserName: (): string => '',
// //     setIsProjectMember: (): boolean => false,
// // })

// // interface GlobalUidProviderProps {
// //     children: ReactNode;
// // }

// // export const GlobalUidContext = ({ children }: GlobalUidProviderProps) => {
// //     // Initialize state from localStorage or default values
// //     const [uid, setUid] = useState<string | null>(localStorage.getItem('uid') || '');
// //     const [userName, setUserName] = useState<string | null>(localStorage.getItem('userName') || '');
// //     const [email, setEmail] = useState<string | null>(localStorage.getItem('email') || '');
// //     const [imageUrl, setImageUrl] = useState<string>(localStorage.getItem('imageUrl') || '');
// //     const [isProjectMember, setIsProjectMember] = useState<boolean>(JSON.parse(localStorage.getItem('isProjectMember') || 'false'));

// //     // Use effect to update localStorage when state changes
// //     useEffect(() => {
// //         localStorage.setItem('uid', uid || '');
// //     }, [uid]);

// //     useEffect(() => {
// //         localStorage.setItem('userName', userName || '');
// //     }, [userName]);

// //     useEffect(() => {
// //         localStorage.setItem('email', email || '');
// //     }, [email]);

// //     useEffect(() => {
// //         localStorage.setItem('imageUrl', imageUrl);
// //     }, [imageUrl]);

// //     useEffect(() => {
// //         localStorage.setItem('isProjectMember', JSON.stringify(isProjectMember));
// //     }, [isProjectMember]);

// //     return (
// //         <UidContext.Provider value={{uid, email, imageUrl, userName, isProjectMember, setUserName, setImageUrl, setEmail, setUid, setIsProjectMember }}>
// //             {children}
// //         </UidContext.Provider>
// //     )
// // }

// // export const useGlobalUidContext = () => useContext(UidContext);






// 'use client'

// import { createContext, useContext, Dispatch, SetStateAction, ReactNode, useEffect, useState } from "react";

// interface UidContextProps  {
//     uid: string | null,
//     email: string | null,
//     imageUrl: string,
//     userName: string | null,
//     isProjectMember: boolean,
//     setUid: Dispatch<SetStateAction<string | null>>
//     setEmail: Dispatch<SetStateAction<string | null>>
//     setImageUrl: Dispatch<SetStateAction<string>>
//     setUserName: Dispatch<SetStateAction<string | null>>
//     setIsProjectMember: Dispatch<SetStateAction<boolean>>
// }

// // default values
// const UidContext = createContext<UidContextProps>({
//     uid: '' ,
//     email: '',
//     imageUrl: '',
//     userName: '',
//     isProjectMember: false,
//     setImageUrl: (): string => '',
//     setEmail: (): string => '',
//     setUid: (): string => '',
//     setUserName: (): string => '',
//     setIsProjectMember: (): boolean => false,
// })

// interface GlobalUidProviderProps {
//     children: ReactNode;
// }

// export const GlobalUidContext = ({ children }: GlobalUidProviderProps) => {
//     const [uid, setUid] = useState<string | null>('');
//     const [userName, setUserName] = useState<string | null>('');
//     const [email, setEmail] = useState<string | null>('');
//     const [imageUrl, setImageUrl] = useState<string>('');
//     const [isProjectMember, setIsProjectMember] = useState<boolean>(false);

//     useEffect(() => {
//         if (typeof localStorage !== 'undefined') {
//             setUid(localStorage.getItem('uid') || '');
//             setUserName(localStorage.getItem('userName') || '');
//             setEmail(localStorage.getItem('email') || '');
//             setImageUrl(localStorage.getItem('imageUrl') || '');
//             setIsProjectMember(JSON.parse(localStorage.getItem('isProjectMember') || 'false'));
//         }
//     }, []);

//     // Use effect to update localStorage when state changes
//     useEffect(() => {
//         if (typeof localStorage !== 'undefined') {
//             localStorage.setItem('uid', uid || '');
//         }
//     }, [uid]);

//     useEffect(() => {
//         if (typeof localStorage !== 'undefined') {
//             localStorage.setItem('userName', userName || '');
//         }
//     }, [userName]);

//     useEffect(() => {
//         if (typeof localStorage !== 'undefined') {
//             localStorage.setItem('email', email || '');
//         }
//     }, [email]);

//     useEffect(() => {
//         if (typeof localStorage !== 'undefined') {
//             localStorage.setItem('imageUrl', imageUrl);
//         }
//     }, [imageUrl]);

//     useEffect(() => {
//         if (typeof localStorage !== 'undefined') {
//             localStorage.setItem('isProjectMember', JSON.stringify(isProjectMember));
//         }
//     }, [isProjectMember]);

//     return (
//         <UidContext.Provider value={{uid, email, imageUrl, userName, isProjectMember, setUserName, setImageUrl, setEmail, setUid, setIsProjectMember }}>
//             {children}
//         </UidContext.Provider>
//     )
// }

// export const useGlobalUidContext = () => useContext(UidContext);