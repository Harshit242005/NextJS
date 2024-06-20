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