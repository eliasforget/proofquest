import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="ProofQuest">
      <span className="brand-mark">P/Q</span>
      <span>PROOFQUEST</span>
    </Link>
  );
}
