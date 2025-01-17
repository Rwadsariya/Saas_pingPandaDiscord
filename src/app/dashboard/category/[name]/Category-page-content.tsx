/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { client } from "@/lib/client"
import { EventCategory } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { BarChartIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"
import { EmptyCategoryState } from "./empty-category-state"
import { isAfter, isToday, startOfMonth, startOfWeek } from "date-fns"

interface CategoryPageContentProps {
    hasEvent?: boolean
    category: EventCategory
}

export const CategoryPageContent = ({ hasEvent: initialHasEvent, category }: CategoryPageContentProps) => {

    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "30", 10)

    const [pagination, setPagination] = useState({
        pageIndex: page - 1,
        pageSize: limit
    })

    const [activeTab, setActiveTab] = useState<"today" | "week" | "month">("today")

    const { data: pollingData } = useQuery({
        queryKey: ["category", category.name, "hasEvent"],
        initialData: { hasEvent: initialHasEvent },
    });

    if (!pollingData.hasEvent) {
        return <EmptyCategoryState categoryName={category.name} />
    }

    const { data } = useQuery({
        queryKey: ["events", category.name, pagination.pageIndex, pagination.pageSize, activeTab],
        queryFn: async () => {
            const res = await client.category.getEventsByCategoryName.$get({
                name: category.name,
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                timeRange: activeTab
            })

            return await res.json()
        },
        refetchOnWindowFocus: false,
        enabled: pollingData.hasEvent
    })

    const numericFieldSums = useMemo(() => {
        if (!data?.events || data.events.length === 0) return {}

    const sums: Record<
      string,
      {
        total: number
        thisWeek: number
        thisMonth: number
        today: number
      }
    > = {}

    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 })
    const monthStart = startOfMonth(now)

    data.events.forEach((event) => {
      const eventDate = event.createdAt

      Object.entries(event.fields as object).forEach(([field, value]) => {
        if (typeof value === "number") {
          if (!sums[field]) {
            sums[field] = { total: 0, thisWeek: 0, thisMonth: 0, today: 0 }
          }

          sums[field].total += value

          if (
            isAfter(eventDate, weekStart) ||
            eventDate.getTime() === weekStart.getTime()
          ) {
            sums[field].thisWeek += value
          }

          if (
            isAfter(eventDate, monthStart) ||
            eventDate.getTime() === monthStart.getTime()
          ) {
            sums[field].thisMonth += value
          }

          if (isToday(eventDate)) {
            sums[field].today += value
          }
        }
      })
    })

    return sums
    }, [data?.events])

    const NumericFieldCards = () => {
        console.log("inside NumericFieldCards")
        console.log(numericFieldSums)
        if (Object.keys(numericFieldSums).length === 0) {
            return null
        }
        return Object.entries(numericFieldSums).map(([field, sums]) => {
            const relevantSums = activeTab === "today" ? sums.today : activeTab === "week" ? sums.thisWeek : sums.thisMonth

            return (<Card key={field} >
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <p className="text-sm/6 font-medium">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                    </p>
                    <BarChartIcon className="size-4 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{relevantSums.toFixed(2)}</p>
                    <p className="text-xs/5 text-muted-foreground">
                        {activeTab === "today" ? "today" : activeTab === "week" ? "this week" : "this month"}
                    </p>
                </div>
            </Card>)
        })
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value as 'today' | 'week' | 'month')
            }}>
                <TabsList className="mb-2">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">This week</TabsTrigger>
                    <TabsTrigger value="month">This month</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                        <Card className="border-2 border-brand-700">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <p className="text-sm/6 font-medium">
                                    Total Events
                                </p>
                                <BarChartIcon className="size-4 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data?.eventCount || 0}</p>
                                <p className="text-xs/5 text-muted-foreground">
                                    Events {activeTab === "today" ? "today" : activeTab === "week" ? "this week" : "this month"}
                                </p>
                            </div>
                        </Card>

                        <NumericFieldCards></NumericFieldCards>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}