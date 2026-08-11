"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { trpc } from "@volcano/trpc/react";
import type { SchedulerMetricsSnapshot } from "@volcano/trpc/server/utils/prometheus-parser";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ActionLatencyBarChart } from "./action-latency-bar-chart";
import {
    LatencyLineChart,
    type LatencyHistoryPoint,
} from "./latency-line-chart";
import { MetricsStatCards } from "./metrics-stat-cards";

const HISTORY_LIMIT = 20;
const POLL_INTERVAL_MS = 15_000;

function formatClock(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function toHistoryPoint(snapshot: SchedulerMetricsSnapshot): LatencyHistoryPoint {
    const plugins: Record<string, number> = {};
    for (const row of snapshot.pluginLatency.slice(0, 6)) {
        const key = `${row.plugin}/${row.onSession}`;
        plugins[key] = row.avgMs;
    }
    return {
        time: formatClock(snapshot.scrapedAt),
        e2eLatencyMs: snapshot.e2eLatencyMs,
        plugins,
    };
}

export function MetricsTab() {
    const [history, setHistory] = useState<LatencyHistoryPoint[]>([]);

    const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
        trpc.schedulerRouter.getMetrics.useQuery(undefined, {
            refetchInterval: POLL_INTERVAL_MS,
            refetchOnWindowFocus: false,
            retry: 1,
        });

    useEffect(() => {
        if (!data) return;
        const point = toHistoryPoint(data);
        setHistory((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.time === point.time && last.e2eLatencyMs === point.e2eLatencyMs) {
                return prev;
            }
            return [...prev, point].slice(-HISTORY_LIMIT);
        });
    }, [data, dataUpdatedAt]);

    const scrapedLabel = useMemo(() => {
        if (!data?.scrapedAt) return null;
        return formatClock(data.scrapedAt);
    }, [data?.scrapedAt]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                    {scrapedLabel
                        ? `Last scrape ${scrapedLabel} · polling every 15s`
                        : "Polling scheduler /metrics every 15s"}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                >
                    {isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">Refresh</span>
                </Button>
            </div>

            {isError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Metrics unavailable</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p>{error?.message ?? "Failed to fetch scheduler metrics"}</p>
                        <ul className="list-disc pl-4 text-sm">
                            <li>
                                Ensure the scheduler runs with{" "}
                                <code className="text-xs">--enable-metrics=true</code>
                            </li>
                            <li>
                                Confirm{" "}
                                <code className="text-xs">
                                    volcano-scheduler-service
                                </code>{" "}
                                exposes port 8080
                            </li>
                            <li>
                                Locally:{" "}
                                <code className="text-xs">
                                    kubectl -n volcano-system port-forward
                                    svc/volcano-scheduler-service 18080:8080
                                </code>{" "}
                                and set{" "}
                                <code className="text-xs">
                                    VOLCANO_SCHEDULER_METRICS_URL=http://localhost:18080/metrics
                                </code>
                            </li>
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <MetricsStatCards metrics={data} isLoading={isLoading && !data} />

            <div className="grid gap-4 xl:grid-cols-2">
                <LatencyLineChart
                    history={history}
                    isLoading={isLoading && history.length === 0}
                />
                <ActionLatencyBarChart
                    data={data?.actionLatency ?? []}
                    isLoading={isLoading && !data}
                />
            </div>
        </div>
    );
}
