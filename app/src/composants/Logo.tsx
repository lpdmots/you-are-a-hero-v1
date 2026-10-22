import Link from "next/link";
import { Dragon } from "./Dragon";
import styles from "./Logo.module.css";

export function Logo({ href }: { href: string }) {
  return (
    <Link className={styles.logo} href={href}>
      <Dragon className={styles.dragon} />
      <span>Il était une classe</span>
    </Link>
  );
}
