import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

const Button = React.forwardRef<
    HTMLButtonElement,
    HTMLMotionProps<"button"> & { variant?: 'primary' | 'secondary' | 'outline' }
>(({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
        primary: "bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-600 hover:to-emerald-600 shadow-[0_0_20px_rgba(14,165,233,0.3)]",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
        outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-200"
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
                variants[variant],
                className
            )}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
