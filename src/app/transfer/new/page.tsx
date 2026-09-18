import type { Metadata } from "next";
import { NewTransferForm } from "@/components/transfer/NewTransferForm";

export const metadata: Metadata = {
  title: "New transfer · AfriPollar",
};

export default function NewTransferPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Send to Bolivia</h1>
        <p className="max-w-2xl text-sm text-ink-soft">
          Choose your local funding rail. You will get payment instructions with a reference code,
          and an agent confirms the local leg before settlement runs through Pollar.
        </p>
      </header>
      <NewTransferForm />
    </div>
  );
}
