
interface FailureProps {
    failureMessage: string
}

import Image from "next/image";
import styles from './Failure.module.css';

export default function Failure({ failureMessage }: FailureProps) {
    return (
        <main>
            <div className={styles.FailureInfo}>
                <Image src="../../WrongInfo.svg" alt="Faliure icon" width={40} height={40} />
                <p className={styles.FailureInfoText}>{failureMessage}</p>
            </div>
        </main>
    )
}