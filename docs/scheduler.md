# Scheduler

The **Scheduler** page (`/scheduler`) has two tabs:

1. **Config** — view and edit the Volcano scheduler policy stored in `volcano-scheduler-configmap`
2. **Metrics** — scrape and visualize the scheduler Prometheus `/metrics` endpoint

## Config tab

### What you can configure

- **Action pipeline** — drag to reorder the scheduling actions executed each cycle (`enqueue`, `allocate`, `backfill`, etc.)
- **Plugin tiers** — add/remove tiers and plugins; toggle per-plugin `enable*` flags
- **Plugin arguments** — edit typed fields for common plugins (e.g. `binpack.weight`, `predicate.GPUSharingEnable`)
- **Action configurations** — optional per-action argument blocks
- **YAML diff preview** — see changes before saving

### Requirements

- Volcano installed with `volcano-scheduler-configmap` in `volcano-system`
- Dashboard RBAC must allow ConfigMap `get`, `update`, and `patch` on `volcano-scheduler-configmap` (included in `deployment/volcano-dashboard.yaml`)

After upgrading the dashboard manifest, re-apply RBAC if you deployed before this feature:

```bash
kubectl apply -f deployment/volcano-dashboard.yaml
```

### Save behavior

1. The UI validates action and plugin names against Volcano’s registered set.
2. On **Save**, the dashboard replaces the ConfigMap data key using optimistic concurrency (`resourceVersion`).
3. The Volcano scheduler watches the mounted config file and **hot-reloads** policy without restarting the pod.

## Metrics tab

The Metrics tab polls the scheduler Prometheus endpoint every 15 seconds and shows:

- Stat cards for unschedulable jobs/tasks, total preemptions, and current e2e latency
- A line chart of e2e + top plugin latency (client-side ring buffer of ~20 scrapes)
- A bar chart of per-action average latency from the latest scrape

### Metric mapping

| UI label | Prometheus metric |
|----------|-------------------|
| Unschedulable jobs | `volcano_unschedule_job_count` |
| Unschedulable tasks | sum of `volcano_unschedule_task_count` |
| Total preemptions | `volcano_total_preemption_attempts` |
| E2E latency | avg from `volcano_e2e_scheduling_latency_milliseconds` (`_sum` / `_count`) |
| Plugin latency series | `volcano_plugin_scheduling_latency_milliseconds{plugin,OnSession}` |
| Action latency bars | `volcano_action_scheduling_latency_milliseconds{action}` |

No extra RBAC is required — the dashboard fetches the metrics URL over HTTP (in-cluster service DNS by default).

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VOLCANO_SCHEDULER_CONFIGMAP_NAMESPACE` | `volcano-system` | Namespace of the scheduler ConfigMap |
| `VOLCANO_SCHEDULER_CONFIGMAP_NAME` | `volcano-scheduler-configmap` | ConfigMap name |
| `VOLCANO_SCHEDULER_CONFIG_KEY` | `volcano-scheduler.conf` | Data key containing scheduler YAML |
| `VOLCANO_SCHEDULER_METRICS_URL` | `http://volcano-scheduler-service.volcano-system.svc:8080/metrics` | Scheduler Prometheus metrics URL |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 403 Forbidden on load/save | Re-apply `deployment/volcano-dashboard.yaml` for ConfigMap RBAC |
| ConfigMap was modified by another user | Click **Refresh**, then re-apply your edits |
| Unknown action errors on save | Use only action names registered in your Volcano version |
| Unknown plugin warnings | Custom plugins are allowed; confirm the name is intentional |
| Metrics tab empty / connection refused | Ensure scheduler runs with `--enable-metrics=true` and `volcano-scheduler-service:8080` is reachable |
| Metrics timeout locally | Port-forward and set `VOLCANO_SCHEDULER_METRICS_URL` (see below) |

## Local development

Port-forward the dashboard and ensure your kubeconfig can read/patch the scheduler ConfigMap:

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80
```

For Metrics while developing outside the cluster:

```bash
kubectl -n volcano-system port-forward svc/volcano-scheduler-service 18080:8080
export VOLCANO_SCHEDULER_METRICS_URL=http://localhost:18080/metrics
```

If the scheduler ConfigMap is in a different namespace, set `VOLCANO_SCHEDULER_CONFIGMAP_NAMESPACE`.
