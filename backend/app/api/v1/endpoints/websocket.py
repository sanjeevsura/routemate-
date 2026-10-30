from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.manager import manager
from app.core.security import decode_token
import json
import uuid

router = APIRouter()


@router.websocket("/sessions/{session_id}")
async def websocket_session_endpoint(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...)
):
    # Verify token
    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    user_id = payload["sub"]
    user_role = payload.get("role", "TRAVELLER")

    await manager.connect(session_id, websocket)

    # Broadcast join event
    await manager.broadcast_to_session(
        session_id=session_id,
        message={
            "type": "USER_JOINED",
            "user_id": user_id,
            "role": user_role
        }
    )

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except Exception:
                data = {"type": "TEXT", "text": raw_text}

            # Forward message with user identification
            data["sender_id"] = user_id
            data["sender_role"] = user_role
            if "id" not in data:
                data["id"] = f"msg-{uuid.uuid4().hex[:12]}"

            await manager.broadcast_to_session(session_id, data)
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        await manager.broadcast_to_session(
            session_id=session_id,
            message={
                "type": "USER_LEFT",
                "user_id": user_id,
                "role": user_role
            }
        )
