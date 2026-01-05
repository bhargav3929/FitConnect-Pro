"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase/config"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/authStore"

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    age: z.coerce.number().min(16, "Must be at least 16 years old"),
})

interface SignupModalProps {
    onSuccess?: () => void
    onClose?: () => void
    trigger?: React.ReactNode
}

// Define the form data type
type SignupFormValues = z.infer<typeof signupSchema>

export function SignupModal({ onSuccess, onClose, trigger }: SignupModalProps) {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const { setUser } = useAuthStore()

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            password: "",
            age: 18,
        },
    })

    async function onSubmit(values: z.infer<typeof signupSchema>) {
        try {
            setIsLoading(true)

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                values.email,
                values.password
            )

            // 2. Update Profile
            await updateProfile(userCredential.user, {
                displayName: values.name,
            })

            // 3. Create User Document (Simulating Cloud Function here for immediate feedback)
            // Ideally this is done by onUserCreate trigger, but good to have client-side optimistic update or redundant write
            const userData = {
                uid: userCredential.user.uid,
                email: values.email,
                name: values.name,
                age: values.age,
                fitnessGoals: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                subscription: {
                    planType: null,
                    startDate: null,
                    endDate: null,
                    status: 'expired',
                    classesRemaining: 0
                },
                stats: {
                    totalClassesAttended: 0,
                    currentStreak: 0,
                    longestStreak: 0
                }
            }

            await setDoc(doc(db, "users", userCredential.user.uid), userData)

            // Update local store immediately for snappiness
            // @ts-ignore - Timestamp type mismatch between local and server
            setUser(userData);

            toast.success("Account created successfully!")
            setOpen(false)
            onSuccess?.()
            onClose?.()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="default">Sign Up</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create your account</DialogTitle>
                    <DialogDescription>
                        Join FitConnect Pro to access premium classes.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="john@example.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input placeholder="******" type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Age</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
