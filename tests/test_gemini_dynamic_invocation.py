"""Root proxy for test_gemini_dynamic_invocation.py."""

import sys
from pathlib import Path

# Ensure apps/api is on the Python path
api_path = Path(__file__).resolve().parent.parent / "apps" / "api"
if str(api_path) not in sys.path:
    sys.path.insert(0, str(api_path))

from tests.test_gemini_dynamic_invocation import *  # noqa: F401, F403
