import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | SOL Pilates Studio",
  description: "Terms for using SOL Pilates Studio class booking, membership, website, and mobile app services.",
};

const UPDATED_AT = "June 9, 2026";

const sections = [
  {
    title: "Using SOL Pilates Services",
    body: [
      "These Terms apply when you use the SOL Pilates Studio website, mobile app, class booking features, membership services, intro class flow, and related studio services.",
      "By creating an account, booking a class, purchasing a plan, or using our services, you agree to these Terms and our Privacy Policy.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You are responsible for keeping your login details secure and for all activity under your account. Please provide accurate account and contact information so we can manage bookings, payments, and important service messages.",
      "We may suspend or restrict access if we believe an account is being misused, violates these Terms, creates safety concerns, or is used for fraudulent activity.",
    ],
  },
  {
    title: "Bookings And Attendance",
    body: [
      "Class bookings are subject to availability, plan eligibility, instructor availability, studio capacity, and schedule changes. Booking a class reserves a spot for the selected session only.",
      "You are responsible for arriving on time and following studio instructions. SOL Pilates Studio may mark missed classes as no-show according to the booking rules shown in the app or communicated by the studio.",
    ],
  },
  {
    title: "Plans, Credits, And Payments",
    body: [
      "Intro classes, class packs, and memberships may include limits such as credits, weekly booking caps, validity periods, guest passes, or plan-specific restrictions. These limits are shown in the app or website and may vary by plan.",
      "Payments are processed by Razorpay or its payment partners. Physical Pilates classes and studio services are consumed outside the app. Prices, taxes, discounts, and payment methods may change where permitted by law.",
    ],
  },
  {
    title: "Cancellations, Renewals, And Schedule Changes",
    body: [
      "Memberships, renewals, plan changes, and cancellations are handled according to the rules shown at checkout, in your profile, or in studio communications. If a renewal is canceled, access may continue until the current paid period ends.",
      "SOL Pilates Studio may cancel, reschedule, substitute, or modify classes when needed because of instructor availability, safety, facility issues, holidays, or operational reasons. If we cancel a class, we may restore the applicable credit or provide another remedy at our discretion and as required by law.",
    ],
  },
  {
    title: "Health And Safety",
    body: [
      "Pilates and fitness activities involve physical movement and may involve risk of injury. You are responsible for deciding whether a class is appropriate for your health, ability, and condition.",
      "Consult a qualified medical professional before starting any exercise program if you have injuries, health conditions, pain, pregnancy-related concerns, or any uncertainty. Tell the instructor about relevant limitations before class.",
    ],
  },
  {
    title: "Acceptable Use",
    body: [
      "You agree not to misuse the app, interfere with the service, attempt unauthorized access, submit false information, harass staff or members, copy app content for commercial use, or use the service in a way that violates applicable law.",
    ],
  },
  {
    title: "Content And Intellectual Property",
    body: [
      "The SOL Pilates Studio name, branding, website, app design, class descriptions, text, images, and other content are owned by SOL Pilates Studio or used with permission. You may not copy, modify, distribute, or commercially use them without written permission.",
    ],
  },
  {
    title: "Service Availability",
    body: [
      "We work to keep the website, mobile app, payment flows, and booking systems available, but we do not guarantee uninterrupted or error-free operation. Features may be updated, paused, or changed as we improve the service.",
    ],
  },
  {
    title: "Limitation Of Liability",
    body: [
      "To the fullest extent permitted by law, SOL Pilates Studio is not liable for indirect, incidental, special, consequential, or punitive damages arising from use of the website, app, bookings, memberships, or studio services.",
      "Nothing in these Terms limits rights that cannot be limited under applicable law.",
    ],
  },
  {
    title: "Changes To These Terms",
    body: [
      "We may update these Terms as our services change. The latest version will be posted on this page with the updated date. Continued use of the services after changes means you accept the updated Terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-peach-200">
      <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[16vw] font-black text-peach-200 whitespace-nowrap font-display">
            TERMS
          </span>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <p className="text-terra-300 text-xs font-bold tracking-widest uppercase mb-4">
              Last updated {UPDATED_AT}
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-peach-50 tracking-normal font-display">
              Terms of Service
            </h1>
            <p className="text-peach-400 mt-6 max-w-2xl leading-relaxed">
              These terms explain the rules for using SOL Pilates Studio booking,
              membership, website, mobile app, and studio services.
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
                    Questions about these Terms can be sent to{" "}
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
