import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-shimmer bg-muted/50 rounded-md", className)}
            style={{
                backgroundImage: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                backgroundSize: "200% 100%",
                backgroundRepeat: "no-repeat"
            }}
            {...props}
        />
    )
}

export { Skeleton }
