'use client'

import { createContext, useContext, Dispatch, SetStateAction, useEffect, ReactNode } from "react";
import { useState } from "react";

interface ProjectIdContext {
    socket: any;
    userId: string;

    // function also
    setSocket: Dispatch<SetStateAction<any>>
    setUserId: Dispatch<SetStateAction<string>>
}

const SocketContext = createContext<ProjectIdContext>({
    socket: null,
    userId: '',

    setSocket: (): any => null,
    setUserId: (): string => ''
})

interface GlobalSocketProviderProps {
    children: ReactNode;
}

export const GlobalSocketContext = ({children}: GlobalSocketProviderProps) => {
    const [socket, setSocket] = useState<any>(null);
    const [userId, setUserId] = useState<string>('');

    useEffect(() => {
        if (userId) {
          // https://ember-courageous-range.glitch.me/sendTaskCreate
          const newSocket = new WebSocket(`https://ember-courageous-range.glitch.me?uid=${userId}`);
          setSocket(newSocket);
    
          newSocket.onopen = () => {
            console.log('Connected to WebSocket server');
          };
    
          newSocket.onclose = () => {
            console.log('Disconnected from WebSocket server');
          };
    
          return () => {
            newSocket.close();
          };
        }
      }, [userId]);


    return (
        <SocketContext.Provider value={{socket,userId, setSocket, setUserId}}>
            {children}
        </SocketContext.Provider>
    )
}

export const useGlobalSocketContext = () => useContext(SocketContext);