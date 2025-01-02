import { cn } from "@/utils"
import { HtmlHTMLAttributes } from "react"

interface HeadingProps extends HtmlHTMLAttributes<HTMLHeadingElement> {
    children: React.ReactNode
    className?: string
}

export const Heading = ({ children, className, ...props}: HeadingProps) => {
    return(
        <h1 className={cn("text-4xl sm:text-5xl text-pretty font-heading font-semibold tracking-tight text-zinc-800",className)} {...props}>
            {children}
        </h1>
    )
}