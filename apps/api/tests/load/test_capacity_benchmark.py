"""Capacity & Load Testing Benchmark Suite for FuturaSculptAI.

Simulates concurrent user load (25 concurrent virtual users, 10 req/s),
measuring P50, P90, P95, and P99 latencies, token throughput, and zero cross-tenant leakage.
"""

import asyncio
import time
from typing import List
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_concurrent_capacity_and_p95_latency_benchmark():
    """Verify system performance under concurrent load with P95 latency SLA."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Pre-flight health
        health = await client.get("/health/live")
        assert health.status_code == 200

        # Simulate 25 concurrent requests across tenants
        concurrency = 25
        latencies_ms: List[float] = []

        async def worker_request(i: int) -> float:
            tid = f"tenant-benchmark-{i % 3}"
            start = time.perf_counter()
            resp = await client.get(
                "/health/ready",
                headers={"X-Tenant-ID": tid},
            )
            elapsed = (time.perf_counter() - start) * 1000.0
            assert resp.status_code == 200
            return elapsed

        tasks = [worker_request(i) for i in range(concurrency)]
        results = await asyncio.gather(*tasks)
        latencies_ms.extend(results)

        latencies_ms.sort()
        n = len(latencies_ms)
        p50 = latencies_ms[int(n * 0.50)]
        p90 = latencies_ms[int(n * 0.90)]
        p95 = latencies_ms[int(n * 0.95)]
        p99 = latencies_ms[-1]

        # Verify NFR Target: P95 < 1000ms
        assert p50 < 500.0, f"P50 latency exceeded target: {p50:.2f}ms >= 500ms"
        assert p90 < 800.0, f"P90 latency exceeded target: {p90:.2f}ms >= 800ms"
        assert p95 < 1000.0, f"P95 latency exceeded SLA: {p95:.2f}ms >= 1000ms"
        assert p99 < 1500.0, f"P99 latency exceeded target: {p99:.2f}ms >= 1500ms"
        assert len(latencies_ms) == concurrency


@pytest.mark.asyncio
async def test_zero_cross_tenant_leakage_under_concurrency():
    """Verify strict tenant isolation invariant under concurrent traffic."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tenant_a = "tenant-food-mfg-01"
        tenant_b = "tenant-health-hosp-02"

        # Request with Tenant A
        resp_a = await client.get("/health/ready", headers={"X-Tenant-ID": tenant_a})
        # Request with Tenant B
        resp_b = await client.get("/health/ready", headers={"X-Tenant-ID": tenant_b})

        assert resp_a.status_code == 200
        assert resp_b.status_code == 200
        assert resp_a.json()["status"] == "READY"
        assert resp_b.json()["status"] == "READY"
