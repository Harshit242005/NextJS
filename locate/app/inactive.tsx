// custom hook for setting the user status inactive when he leave the site 
import { useEffect } from 'react';

const useBeforeUnload = (callback: any) => {
  useEffect(() => {
    const handleBeforeUnload = (event: any) => {
      callback(event);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [callback]);
};

export default useBeforeUnload;
