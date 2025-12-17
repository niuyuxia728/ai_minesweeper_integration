import pytest
import asyncio
from httpx import AsyncClient
from fastapi import status

import os
import sys
# Ensure project root is on sys.path so `import backend` works even if pytest cwd differs
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.app.main import app

@pytest.mark.asyncio
async def test_leaderboard_and_submit(tmp_path):
    async with AsyncClient(app=app, base_url='http://test') as ac:
        r = await ac.get('/leaderboard')
        assert r.status_code == status.HTTP_200_OK
        data = r.json()
        assert isinstance(data, list)

        # submit a new score
        payload = { 'username': 'testuser', 'time': 30, 'difficulty': 'easy' }
        r2 = await ac.post('/leaderboard', json=payload)
        assert r2.status_code == status.HTTP_201_CREATED
        created = r2.json()
        assert created['username'] == 'testuser'
        assert created['time'] == 30

@pytest.mark.asyncio
async def test_auth_signup_login_me():
    async with AsyncClient(app=app, base_url='http://test') as ac:
        signup = { 'username': 'u1', 'email': 'u1@example.com', 'password': 'pass' }
        r = await ac.post('/auth/signup', json=signup)
        assert r.status_code == 200
        body = r.json()
        assert body['success'] is True
        uid = body['user']['id']

        # login
        creds = { 'email': 'u1@example.com', 'password': 'pass' }
        r2 = await ac.post('/auth/login', json=creds)
        assert r2.status_code == 200
        body2 = r2.json()
        assert body2['success'] is True

        # me - use header x-user-id for mock auth
        r3 = await ac.get('/auth/me', headers={'x-user-id': uid})
        assert r3.status_code == 200
        me = r3.json()
        assert me['email'] == 'u1@example.com'

@pytest.mark.asyncio
async def test_spectator_endpoints():
    async with AsyncClient(app=app, base_url='http://test') as ac:
        r = await ac.get('/spectator/active')
        assert r.status_code == 200
        players = r.json()
        assert isinstance(players, list)
        if len(players) > 0:
            pid = players[0]['id']
            r2 = await ac.get(f'/spectator/{pid}')
            assert r2.status_code == 200

# @pytest.mark.asyncio
# async def test_sse_stream():
#     # Ensure the route exists before asserting behavior; if not, skip with helpful message
#     registered_paths = [r.path for r in app.router.routes]
#     if '/spectator/stream' not in registered_paths:
#         pytest.skip("/spectator/stream route not registered in app; skip SSE test")

#     async with AsyncClient(app=app, base_url='http://test', timeout=15.0) as ac:
#         # Use streaming request to avoid waiting for a never-ending body
#         async with ac.stream('GET', '/spectator/stream') as resp:
#             assert resp.status_code == 200
#             found = False
#             async for chunk in resp.aiter_text():
#                 if 'data:' in chunk:
#                     found = True
#                     break
#             assert found, 'No SSE data event received'
