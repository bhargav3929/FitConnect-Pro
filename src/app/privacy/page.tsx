import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | SOL Pilates Studio",
  description: "How SOL Pilates Studio collects, uses, and protects information for class booking and membership services.",
};

const UPDATED_AT = "June 20, 2026";

const sections = [
  {
    title: "Information We Collect",
    body: [
      "When you create an account, book a class, join the waitlist, purchase a membership, update your profile, or contact us, we may collect your name, email address, phone number, physical address, emergency contact details, profile photo, account identifier, booking history, membership details, payment status, and messages you send to us.",
      "We may collect basic app usage, diagnostics, and crash information to keep the website and mobile app reliable. If you choose to sign in with Apple or Google, we receive the account information needed to create and manage your SOL Pilates account.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use your information to create and manage your account, process demo class and membership purchases, reserve classes, manage check-ins and cancellations, provide support, send important service messages, and improve the booking experience.",
      "We do not sell your personal information. We do not use your information for cross-app advertising tracking.",
    ],
  },
  {
    title: "Payments",
    body: [
      "Payments are processed by Razorpay or its payment partners. SOL Pilates Studio does not store full card numbers or sensitive payment credentials in our own systems. We receive payment identifiers, payment status, subscription status, and related transaction information needed to activate and manage your plan.",
    ],
  },
  {
    title: "Service Providers",
    body: [
      "We use trusted service providers to operate the app, including Firebase for authentication, database, hosting, and related infrastructure, Google sign-in for optional authentication, Razorpay for payment processing, and Expo services for mobile app delivery and updates.",
      "These providers process information only as needed to provide their services to us and to you.",
    ],
  },
  {
    title: "Photos And Device Permissions",
    body: [
      "If the mobile app asks for camera or photo library access, it is only so you can choose to take, upload, or update a profile photo. We do not access your camera or photos unless you grant permission through your device settings.",
    ],
  },
  {
    title: "Data Retention",
    body: [
      "We keep account, booking, membership, and payment records for as long as needed to provide the service, comply with legal or accounting obligations, resolve disputes, and maintain business records.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You can update certain account details in the app. You can also initiate account deletion from the app or contact us to request data correction or help with privacy questions. Some records may be retained when required for legal, security, tax, payment, or dispute-resolution purposes.",
    ],
  },
  {
    title: "Children",
    body: [
      "SOL Pilates Studio is not directed to children under 13. If you believe a child has provided personal information without appropriate consent, contact us so we can review and delete it where required.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use administrative, technical, and organizational measures designed to protect personal information. No system is completely secure, so please use a strong password and contact us if you suspect unauthorized account access.",
    ],
  },
  {
    title: "Changes To This Policy",
    body: [
      "We may update this Privacy Policy as our services change. The latest version will be posted on this page with the updated date.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-peach-200">
      <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[16vw] font-black text-peach-200 whitespace-nowrap font-display">
            PRIVACY
          </span>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <p className="text-terra-300 text-xs font-bold tracking-widest uppercase mb-4">
              Last updated {UPDATED_AT}
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-peach-50 tracking-normal font-display">
              Privacy Policy
            </h1>
            <p className="text-peach-400 mt-6 max-w-2xl leading-relaxed">
              This policy explains how SOL Pilates Studio handles information when you use our website,
              mobile app, class booking, membership, and studio services.
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
                    For privacy questions or requests, contact SOL Pilates Studio at{" "}
                    <a className="text-terra-400 font-bold" href="mailto:solpilatesstudio.in@gmail.com">
                      solpilatesstudio.in@gmail.com
                    </a>
                    .
                  </p>
                  <p>
                    You can also reach us through the{" "}
                    <Link className="text-terra-400 font-bold" href="/contact">
                      contact page
                    </Link>
                    .
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
