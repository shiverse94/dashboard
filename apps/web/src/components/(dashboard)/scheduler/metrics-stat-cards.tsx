"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SchedulerMetricsSnapshot } from "@volcano/trpc/server/utils/prometheus-parser";

type MetricsStatCardsProps = {
    metrics?: SchedulerMetricsSnapshot;
    isLoading?: boolean;
};

function formatLatency(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) return "—";
    if (ms < 1) return `${ms.toFixed(2)} ms`;
    if (ms < 100) return `${ms.toFixed(1)} ms`;
    return `${Math.round(ms)} ms`;
}

function StatCard({
    title,
    value,
    hint,
    isLoading,
}: {
    title: string;
    value: string;
    hint?: string;
    isLoading?: boolean;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                ) : (
                    <div className="text-2xl font-semibold tabular-nums">{value}</div>
                )}
                {hint && (
                    <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                )}
            </CardContent>
        </Card>
    );
}

export function MetricsStatCards({ metrics, isLoading }: MetricsStatCardsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                title="Unschedulable jobs"
                value={String(metrics?.unschedulableJobs ?? 0)}
                hint="volcano_unschedule_job_count"
                isLoading={isLoading}
            />
            <StatCard
                title="Unschedulable tasks"
                value={String(metrics?.unschedulableTasks ?? 0)}
                hint="sum of volcano_unschedule_task_count"
                isLoading={isLoading}
            />
            <StatCard
                title="Total preemptions"
                value={String(metrics?.totalPreemptions ?? 0)}
                hint="volcano_total_preemption_attempts"
                isLoading={isLoading}
            />
            <StatCard
                title="E2E latency"
                value={formatLatency(metrics?.e2eLatencyMs)}
                hint="avg volcano_e2e_scheduling_latency_milliseconds"
                isLoading={isLoading}
            />
        </div>
    );
}
