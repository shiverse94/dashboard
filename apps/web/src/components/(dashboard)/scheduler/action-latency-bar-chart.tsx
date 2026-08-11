"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Loader2Icon } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type ActionLatencyPoint = {
    action: string;
    avgMs: number;
};

type ActionLatencyBarChartProps = {
    data: ActionLatencyPoint[];
    isLoading?: boolean;
};

const chartConfig = {
    avgMs: {
        label: "Avg latency (ms)",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

export function ActionLatencyBarChart({ data, isLoading }: ActionLatencyBarChartProps) {
    const chartData = useMemo(
        () =>
            [...data]
                .sort((a, b) => b.avgMs - a.avgMs)
                .map((row) => ({
                    action: row.action,
                    avgMs: Number(row.avgMs.toFixed(2)),
                })),
        [data]
    );

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Action latency</CardTitle>
                <CardDescription>
                    Average per-action scheduling latency from the latest scrape
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                        <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
                        Loading action latency...
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                        No action latency samples yet.
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[280px] w-full">
                        <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="action"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={48}
                                tickFormatter={(value) => `${value}`}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                                dataKey="avgMs"
                                fill="var(--color-avgMs)"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
