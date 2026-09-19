import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Studio Policies | SOL Pilates Studio",
  description:
    "Booking, cancellation, late arrival, freeze, membership, payment, health, and etiquette policies for SOL Pilates Studio members.",
};

const UPDATED_AT = "September 19, 2026";

type InlineLink = { href: string; label: string; suffix: string };

type Block =
  | { type: "p"; text: string; link?: InlineLink }
  | { type: "list"; items: string[] };

type PolicySection = {
  id: string;
  title: string;
  blocks: Block[];
};

const p = (text: string, link?: InlineLink): Block => ({ type: "p", text, link });
const list = (...items: string[]): Block => ({ type: "list", items });

const AT_A_GLANCE = [
  { value: "12 hrs", label: "Cancel at least 12 hours before class to get your credit back", href: "#booking-cancellation" },
  { value: "10 min", label: "Doors close 10 minutes after class starts", href: "#late-arrival" },
  { value: "30 days", label: "Freeze once every 12 months, for up to 30 days", href: "#membership-freeze" },
  { value: "14 days", label: "Notice needed before your next billing date to cancel a membership", href: "#membership-cancellation" },
  { value: "Final", label: "All payments are non-refundable", href: "#payments-refunds" },
];

const sections: PolicySection[] = [
  {
    id: "booking-cancellation",
    title: "Booking And Cancellation",
    blocks: [
      p("Our classes are small, so every booked spot is one another member could have taken. Please book only the classes you plan to attend."),
      p("You can cancel a booking in the app up to 12 hours before the class starts, and the credit is returned to your plan. Inside 12 hours, the booking can no longer be cancelled in the app and the credit is used."),
    ],
  },
  {
    id: "late-arrival",
    title: "Late Arrival",
    blocks: [
      p("Please arrive 5 to 10 minutes early so you have time to settle in, set up your equipment, and let your instructor know how your body is feeling that day."),
      p("Doors close 10 minutes after the class start time. To keep the class safe and uninterrupted, anyone arriving more than 10 minutes late will not be admitted, and the class is counted as used (no-show)."),
    ],
  },
  {
    id: "no-show",
    title: "No-Shows",
    blocks: [
      p("If you book a class and do not attend, and you did not cancel at least 12 hours before it started, the booking is marked as a no-show and the credit is lost."),
    ],
  },
  {
    id: "schedule-changes",
    title: "Schedule Changes By The Studio",
    blocks: [
      p("We may change, reschedule, or cancel a class, or substitute a different instructor. We give at least 12 hours' notice except in emergencies such as instructor illness, safety issues, or facility problems."),
      p("If we cancel a class you have booked, your credit is returned to your plan."),
    ],
  },
  {
    id: "plan-validity",
    title: "Plan Validity And Expiry",
    blocks: [
      p("Every membership and class pack has a validity period, shown at checkout and on your profile. Unused credits expire at the end of that period and cannot be carried over, refunded, or exchanged."),
      p("Validity is not extended for missed classes, holidays, or travel. The only way to extend a plan is a membership freeze, described below."),
    ],
  },
  {
    id: "membership-freeze",
    title: "Membership Freeze",
    blocks: [
      p("Life happens, so you can pause your membership or class pack once every 12 months, for 7 to 30 days at a time. You can schedule a freeze up to 30 days ahead yourself from your profile page."),
      list(
        "Your plan's expiry date moves out by the number of days you freeze.",
        "You cannot book classes while your plan is frozen.",
        "Any classes you have already booked inside the freeze window are cancelled and their credits are returned.",
        "For auto-renewing memberships, billing continues on its normal schedule. The frozen days are added on top of your membership, so you do not lose any paid time.",
        "You can end a freeze early. The unused days are handed back and your expiry date moves back accordingly.",
      ),
    ],
  },
  {
    id: "membership-cancellation",
    title: "Membership Cancellation",
    blocks: [
      p("Auto-renewing memberships need at least 14 days' notice before the next billing date to cancel."),
      list(
        "If you cancel 14 or more days before your next charge, renewal stops and you keep access until the end of your current paid period.",
        "If you cancel with less than 14 days to go, the next scheduled payment is still collected, and your membership ends at the end of that following period.",
      ),
      p("Class packs never auto-renew, so there is nothing to cancel. They simply end when their credits are used or their validity period ends."),
    ],
  },
  {
    id: "payments-refunds",
    title: "Payments And Refunds",
    blocks: [
      p("All payments are non-refundable. This includes memberships, class packs, drop-in classes, and demo classes, whether or not the credits are used."),
      p("If the studio cancels a class you booked, your credit is returned to your plan. Nothing in this policy limits any refund rights you have under applicable law."),
    ],
  },
  {
    id: "transfers",
    title: "No Transfers Or Sharing",
    blocks: [
      p("Memberships, class packs, and credits are personal to the member who bought them. They cannot be transferred, shared, or sold to another person."),
    ],
  },
  {
    id: "guest-passes",
    title: "Guest Passes",
    blocks: [
      p("Where your plan includes a guest pass, your guest is welcome to join you. Guests must follow all of these policies, including disclosing any relevant medical information before class, just as members do."),
    ],
  },
  {
    id: "minimum-age",
    title: "Minimum Age",
    blocks: [
      p("Members must be at least 16 years old. Members under 18 need the consent of a parent or legal guardian before booking."),
    ],
  },
  {
    id: "health-medical",
    title: "Health And Medical Disclosure",
    blocks: [
      p("Your safety matters more to us than any single class. Before your first class, and whenever anything changes, you must tell us about any medical conditions, injuries, surgeries, pregnancy or postnatal status, or medications that may affect exercise."),
      list(
        "After surgery or an injury, please bring your doctor's written clearance before returning to class.",
        "If you are pregnant, you need clearance from your doctor to take part. Tell your instructor at the start of every class so they can offer prenatal modifications.",
        "If you feel pain, dizziness, or discomfort at any point, stop and tell your instructor straight away.",
        "Your instructor may modify an exercise or ask you to sit out part or all of a class if they believe it is unsafe for you.",
        "If you are unwell or may be contagious, please stay home and look after yourself.",
      ),
      p("You take part in classes at your own risk and remain responsible for your own health decisions. If you are unsure whether a class is right for you, please consult a qualified medical professional first."),
    ],
  },
  {
    id: "studio-etiquette",
    title: "Studio Etiquette",
    blocks: [
      p("A few simple habits keep the studio calm, clean, and focused for everyone."),
      list(
        "Grip socks are mandatory on the equipment. If you forget yours, they are available at the studio.",
        "Classes are phone-free. Switch your phone to silent and keep it away for the whole class.",
        "Please arrive clean and wear comfortable, fitted clothing.",
        "No outdoor shoes in the studio area.",
        "Treat the equipment with care and wipe it down after use.",
        "Keep noise low and be respectful of instructors and other members.",
        "Personal belongings are your responsibility. The studio is not liable for lost or damaged items.",
      ),
    ],
  },
  {
    id: "photos-videos",
    title: "Photos And Videos",
    blocks: [
      p("We sometimes take photos and videos during classes to share on social media and in our marketing. By attending a class, you consent to appearing in this content."),
      p("If you would rather not be featured, email us at solpilatesstudio.in@gmail.com and we will avoid featuring you going forward."),
    ],
  },
  {
    id: "account-deletion",
    title: "Deleting Your Account",
    blocks: [
      p("Deleting your account permanently removes all remaining credits, active plans, and booking history. They cannot be restored or refunded."),
      p("Deleting your account also stops any auto-renewing membership immediately, so no further payments are taken, and any paid time left on it is forfeited. See the", {
        href: "/account-deletion",
        label: "account deletion page",
        suffix: " for how to delete your account.",
      }),
    ],
  },
  {
    id: "policy-changes",
    title: "Changes To These Policies",
    blocks: [
      p("We may update these policies from time to time. The latest version will always be posted on this page with the updated date at the top."),
    ],
  },
];

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-peach-200">
      <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[16vw] font-black text-peach-200 whitespace-nowrap font-display">
            POLICIES
          </span>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <p className="text-terra-300 text-xs font-bold tracking-widest uppercase mb-4">
              Last updated {UPDATED_AT}
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-peach-50 tracking-normal font-display">
              Studio Policies
            </h1>
            <p className="text-peach-400 mt-6 max-w-2xl leading-relaxed">
              These policies keep classes safe, fair, and focused for every member. Please read
              them before your first class. They sit alongside our{" "}
              <Link className="text-terra-300 font-bold" href="/terms">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl bg-peach-50 border border-peach-400/30 p-6 md:p-10">
            <div className="space-y-10">
              <section aria-labelledby="at-a-glance-heading" className="border-b border-peach-400/40 pb-10">
                <h2
                  id="at-a-glance-heading"
                  className="text-2xl md:text-3xl font-black text-olive-600 tracking-normal mb-6 font-display"
                >
                  At A Glance
                </h2>
                {/* Five tiles: 3 + 2 on desktop and 2 + 2 + 1 on tablet, so no row has a gap. */}
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 border-t border-l border-peach-400/40">
                  {AT_A_GLANCE.map((item, index) => (
                    <li
                      key={item.href}
                      className={`border-r border-b border-peach-400/40 ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${index === AT_A_GLANCE.length - 1 ? "sm:col-span-2" : ""}`}
                    >
                      <a
                        href={item.href}
                        className="block h-full p-4 hover:bg-peach-100 transition-colors"
                      >
                        <span className="block text-3xl font-black text-terra-400 font-display">
                          {item.value}
                        </span>
                        <span className="block mt-2 text-sm text-olive-400 leading-relaxed">
                          {item.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <h2 className="text-2xl md:text-3xl font-black text-olive-600 tracking-normal mb-4 font-display">
                    {section.title}
                  </h2>
                  <div className="space-y-4 text-olive-400 leading-relaxed">
                    {section.blocks.map((block, index) =>
                      block.type === "p" ? (
                        <p key={index}>
                          {block.text}
                          {block.link && (
                            <>
                              {" "}
                              <Link className="text-terra-400 font-bold" href={block.link.href}>
                                {block.link.label}
                              </Link>
                              {block.link.suffix}
                            </>
                          )}
                        </p>
                      ) : (
                        <ul key={index} className="list-disc pl-6 space-y-2 marker:text-terra-400">
                          {block.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ),
                    )}
                  </div>
                </section>
              ))}

              <section className="border-t border-peach-400/40 pt-8">
                <h2 className="text-2xl md:text-3xl font-black text-olive-600 tracking-normal mb-4 font-display">
                  Contact Us
                </h2>
                <div className="space-y-3 text-olive-400 leading-relaxed">
                  <p>
                    Questions about these policies can be sent to{" "}
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
