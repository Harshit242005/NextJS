
interface SuccessProps {
    successMessage: string
}

import Image from "next/image";
import styles from './Success.module.css';

export default function Success({ successMessage }: SuccessProps) {
    return (
        <main>
            <div className={styles.SuccessInfo}>
                <Image src="../../SuccessInfo.svg" alt="success icon" width={40} height={40} />
                <p className={styles.SuccessInfoText}>{successMessage}</p>
            </div>
        </main>
    )
}