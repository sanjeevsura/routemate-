import pytest
import asyncio
import json
from app.core.security import create_access_token
from app.websocket.manager import manager

@pytest.mark.asyncio
async def test_websocket_two_client_communication():
    session_id = "test-session-ws-123"
    
    # Generate tokens for Traveller and Guide
    traveller_token = create_access_token("traveller-123", "TRAVELLER")
    guide_token = create_access_token("guide-456", "GUIDE")
    
    # Verify ConnectionManager in-memory pub/sub state
    class MockWebSocket:
        def __init__(self, name):
            self.name = name
            self.sent_messages = []

        async def accept(self):
            pass

        async def send_text(self, data):
            self.sent_messages.append(json.loads(data))

        async def send_json(self, data):
            self.sent_messages.append(data)

    ws_traveller = MockWebSocket("Traveller")
    ws_guide = MockWebSocket("Guide")

    # 1. Connect both clients
    await manager.connect(session_id, ws_traveller)
    await manager.connect(session_id, ws_guide)

    assert len(manager.active_connections.get(session_id, [])) == 2

    # 2. Broadcast message from Traveller
    msg_from_traveller = {
        "type": "CHAT",
        "sender_id": "traveller-123",
        "sender_role": "TRAVELLER",
        "text": "Hello Guide! I see dense fog at hairpin bend 4."
    }
    await manager.broadcast_to_session(session_id, msg_from_traveller)

    assert len(ws_traveller.sent_messages) == 1
    assert len(ws_guide.sent_messages) == 1
    assert ws_guide.sent_messages[0]["text"] == "Hello Guide! I see dense fog at hairpin bend 4."

    # 3. Broadcast message from Guide
    msg_from_guide = {
        "type": "CHAT",
        "sender_id": "guide-456",
        "sender_role": "GUIDE",
        "text": "Understood! Turn on fog lamps."
    }
    await manager.broadcast_to_session(session_id, msg_from_guide)

    assert len(ws_traveller.sent_messages) == 2
    assert len(ws_guide.sent_messages) == 2
    assert ws_traveller.sent_messages[1]["text"] == "Understood! Turn on fog lamps."

    # 4. Disconnect clients
    manager.disconnect(session_id, ws_traveller)
    manager.disconnect(session_id, ws_guide)
    assert session_id not in manager.active_connections
