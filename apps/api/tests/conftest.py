"""Pytest configuration and test environment setup for FuturaSculptAI API."""

import os

# Enforce deterministic mock LLM mode for unit and integration testing suites
os.environ["MOCK_LLM_MODE"] = "true"
