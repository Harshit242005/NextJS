// 'use client'

// import { createContext, useContext, Dispatch, SetStateAction, ReactNode } from "react";
// import { useState } from "react";

// interface ProjectIdContext {
//     projectId: string;
//     projectName: string;
//     projectCreator: string;

//     // function also
//     setProjectId: Dispatch<SetStateAction<string>>
//     setProjectName: Dispatch<SetStateAction<string>>
//     setProjectCreator: Dispatch<SetStateAction<string>>
// }

// const ProjectContext = createContext<ProjectIdContext>({
//     projectId: '',
//     projectName: '',
//     projectCreator:'',
//     setProjectId: (): string => '',
//     setProjectName: (): string => '',
//     setProjectCreator: (): string => ''
// })

// interface GlobalProjectProviderProps {
//     children: ReactNode;
// }

// export const GlobalProjectContext = ({children}: GlobalProjectProviderProps) => {
//     const [projectId, setProjectId] = useState<string>('');
//     const [projectName, setProjectName] = useState<string>('');
//     const [projectCreator, setProjectCreator] = useState<string>('')


//     return (
//         <ProjectContext.Provider value={{projectId,projectName, setProjectId, setProjectName, projectCreator, setProjectCreator}}>
//             {children}
//         </ProjectContext.Provider>
//     )
// }

// export const useGlobalProjectIdContext = () => useContext(ProjectContext);






'use client'

import { createContext, useContext, Dispatch, SetStateAction, ReactNode, useEffect } from "react";
import { useState } from "react";

interface ProjectIdContext {
    projectId: string;
    projectName: string;
    projectCreator: string;

    // function also
    setProjectId: Dispatch<SetStateAction<string>>
    setProjectName: Dispatch<SetStateAction<string>>
    setProjectCreator: Dispatch<SetStateAction<string>>
}

const ProjectContext = createContext<ProjectIdContext>({
    projectId: '',
    projectName: '',
    projectCreator:'',
    setProjectId: (): string => '',
    setProjectName: (): string => '',
    setProjectCreator: (): string => ''
})

interface GlobalProjectProviderProps {
    children: ReactNode;
}

export const GlobalProjectContext = ({children}: GlobalProjectProviderProps) => {
    const [projectId, setProjectId] = useState<string>(localStorage.getItem('projectId') || '');
    const [projectName, setProjectName] = useState<string>(localStorage.getItem('projectName') || '');
    const [projectCreator, setProjectCreator] = useState<string>(localStorage.getItem('projectCreator') || '')

    // Use effect to update localStorage when state changes
    useEffect(() => {
        localStorage.setItem('projectId', projectId);
    }, [projectId]);

    useEffect(() => {
        localStorage.setItem('projectName', projectName);
    }, [projectName]);

    useEffect(() => {
        localStorage.setItem('projectCreator', projectCreator);
    }, [projectCreator]);

    return (
        <ProjectContext.Provider value={{projectId,projectName, setProjectId, setProjectName, projectCreator, setProjectCreator}}>
            {children}
        </ProjectContext.Provider>
    )
}

export const useGlobalProjectIdContext = () => useContext(ProjectContext);
