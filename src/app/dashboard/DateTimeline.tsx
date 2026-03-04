"use client"

import { useMemo, useEffect, useRef } from "react"
import { addDays, subDays, format, isSameDay, startOfToday } from "date-fns"
import { cn } from "@/lib/utils"

interface Props {
    selectedDate: Date
    onSelectDate: (d: Date) => void
}

export default function DateTimeline({ selectedDate, onSelectDate }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const today = startOfToday()

    // Generate 15 days before and 15 days after today
    const days = useMemo(() => {
        const list = []
        for (let i = 15; i >= 1; i--) {
            list.push(subDays(today, i))
        }
        list.push(today)
        for (let i = 1; i <= 15; i++) {
            list.push(addDays(today, i))
        }
        return list
    }, [today])

    // Scroll to center today on mount (hacky approach but works for simple UI)
    useEffect(() => {
        if (scrollRef.current) {
            const todayEl = scrollRef.current.querySelector('[data-istoday="true"]')
            if (todayEl) {
                todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
            }
        }
    }, [])

    return (
        <div className="relative">
            <div
                ref={scrollRef}
                className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide snap-x px-2"
                style={{ scrollbarWidth: "none" }}
            >
                {days.map((d, i) => {
                    const isSelected = isSameDay(d, selectedDate)
                    const isToday = isSameDay(d, today)

                    return (
                        <button
                            key={i}
                            data-istoday={isToday}
                            onClick={() => onSelectDate(d)}
                            className={cn(
                                "flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl transition-all duration-200 snap-center border",
                                isSelected
                                    ? "bg-zinc-900 text-zinc-50 border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-md transform scale-105"
                                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800",
                                isToday && !isSelected && "ring-2 ring-blue-500/50"
                            )}
                        >
                            <span className="text-xs font-medium uppercase tracking-wider mb-1">
                                {format(d, "EEE")}
                            </span>
                            <span className="text-xl font-bold">
                                {format(d, "d")}
                            </span>
                            {isToday && (
                                <span className={cn("text-[10px] uppercase font-bold mt-1", isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-blue-500")}>
                                    Today
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
