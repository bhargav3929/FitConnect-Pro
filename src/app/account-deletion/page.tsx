import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete Your Account | SOL Pilates Studio",
  description: "How to request deletion of your SOL Pilates Studio account and associated data, including what is deleted and what is retained.",
};

const UPDATED_AT = "July 24, 2026";

const sections = [
  {
    title: "How To Request Account Deletion",
    body: [
      "You can delete your SOL Pilates Studio account directly from the mobile app. Open the app, go to the Profile tab, scroll to the Delete Account option, and confirm the request. Your account and login are removed immediately once you confirm.",
      "If you cannot access the app, you can request deletion by emailing us from the address associated with your account at solpilatesstudio.in@gmail.com with the subject \"Delete my account\". We will verify your identity and process the request.",
    ],
  },
  {
    title: "What Is Deleted",
    body: [
      "When your account is deleted, we remove your login credentials and your user profile, including your name, email address, phone number, physical address, emergency contact details, and profile photo.",
      "Any upcoming confirmed bookings are cancelled and their class spots are released. Personal details attached to your past booking and demo-class records are anonymized so the records can no longer be linked to you.",
      "If you signed in with Apple, your Apple sign-in authorization is revoked as part of the deletion. If you have an active membership, its recurring billing is cancelled.",
    ],
  },
  {
    title: "What Is Retained, And For How Long",
    body: [
      "For legal, tax, accounting, security, and dispute-resolution purposes, we retain anonymized transaction and booking records that are no longer linked to your identity. Payment records held by our payment provider, Razorpay, are retained according to their own policies and applicable financial regulations.",
      "These retained records do not contain your personal contact information after deletion. Where the law requires us to keep certain records for a defined period, we keep them only for as long as that obligation applies and then remove them.",
    ],
  },
];

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-peach-200">
      <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[16vw] font-black text-peach-200 whitespace-nowrap font-display">
            ACCOUNT
          </span>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <p className="text-terra-300 text-xs font-bold tracking-widest uppercase mb-4">
              Last updated {UPDATED_AT}
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-peach-50 tracking-normal font-display">
              Delete Your Account
            </h1>
            <p className="text-peach-400 mt-6 max-w-2xl leading-relaxed">
              This page explains how to request deletion of your SOL Pilates Studio account and
              associated data, what we delete, and what we are required to keep.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl bg-peach-50 border border-peach-400/30 p-6 md:p-10">
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl md:text-3xl font-black text-olive-600 tracking-normal mb-4 font-display">
                    {section.title}
                  </h2>
                  <div className="space-y-4 text-olive-400 leading-relaxed">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}

              <section className="border-t border-peach-400/40 pt-8">
                <h2 className="text-2xl md:text-3xl font-black text-olive-600 tracking-normal mb-4 font-display">
                  Contact Us
                </h2>
                <div className="space-y-3 text-olive-400 leading-relaxed">
                  <p>
                    For help with account deletion or any privacy request, contact SOL Pilates
                    Studio at{" "}
                    <a className="text-terra-400 font-bold" href="mailto:solpilatesstudio.in@gmail.com">
                      solpilatesstudio.in@gmail.com
                    </a>
                    .
                  </p>
                  <p>
                    See our{" "}
                    <Link className="text-terra-400 font-bold" href="/privacy">
                      Privacy Policy
                    </Link>{" "}
                    for more on how we handle your information.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
