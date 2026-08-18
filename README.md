# Volcano dashboard

## Overview

The volcano dashboard provides a basic dashboard that can be easily deployed in your kubernetes cluster to show the status of resources including volcano jobs, queues, pods, scheduler configuration, and scheduler metrics.

<img src="docs/images/demo.gif" alt="volcano dashboard" style="zoom:50%;" />

## Scheduler

The **Scheduler** page (`/scheduler`) has two tabs:

- **Config** — read and write `volcano-scheduler-configmap`: reorder actions, edit plugin tiers and toggles, preview YAML diffs, and save via the Kubernetes API
- **Metrics** — poll the scheduler Prometheus `/metrics` endpoint and show unschedulable counts, preemptions, and scheduling latency

See [docs/scheduler.md](docs/scheduler.md) for usage, RBAC, environment variables, and troubleshooting.

Relevant environment variables:

| Variable | Default |
|----------|---------|
| `VOLCANO_SCHEDULER_CONFIGMAP_NAMESPACE` | `volcano-system` |
| `VOLCANO_SCHEDULER_CONFIGMAP_NAME` | `volcano-scheduler-configmap` |
| `VOLCANO_SCHEDULER_CONFIG_KEY` | `volcano-scheduler.conf` |
| `VOLCANO_SCHEDULER_METRICS_URL` | `http://volcano-scheduler-service.volcano-system.svc:8080/metrics` |

After upgrading to a build that includes Config editing, re-apply the dashboard manifest so the ServiceAccount can patch the scheduler ConfigMap:

```bash
kubectl apply -f deployment/volcano-dashboard.yaml
```

## Design

You can follow the [design doc](docs/design.md) to learn more about the design details.

## Installation

### Prerequisites

Before installing the volcano dashboard, please ensure you have:
- A running Kubernetes cluster
- `kubectl` configured to access your cluster
- [Volcano](https://github.com/volcano-sh/volcano) installed on your cluster (see [Install Volcano](#install-volcano) below if needed)

### Install from the published manifest

This deploys the default image (`volcanosh/volcano-dashboard:latest`) from the manifest.

1. Create the `volcano-system` namespace (if it does not exist):

```bash
kubectl create ns volcano-system --dry-run=client -o yaml | kubectl apply -f -
```

2. Deploy the volcano dashboard:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/dashboard/main/deployment/volcano-dashboard.yaml
```

3. Access the dashboard by port-forwarding the service:

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80 --address 0.0.0.0
```

4. Open your browser:
   - Local: [http://localhost:8080](http://localhost:8080)
   - Remote: `http://<NODE_IP>:8080` (replace `<NODE_IP>` with your node IP)

### Install with a locally built image

Use this when you want to run your own build instead of the published image (for example on [kind](https://kind.sigs.k8s.io/)).

1. Build the image from the repository root:

```bash
docker build -f deployment/Dockerfile -t dashboard-app:dev .
```

2. Load the image into your cluster (kind example):

```bash
kind load docker-image dashboard-app:dev --name kind
```

3. Deploy dashboard resources:

```bash
kubectl create ns volcano-system --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f deployment/volcano-dashboard.yaml
```

4. Point the deployment at your local image (replaces the default without editing YAML):

```bash
kubectl -n volcano-system set image deploy/volcano-dashboard \
  volcano-dashboard=dashboard-app:dev
kubectl -n volcano-system rollout status deploy/volcano-dashboard
```

5. [Install Volcano](#install-volcano) if it is not already on the cluster.

6. Access the dashboard:

```bash
kubectl -n volcano-system port-forward svc/volcano-dashboard 8080:80
```

Open [http://localhost:8080](http://localhost:8080).

For minikube, Docker-only workflows, and other cluster types, see [CONTRIBUTING.md](CONTRIBUTING.md#deploy-to-a-local-kubernetes-cluster-kind).

### Install Volcano

The dashboard requires Volcano CRDs and controllers. If they are not installed yet:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/volcano/master/installer/volcano-development.yaml
```

Verify the APIs are available:

```bash
kubectl api-resources | grep -E "batch.volcano.sh|scheduling.volcano.sh"
kubectl get jobs.batch.volcano.sh -A
kubectl get queues.scheduling.volcano.sh
kubectl get podgroups.scheduling.volcano.sh -A
```

## Contributing

You can follow our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

You can read our [LICENSE](LICENSE).
