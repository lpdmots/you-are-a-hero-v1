import Link from "next/link";
import { Dragon } from "./Dragon";
import styles from "./Logo.module.css";

export function Logo({ href, className }: { href: string; className?: string }) {
  return (
    <Link className={className ? `${styles.logo} ${className}` : styles.logo} href={href}>
      <Dragon className={styles.dragon} />
      <span>Il était une classe</span>
    </Link>
  );
}
