"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import { Loader2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export type LatencyHistoryPoint = {
    time: string;
    e2eLatencyMs: number | null;
    plugins: Record<string, number>;
};

type LatencyLineChartProps = {
    history: LatencyHistoryPoint[];
    isLoading?: boolean;
};

const PLUGIN_COLORS = [
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(210 70% 50%)",
    "hsl(160 60% 40%)",
];

export function LatencyLineChart({ history, isLoading }: LatencyLineChartProps) {
    const pluginKeys = useMemo(() => {
        const keys = new Set<string>();
        for (const point of history) {
            for (const key of Object.keys(point.plugins)) {
                keys.add(key);
            }
        }
        return Array.from(keys).slice(0, 6);
    }, [history]);

    const [hiddenPlugins, setHiddenPlugins] = useState<Set<string>>(new Set());

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {
            e2eLatencyMs: {
                label: "E2E",
                color: "hsl(var(--chart-1))",
            },
        };
        pluginKeys.forEach((key, index) => {
            config[key] = {
                label: key,
                color: PLUGIN_COLORS[index % PLUGIN_COLORS.length],
            };
        });
        return config;
    }, [pluginKeys]);

    const chartData = useMemo(
        () =>
            history.map((point) => ({
                time: point.time,
                e2eLatencyMs:
                    point.e2eLatencyMs === null
                        ? null
                        : Number(point.e2eLatencyMs.toFixed(2)),
                ...Object.fromEntries(
                    pluginKeys.map((key) => [
                        key,
                        point.plugins[key] !== undefined
                            ? Number(point.plugins[key]!.toFixed(2))
                            : null,
                    ])
                ),
            })),
        [history, pluginKeys]
    );

    const togglePlugin = (key: string) => {
        setHiddenPlugins((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Scheduling latency</CardTitle>
                <CardDescription>
                    E2E and top plugin averages accumulated from 15s polls
                </CardDescription>
                {pluginKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                        {pluginKeys.map((key) => {
                            const hidden = hiddenPlugins.has(key);
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => togglePlugin(key)}
                                    className="focus:outline-none"
                                >
                                    <Badge
                                        variant={hidden ? "outline" : "secondary"}
                                        className={
                                            hidden
                                                ? "opacity-50 font-normal"
                                                : "font-normal"
                                        }
                                    >
                                        {key}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {isLoading && history.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        <Loader2Icon className="h-6 w-6 animate-spin mr-2" />
                        Waiting for first scrape...
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                        No latency samples yet.
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <LineChart data={chartData} margin={{ left: 8, right: 8 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="time"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={24}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={48}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Line
                                type="monotone"
                                dataKey="e2eLatencyMs"
                                stroke="var(--color-e2eLatencyMs)"
                                strokeWidth={2}
                                dot={false}
                                connectNulls
                            />
                            {pluginKeys
                                .filter((key) => !hiddenPlugins.has(key))
                                .map((key) => (
                                    <Line
                                        key={key}
                                        type="monotone"
                                        dataKey={key}
                                        stroke={`var(--color-${key})`}
                                        strokeWidth={1.5}
                                        dot={false}
                                        connectNulls
                                    />
                                ))}
                        </LineChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
}
