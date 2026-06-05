'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@fitconnect/shared/firebase/config';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { Button } from '@/components/ui/button';
import { useIntroClassLead } from '@/lib/hooks/useIntroClassLead';

type FormState = {
    name: string;
    email: string;
    phone: string;
    goals: string;
    concerns: string;
};

const EMPTY: FormState = { name: '', email: '', phone: '', goals: '', concerns: '' };

export default function IntroClassPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, initAuth, clientUser } = useClientAuthStore();
    const { hasIntroClassLead } = useIntroClassLead();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const unsubscribe = initAuth();
        return () => unsubscribe();
    }, [initAuth]);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.replace('/user/login?tab=signup&returnTo=/intro-class');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (clientUser) {
            setForm((f) => ({
                ...f,
                name: f.name || clientUser.name || '',
                email: f.email || clientUser.email || '',
            }));
        }
    }, [clientUser]);

    if (isLoading || !isAuthenticated) {
        return (
            <main className="min-h-screen bg-peach-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-peach-400/30 border-t-terra-400 rounded-full animate-spin" />
                    <p className="text-olive-300 text-sm tracking-wider">REDIRECTING...</p>
                </div>
            </main>
        );
    }

    const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isAuthenticated) {
            router.push('/user/login?tab=signup&returnTo=/intro-class');
            return;
        }

        if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
            setError('Name, email, and phone are required.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            setError('Please enter a valid email.');
            return;
        }

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'introClassLeads'), {
                ...form,
                userId: clientUser?.id ?? null,
                source: 'intro-class-form',
                status: 'new',
                createdAt: serverTimestamp(),
            });
            setDone(true);
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (hasIntroClassLead === true && !done) {
        return (
            <main className="min-h-screen bg-peach-50 flex items-center justify-center p-6">
                <div className="max-w-lg text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black text-olive-600 uppercase tracking-normal">
                        Intro Class Booked
                    </h1>
                    <p className="text-olive-400 leading-relaxed">
                        You&apos;ve already booked your intro class. Swetha will be in touch — we can&apos;t wait
                        to see you on the reformer.
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold tracking-wide h-12 px-8 rounded-xl"
                    >
                        BACK HOME
                    </Button>
                </div>
            </main>
        );
    }

    if (done) {
        return (
            <main className="min-h-screen bg-peach-50 flex items-center justify-center p-6">
                <div className="max-w-lg text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black text-olive-600 uppercase tracking-normal">
                        You&apos;re in.
                    </h1>
                    <p className="text-olive-400 leading-relaxed">
                        Swetha will reach out shortly to lock in your 30-minute intro session.
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold tracking-wide h-12 px-8 rounded-xl"
                    >
                        BACK HOME
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-peach-50 py-16 px-6">
            <div className="max-w-xl mx-auto space-y-8">
                <header className="space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black text-olive-600 uppercase tracking-normal">
                        Intro Drop-In
                    </h1>
                    <p className="text-olive-400 leading-relaxed">
                        30 minutes, no commitment, completely free. Tell us a little about yourself and we&apos;ll
                        be in touch to schedule.
                    </p>
                </header>

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Full name *" htmlFor="name">
                        <input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={update('name')}
                            required
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Email *" htmlFor="email">
                        <input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={update('email')}
                            required
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Phone *" htmlFor="phone">
                        <input
                            id="phone"
                            type="tel"
                            value={form.phone}
                            onChange={update('phone')}
                            required
                            className={inputCls}
                        />
                    </Field>

                    <Field label="What are your goals?" htmlFor="goals">
                        <textarea
                            id="goals"
                            value={form.goals}
                            onChange={update('goals')}
                            rows={3}
                            className={inputCls}
                            placeholder="Strength, flexibility, recovery, weight loss..."
                        />
                    </Field>

                    <Field label="Any concerns or injuries?" htmlFor="concerns">
                        <textarea
                            id="concerns"
                            value={form.concerns}
                            onChange={update('concerns')}
                            rows={3}
                            className={inputCls}
                            placeholder="Anything we should know before your first session"
                        />
                    </Field>

                    {error && (
                        <p className="text-sm font-semibold text-red-600" role="alert">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold tracking-wide h-12 rounded-xl disabled:opacity-60"
                    >
                        {submitting ? 'SUBMITTING…' : 'BOOK MY INTRO CLASS'}
                    </Button>
                </form>
            </div>
        </main>
    );
}

const inputCls =
    'w-full rounded-xl border border-peach-400/30 bg-peach-50 px-4 py-3 text-olive-600 placeholder:text-olive-300 focus:border-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400/30';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="block space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-olive-400">{label}</span>
            {children}
        </label>
    );
}
