import React from 'react';
import { motion } from "framer-motion";

// --- Types ---
interface Testimonial {
    text: string;
    image: string;
    name: string;
    role: string;
}

// --- Data ---
const testimonials: Testimonial[] = [
    {
        text: "I was not able to spend much time with my daughter or do activities because of back pain. With Swetha's personalized approach, it not only helped alleviate my back pain but also allowed me to spend more quality time with my daughter. I felt more energetic and capable of participating in her activities. Another fantastic outcome was my improved performance in volleyball. Swetha's positive energy and encouragement created a welcoming environment where I felt comfortable sharing my progress and challenges.",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Srikanth Nomula",
        role: "Engineer",
    },
    {
        text: "I was struggling with lower back pain while bending and was not able to stretch completely during yoga poses. After starting my sessions with Swetha, I can do my yoga poses such as forward bends and back rolls with ease. Back rolls were impossible until lately.",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Pallavi Jalakam",
        role: "Engineer",
    },
    {
        text: "Because of my back pain, I become restless with my toddler and pain adds to make the already cranky situation worse. Since working with Swetha, my back has become more flexible and core and arm strength increased. I correct my sloppy posture when sitting and moving. I also realized how exercise bands can help me get stronger almost anywhere — even on the couch. Swetha teaches through layers, so we can pick whichever feels comfortable and feel a real sense of progress.",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Sushma Gurram",
        role: "Engineer",
    },
    {
        text: "Swetha has great energy in the room. She is passionate about movement and it shows (in the best way). Her cueing is clear, direct, and somehow makes you realize muscles you didn't even know you had are definitely working. She has a gift for helping clients dial in their form while building that all-important mind-body connection. Beyond that, Swetha brings such a warm, welcoming energy to the studio. I'd especially recommend her to anyone on a postpartum or prenatal journey.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Melinda Hattan",
        role: "Pilates Studio Owner & Instructor",
    },
    {
        text: "I tried Pilates after trying everything to heal my sciatica pain. After a lot of research, I decided to give Pilates one last shot — and it worked. My back pain is gone, I've built so much more muscle, and I feel genuinely confident in my body again. What stands out most about Swetha's classes is how warm and intentional she is. Her classes feel special — smooth, flowy, with minimal transitions — and you can feel the effort she puts into every session.",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Sai Shruthi Sayini",
        role: "Pilates Instructor",
    },
    {
        text: "I came to Pilates already doing yoga and walking, but I wanted to add real strength training. Swetha delivered exactly that — my stamina has noticeably improved. What I appreciate most is the curated approach she brings, both in class and in the practice videos she provides. She's patient, professional and genuinely invested in her clients' progress. If you're looking for interactive, results-driven Pilates sessions, Swetha is the place to go.",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Kanthisri",
        role: "Medical Coder",
    },
    {
        text: "I started with concerns about my strength, flexibility, and balance — and Pilates addressed every one of them. I have more confidence and better balance in my daily life. Swetha leads focused, challenging classes with a calm, clear energy that keeps you motivated throughout. I'd recommend her to anyone looking to feel stronger and more capable in their everyday movement.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Shelli",
        role: "Operations Manager",
    },
    {
        text: "I came to Swetha dealing with sciatica and severe lower back pain. After completing her online back pain course twice consistently, I'd say 70–80% of my pain is gone and I feel significantly better. Her instruction is clear, precise and easy to follow, which made all the difference in staying consistent. I've already recommended her to friends and family, and I'll keep doing so. My one piece of advice: stick with it consistently, exactly as she instructs, and you will see results.",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
        name: "Abhinav",
        role: "Software Engineer",
    },
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 8);

// --- Sub-Components ---
const TestimonialsColumn = (props: {
    className?: string;
    testimonials: Testimonial[];
    duration?: number;
}) => {
    return (
        <div className={props.className}>
            <motion.ul
                animate={{
                    translateY: "-50%",
                }}
                transition={{
                    duration: props.duration || 10,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop",
                }}
                className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
            >
                {[
                    ...new Array(2).fill(0).map((_, index) => (
                        <React.Fragment key={index}>
                            {props.testimonials.map(({ text, image, name, role }, i) => (
                                <motion.li
                                    key={`${index}-${i}`}
                                    aria-hidden={index === 1 ? "true" : "false"}
                                    tabIndex={index === 1 ? -1 : 0}
                                    whileHover={{
                                        scale: 1.03,
                                        y: -8,
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                                        transition: { type: "spring", stiffness: 400, damping: 17 }
                                    }}
                                    whileFocus={{
                                        scale: 1.03,
                                        y: -8,
                                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                                        transition: { type: "spring", stiffness: 400, damping: 17 }
                                    }}
                                    className="p-8 rounded-2xl border border-peach-400 bg-peach-300 shadow-xl max-w-xs w-full transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-terra-400/30"
                                >
                                    <blockquote className="m-0 p-0">
                                        <p className="text-olive-300 leading-relaxed font-normal m-0 text-base">
                                            {text}
                                        </p>
                                        <footer className="flex items-center gap-3 mt-6">
                                            <img
                                                width={40}
                                                height={40}
                                                src={image}
                                                alt={`Avatar of ${name}`}
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-peach-400 group-hover:ring-terra-400/40 transition-all duration-300"
                                            />
                                            <div className="flex flex-col">
                                                <cite className="font-semibold not-italic tracking-normal leading-5 text-olive-600">
                                                    {name}
                                                </cite>
                                                <span className="text-sm leading-5 tracking-normal text-terra-400/70 mt-0.5">
                                                    {role}
                                                </span>
                                            </div>
                                        </footer>
                                    </blockquote>
                                </motion.li>
                            ))}
                        </React.Fragment>
                    )),
                ]}
            </motion.ul>
        </div>
    );
};

export default function TestimonialsSection() {
    return (
        <section
            aria-labelledby="testimonials-heading"
            className="bg-peach-200 py-24 relative overflow-hidden"
        >
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                    opacity: { duration: 0.8 }
                }}
                className="container px-4 z-10 mx-auto"
            >
                <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
                    <h2 id="testimonials-heading" className="text-4xl md:text-5xl font-extrabold tracking-normal mt-6 text-center text-olive-600 font-display">
                        What our members say
                    </h2>
                    <p className="text-center mt-5 text-olive-300 text-lg leading-relaxed max-w-sm">
                        Join women who have transformed their practice with SOL Pilates.
                    </p>
                </div>

                <div
                    className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
                    role="region"
                    aria-label="Scrolling Testimonials"
                >
                    <TestimonialsColumn testimonials={firstColumn} duration={25} />
                    <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={35} />
                    <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={30} />
                </div>
            </motion.div>
        </section>
    );
}
