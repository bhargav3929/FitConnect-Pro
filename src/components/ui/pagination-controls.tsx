"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationControlsProps {
    page: number
    totalItems: number
    pageSize: number
    itemLabel: string
    onPageChange: (page: number) => void
}

export function PaginationControls({
    page,
    totalItems,
    pageSize,
    itemLabel,
    onPageChange,
}: PaginationControlsProps) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
    const end = Math.min(totalItems, page * pageSize)

    if (totalItems <= pageSize) {
        return (
            <div className="flex items-center justify-between gap-3 border-t border-peach-400/15 px-4 py-3 text-xs text-olive-300">
                <span>
                    Showing {totalItems} {itemLabel}
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-peach-400/15 px-4 py-3 text-xs text-olive-300">
            <span>
                Showing {start}-{end} of {totalItems} {itemLabel}
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 inline-flex items-center justify-center border border-peach-400/20 text-olive-400 hover:border-terra-400/40 hover:text-terra-400 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-20 text-center font-mono text-[11px] text-olive-400">
                    {page} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="h-8 w-8 inline-flex items-center justify-center border border-peach-400/20 text-olive-400 hover:border-terra-400/40 hover:text-terra-400 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
