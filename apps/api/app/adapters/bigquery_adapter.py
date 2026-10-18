"""Google Cloud BigQuery (google.cloud.bigquery) adapter for temporal WorkGraph ledgers and analytical outcome tracking."""

import logging
from typing import Any, Dict, List, Optional

from google.cloud import bigquery

from app.core.config import settings

logger = logging.getLogger("futurasculpt.bigquery_adapter")


class BigQueryAdapter:
    """Manages temporal WorkGraph nodes, edges, and outcome ledgers in Google BigQuery."""

    def __init__(
        self,
        project_id: Optional[str] = None,
        dataset_id: Optional[str] = None,
    ):
        """Initialize the BigQuery adapter.

        Args:
            project_id: Target GCP project identifier.
            dataset_id: Target BigQuery dataset name.
        """
        self.project_id = project_id or settings.gcp_project_id
        self.dataset_id = dataset_id or settings.bigquery_dataset
        self.mock_mode = settings.mock_llm_mode
        self.max_bytes_billed = settings.bigquery_max_bytes_billed
        self._client: Optional[bigquery.Client] = None
        self._local_ledger: Dict[str, List[Dict[str, Any]]] = {}

    def _get_client(self) -> Optional[bigquery.Client]:
        """Lazy load and memoize the Google BigQuery client."""
        if self.mock_mode:
            return None
        if self._client is None:
            try:
                self._client = bigquery.Client(project=self.project_id)
            except Exception as exc:
                logger.warning("BigQuery client initialization failed; using local fallback: %s", exc)
                return None
        return self._client

    def check_dataset_exists(self) -> bool:
        """Verify whether the designated BigQuery dataset exists.

        Returns:
            bool: True if dataset exists and is accessible, False otherwise.
        """
        client = self._get_client()
        if client is not None:
            try:
                dataset_ref = bigquery.DatasetReference(self.project_id, self.dataset_id)
                client.get_dataset(dataset_ref)
                return True
            except Exception as exc:
                logger.warning("BigQuery dataset %s check failed: %s", self.dataset_id, exc)
                return False
        return False

    def query_workgraph_ledger(
        self,
        tenant_id: str,
        horizon_year: int = 0,
    ) -> Optional[Dict[str, Any]]:
        """Query temporal WorkGraph projections with strict FinOps byte caps and tenant isolation.

        Args:
            tenant_id: Tenant identifier.
            horizon_year: Simulation horizon (0=Baseline, 1=Augmented, 3=Autonomous).

        Returns:
            Optional[Dict[str, Any]]: Query results or None on failure/fallback.
        """
        client = self._get_client()
        if client is not None:
            try:
                query = f"""
                    SELECT node_id, node_type, name, properties, horizon_year
                    FROM `{self.project_id}.{self.dataset_id}.wtg_nodes`
                    WHERE tenant_id = @tenant_id AND horizon_year = @horizon_year
                    LIMIT 200
                """  # nosec B608  # noqa: S608
                job_config = bigquery.QueryJobConfig(
                    query_parameters=[
                        bigquery.ScalarQueryParameter("tenant_id", "STRING", tenant_id),
                        bigquery.ScalarQueryParameter("horizon_year", "INT64", horizon_year),
                    ],
                    maximum_bytes_billed=self.max_bytes_billed,
                )
                query_job = client.query(query, job_config=job_config)
                results = [dict(row) for row in query_job.result()]

                outcomes = []
                try:
                    outcomes_query = f"""
                        SELECT scenario_id, horizon_year, productivity_gain, human_allocation_pct, agent_allocation_pct, active_agents, active_roles, wage_bond_escrow_usd, CAST(recorded_at AS STRING) as recorded_at
                        FROM `{self.project_id}.{self.dataset_id}.outcome_ledger`
                        WHERE tenant_id = @tenant_id AND horizon_year = @horizon_year
                        LIMIT 50
                    """  # nosec B608  # noqa: S608
                    outcomes_job = client.query(outcomes_query, job_config=job_config)
                    outcomes = [dict(row) for row in outcomes_job.result()]
                except Exception as out_err:
                    logger.debug("Outcome query skipped or failed: %s", out_err)

                return {
                    "dataset": f"{self.project_id}.{self.dataset_id}",
                    "nodes": results,
                    "outcomes": outcomes,
                    "total": len(results),
                    "source": "bigquery",
                }
            except Exception as exc:
                logger.warning("BigQuery workgraph ledger query failed: %s", exc)

        # Fallback to local in-memory ledger
        local_entries = self._local_ledger.get(f"{tenant_id}:{horizon_year}", [])
        return {
            "dataset": f"{self.project_id}.{self.dataset_id}",
            "nodes": local_entries,
            "outcomes": [],
            "total": len(local_entries),
            "source": "local_fallback",
        }

    def record_temporal_outcome(
        self,
        tenant_id: str,
        scenario_id: str,
        payload: Dict[str, Any],
    ) -> bool:
        """Insert a temporal transformation outcome ledger entry into BigQuery.

        Args:
            tenant_id: Target tenant identifier.
            scenario_id: Scenario simulation identifier.
            payload: Key-value outcome metrics and evidence links.

        Returns:
            bool: True if recorded successfully, False otherwise.
        """
        entry = {
            "tenant_id": tenant_id,
            "scenario_id": scenario_id,
            **payload,
        }
        self._local_ledger.setdefault(f"{tenant_id}:{payload.get('horizon_year', 0)}", []).append(entry)

        client = self._get_client()
        if client is not None:
            try:
                table_id = f"{self.project_id}.{self.dataset_id}.outcome_ledger"
                errors = client.insert_rows_json(table_id, [entry])
                if errors:
                    logger.warning("BigQuery streaming insert errors: %s", errors)
                    return False
                return True
            except Exception as exc:
                logger.warning("Failed streaming outcome to BigQuery: %s", exc)
                return False

        return True


bigquery_adapter = BigQueryAdapter()
