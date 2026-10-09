import Link from "next/link";
import styles from "./Logo.module.css";

export function Logo({ href }: { href: string }) {
  return (
    <Link className={styles.logo} href={href}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="3" width="22" height="26" rx="3.5" fill="#0B6A73" />
        <rect x="5" y="3" width="4.5" height="26" rx="2" fill="#07525A" />
        <path d="M13 23c3-1 2-5 5-6s4-3 3-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeDasharray=".1 3.6" />
        <circle cx="21" cy="10" r="2.2" fill="#E6A33D" />
      </svg>
      <span>Il était une classe</span>
    </Link>
  );
}
