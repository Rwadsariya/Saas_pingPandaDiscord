import React from "react"
import { Button } from "./ui/button"
import { ArrowLeft } from "lucide-react"
import { Heading } from "./heading"

interface DashboardPageProps {
    title: string
    children?: React.ReactNode
    hideBackButton?: boolean
    cta?: React.ReactNode
}



export const DashboardPage = ({ title, children, cta, hideBackButton }: DashboardPageProps) => {
    return (
        <section className="flex-1 h-full w-full flex flex-col">
            <div className=" w-full p-6 sm:p-8 flex justify-between border-b border-gray-200">
                <div className="w-full flex flex-col sm:flex-row sm:items-center items-start gap-6">
                    <div className="flex items-center gap-8">
                    {hideBackButton ? null : (<Button className="w-fit bg-white" variant={"outline"}>
                        <ArrowLeft className="size-4" />
                    </Button>)}

                    <Heading>{title}</Heading>
                    </div>

                    {cta ? <div className="w-full">{cta}</div> : null}
                </div>
            </div>

            <div className="flex-1 p-6 sm:p-8 flex flex-col overflow-y-auto">
                {children}
            </div>
        </section>
    )
}

