# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import threading
import time

import redis
from django.conf import settings
from urllib.parse import urlparse


def redis_instance():
    # connect to redis
    if settings.REDIS_URL:
        if settings.REDIS_SSL:
            url = urlparse(settings.REDIS_URL)
            ri = redis.Redis(
                host=url.hostname,
                port=url.port,
                password=url.password,
                ssl=True,
                ssl_cert_reqs=None,
            )
        else:
            ri = redis.Redis.from_url(settings.REDIS_URL, db=0)

        return ri

    # Minimal-stack support: when no REDIS_URL is configured (no redis container
    # in the compose file) return a small in-memory stand-in that implements the
    # subset of commands Plane uses (magic-code OTP, locks, issue-origin). This
    # keeps password/magic sign-in and background tasks working without redis;
    # it is per-process, so only use it for single-instance deployments.
    return InMemoryRedis()


class InMemoryRedis:
    """Tiny thread-safe in-memory substitute for the redis commands Plane uses.

    Supports: exists, get, set (ex/nx), delete, ttl, incr/expire via ``eval``
    for the fixed verify-attempts script. Values are stored as bytes to match
    redis client behaviour (callers use ``.decode()`` / ``json.loads``).
    """

    def __init__(self):
        self._lock = threading.Lock()
        # key -> [value: bytes, expires_at: float | None]
        self._data = {}

    def _purge(self, key):
        entry = self._data.get(key)
        if entry and entry[1] is not None and entry[1] <= time.time():
            del self._data[key]
            return None
        return entry

    def exists(self, key):
        with self._lock:
            return 1 if self._purge(key) is not None else 0

    def get(self, key):
        with self._lock:
            entry = self._purge(key)
            return entry[0] if entry else None

    def set(self, key, value, ex=None, nx=False):
        with self._lock:
            if nx and self._purge(key) is not None:
                return None
            expires = time.time() + ex if ex else None
            self._data[key] = [value.encode() if isinstance(value, str) else bytes(value), expires]
            return True

    def delete(self, *keys):
        with self._lock:
            removed = 0
            for key in keys:
                if self._purge(key) is not None:
                    del self._data[key]
                    removed += 1
            return removed

    def ttl(self, key):
        with self._lock:
            entry = self._purge(key)
            if entry is None:
                return -2
            if entry[1] is None:
                return -1
            return max(1, int(entry[1] - time.time()))

    def expire(self, key, ttl):
        with self._lock:
            entry = self._purge(key)
            if entry is None:
                return 0
            entry[1] = time.time() + ttl
            return 1

    def incr(self, key):
        with self._lock:
            entry = self._purge(key)
            if entry is None:
                self._data[key] = [b"1", None]
                return 1
            value = int(entry[0]) + 1
            entry[0] = str(value).encode()
            return value

    def eval(self, script, numkeys, key, *args):
        # Only the fixed verify-attempts script (INCR + first-time EXPIRE) is
        # used in the codebase; emulate it directly and refuse unknown scripts.
        if "INCR" in script and "EXPIRE" in script:
            count = self.incr(key)
            if count == 1:
                self.expire(key, int(args[0]))
            return count
        raise NotImplementedError(f"InMemoryRedis: unsupported Lua script: {script[:80]}...")
