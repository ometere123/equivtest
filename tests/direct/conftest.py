"""Windows compatibility for genlayer-test 0.29.2 Direct Mode.

The runner replaces fd 0 with a temporary file and unlinks it while that
descriptor is still open. Windows correctly refuses the unlink. Linux CI and
the contract runner are unchanged; this narrow test-only shim lets the open
descriptor be reclaimed at process exit instead of changing production code.
"""
import os
import platform
import tempfile

import pytest


@pytest.fixture(autouse=True)
def allow_direct_runner_temp_cleanup(monkeypatch):
    if platform.system() != "Windows":
        return
    original_unlink = os.unlink
    temporary_root = os.path.abspath(tempfile.gettempdir()).lower()

    def unlink(path, *args, **kwargs):
        try:
            return original_unlink(path, *args, **kwargs)
        except PermissionError:
            if os.path.abspath(str(path)).lower().startswith(temporary_root):
                return None
            raise

    monkeypatch.setattr(os, "unlink", unlink)
