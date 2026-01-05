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
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/store/authStore"

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
})

interface LoginModalProps {
    trigger?: React.ReactNode;
    defaultOpen?: boolean;
    isOpenOverride?: boolean;
    onCloseOverride?: () => void;
}

export function LoginModal({ trigger, defaultOpen = false, isOpenOverride, onCloseOverride }: LoginModalProps) {
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

    const isModalOpen = isOpenOverride !== undefined ? isOpenOverride : internalOpen;
    const setModalOpen = (open: boolean) => {
        if (onCloseOverride && !open) {
            onCloseOverride();
        } else {
            setInternalOpen(open);
        }
    }
    const [isLoading, setIsLoading] = React.useState(false)

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        try {
            setIsLoading(true)
            await signInWithEmailAndPassword(auth, values.email, values.password)
            toast.success("Welcome back!")
            setModalOpen(false)
        } catch (error: any) {
            console.error(error)
            toast.error("Invalid email or password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="ghost">Log in</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Welcome back</DialogTitle>
                    <DialogDescription>
                        Enter your credentials to access your account.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Log In
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
