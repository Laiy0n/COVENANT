"""Backend API tests for COVENANT: RECURSION game server"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://alien-siege-3.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Root endpoint test
class TestRoot:
    def test_root_returns_server_online(self, api_client):
        res = api_client.get(f"{BASE_URL}/api/")
        assert res.status_code == 200
        data = res.json()
        assert "message" in data
        assert "COVENANT" in data["message"]
        assert "RECURSION" in data["message"]
        assert "Online" in data["message"]


# Rooms endpoints test
class TestRooms:
    def test_get_rooms_returns_list(self, api_client):
        res = api_client.get(f"{BASE_URL}/api/rooms")
        assert res.status_code == 200
        data = res.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)

    def test_create_room_and_verify_in_list(self, api_client):
        # Create room
        res = api_client.post(f"{BASE_URL}/api/rooms/create")
        assert res.status_code == 200
        data = res.json()
        assert "room_id" in data
        assert isinstance(data["room_id"], str)
        assert len(data["room_id"]) > 0
        room_id = data["room_id"]

        # Verify it is listed
        list_res = api_client.get(f"{BASE_URL}/api/rooms")
        assert list_res.status_code == 200
        rooms = list_res.json()["rooms"]
        ids = [r["id"] for r in rooms]
        assert room_id in ids
        room_obj = next(r for r in rooms if r["id"] == room_id)
        assert "players" in room_obj
        assert "mode" in room_obj
        assert room_obj["mode"] == "multiplayer"
        assert room_obj["players"] == 0


# Leaderboard endpoints
class TestLeaderboard:
    def test_get_leaderboard(self, api_client):
        res = api_client.get(f"{BASE_URL}/api/leaderboard")
        assert res.status_code == 200
        data = res.json()
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)

    def test_update_leaderboard(self, api_client):
        payload = {"player_name": "TEST_Commander", "kills": 5, "deaths": 2}
        res = api_client.post(f"{BASE_URL}/api/leaderboard", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data.get("status") == "ok"

        # Verify it appears in leaderboard
        get_res = api_client.get(f"{BASE_URL}/api/leaderboard")
        assert get_res.status_code == 200
        leaders = get_res.json()["leaderboard"]
        match = [l for l in leaders if l.get("player_name") == "TEST_Commander"]
        assert len(match) >= 1
        assert match[0].get("kills", 0) >= 5
