from pathlib import Path
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import hashlib
from datetime import datetime

app = FastAPI()

# In-memory store for bookings (must live before endpoint definitions)
appointments: list = []

INDEX_PATH = Path(__file__).parent / "frontend" / "index.html"
INDEX_HTML = INDEX_PATH.read_text()

# Owner token configuration
OWNER_SECRET = "magshine123"

# Google calendar config (optional)
GOOGLE_CALENDAR_OPTS = {
    "calendar_id": None,
    "client_secret_path": "/home/hermes/.hermes/google_client_secret.json",
    "token_path": "/home/hermes/.hermes/google_token.json",
    "scopes": ["https://www.googleapis.com/auth/calendar.events"],
}


def make_owner_token() -> str:
    return hashlib.sha256(f"owner:{OWNER_SECRET}".encode()).hexdigest()


def check_owner(request: Request) -> bool:
    token = request.cookies.get("owner_token", "")
    return token == make_owner_token()


def get_free_slots(date_str: str):
    slots = []
    for hour in range(9, 18):
        slots.append(
            {
                "time": f"{hour:02d}:00",
                "label": f"{hour:02d}:00 - {(hour + 1):02d}:00",
            }
        )
    return slots


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return HTMLResponse(INDEX_HTML)


SERVICES = [
    {"id": "basic", "name": "Basic Wash", "price_min": 30, "price_max": 50},
    {"id": "interior", "name": "Interior Revival", "price_min": 60, "price_max": 100},
    {"id": "ceramic", "name": "Ceramic Pro Package", "price_min": 150, "price_max": 300},
    {"id": "full", "name": "Full Detail", "price_min": 200, "price_max": 400},
]


def get_service_by_id(sid: str):
    return next((s for s in SERVICES if s["id"] == sid), None)


@app.get("/api/services")
async def api_services():
    return {"services": SERVICES}


@app.get("/login", response_class=HTMLResponse)
async def login_page():
    return HTMLResponse(
        "<h2>Owner Login</h2>"
        '<form method="post" action="/login">'
        '<input type="password" name="password" placeholder="Password"/>'
        '<button type="submit">Login</button>'
        "</form>"
    )


@app.post("/login")
async def login(request: Request, password: str = Form(...)):
    if password == OWNER_SECRET:
        resp = RedirectResponse("/", status_code=302)
        resp.set_cookie("owner_token", make_owner_token(), max_age=86400 * 7, httponly=True)
        return resp
    return HTMLResponse("Invalid password", status_code=401)


@app.get("/logout")
async def logout():
    resp = RedirectResponse("/", status_code=302)
    resp.delete_cookie("owner_token")
    return resp


@app.get("/api/slots")
async def api_slots(date: str):
    try:
        return {"slots": get_free_slots(date)}
    except Exception as e:  # pragma: no cover - defensive path
        return {"slots": [], "error": str(e)}


@app.post("/api/book")
async def api_book(
    date: str = Form(...),
    time: str = Form(""),
    slot_time: str = Form(""),
    name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(""),
    notes: str = Form(""),
    serviceId: str = Form(""),
    vehicleReg: str = Form(""),
):
    if not name or not phone:
        raise HTTPException(400, "Name and phone required")
    try:
        from datetime import datetime, date as date_type, datetime as dt
        booking_date = datetime.strptime(date, "%Y-%m-%d").date()
        today = date_type.today()
        if booking_date < today:
            raise HTTPException(400, "Backdated bookings are not allowed")
        if booking_date == today:
            now = dt.now()
            selected_time = (slot_time or time or "").strip()
            if selected_time:
                time_parts = selected_time.split(":")
                slot_hour = int(time_parts[0])
                slot_minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                slot_dt = dt(today.year, today.month, today.day, slot_hour, slot_minute)
                if slot_dt <= now:
                    raise HTTPException(400, "Booking time must be later than current time")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Invalid date format")
    selected_time = (slot_time or "").strip() or (time or "").strip()
    if not selected_time:
        slots = get_free_slots(date)
        selected_time = slots[0]["time"] if slots else "09:00"
    service = get_service_by_id(serviceId) if serviceId else None
    price = service["price_max"] if service else None
    appointments.append(
        {
            "date": date,
            "time": selected_time,
            "name": name,
            "phone": phone,
            "email": email,
            "notes": notes,
            "serviceId": serviceId,
            "serviceName": service["name"] if service else "",
            "vehicleReg": vehicleReg,
            "price": price,
            "id": hashlib.sha256(
                f"{selected_time}-{name}-{int(__import__('time').time())}".encode()
            ).hexdigest()[:12],
        }
    )
    return {"status": "ok"}


@app.get("/api/owner-token")
async def api_owner_token(request: Request):
    return {"owner": check_owner(request)}


@app.get("/api/bookings")
async def api_bookings(date: str):
    items = [b for b in appointments if b.get("date") == date]
    items.sort(key=lambda x: x.get("time", ""))
    return {"bookings": items}


@app.post("/api/bookings/update")
async def api_bookings_update(
    id: str = Form(...),
    time: str = Form(...),
    name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(""),
    notes: str = Form(""),
):
    for b in appointments:
        if b.get("id") == id:
            b.update(
                {
                    "time": time,
                    "name": name,
                    "phone": phone,
                    "email": email,
                    "notes": notes,
                }
            )
            return {"status": "ok"}
    return JSONResponse({"status": "error", "detail": "Not found"}, status_code=404)


@app.post("/api/bookings/delete")
async def api_bookings_delete(id: str = Form(...)):
    global appointments
    for idx, b in enumerate(appointments):
        if b.get("id") == id:
            appointments.pop(idx)
            return {"status": "ok", "deleted_id": id}
    return JSONResponse({"status": "error", "detail": f"Not found: {id}"}, status_code=404)


@app.post("/api/google-calendar/sync")
async def google_calendar_sync(id: str = Form(...)):
    booking = next((b for b in appointments if b.get("id") == id), None)
    if not booking:
        return JSONResponse({"status": "error", "detail": "Booking not found"}, status_code=404)
    opts = GOOGLE_CALENDAR_OPTS
    if not opts.get("calendar_id") or not opts.get("client_secret_path", "").endswith(".json"):
        return JSONResponse({"status": "disabled", "detail": "Calendar not configured"}, status_code=200)
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from googleapiclient.discovery import build

        creds = None
        token_path = Path(opts["token_path"])
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), opts["scopes"])
        if not creds or not creds.valid:
            flow = InstalledAppFlow.from_client_secrets_file(opts["client_secret_path"], opts["scopes"])
            creds = flow.run_local_server(port=0)
            token_path.write_text(creds.to_json())
        service = build("calendar", "v3", credentials=creds)
        start = f"{booking['date']}T{booking['time']}:00"
        hour = int(booking["time"].split(":")[0]) + 1
        end = f"{booking['date']}T{hour:02d}:00"
        event = (
            service.events()
            .insert(
                calendarId=opts["calendar_id"],
                body={
                    "summary": f"MagShine - {booking['name']}",
                    "description": f"Service: {booking['serviceName']}\\nReg: {booking['vehicleReg']}\\nPhone: {booking['phone']}\\nEmail: {booking['email']}",
                    "start": {"dateTime": start, "timeZone": "Asia/Kuala_Lumpur"},
                    "end": {"dateTime": end, "timeZone": "Asia/Kuala_Lumpur"},
                    "status": "confirmed",
                },
            )
            .execute()
        )
        for b in appointments:
            if b.get("id") == id:
                b["google_event_id"] = event.get("id")
                break
        return {"status": "ok", "google_event_id": event.get("id")}
    except Exception as e:  # pragma: no cover - best effort integration
        return JSONResponse({"status": "error", "detail": str(e)}, status_code=500)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "magshine-booking", "version": "1.0.0"}


@app.get("/healthz")
async def deep_health_check():
    """Deep health check with dependency verification."""
    checks = {
        "service": "magshine-booking",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checks": {}
    }
    overall_ok = True

    # Check 1: In-memory appointments store accessible
    try:
        _ = len(appointments)
        checks["checks"]["appointments_store"] = {"status": "ok", "count": len(appointments)}
    except Exception as e:
        checks["checks"]["appointments_store"] = {"status": "fail", "error": str(e)}
        overall_ok = False

    # Check 2: Google Calendar credentials exist (optional but warned)
    import os
    creds_path = GOOGLE_CALENDAR_OPTS.get("client_secret_path")
    token_path = GOOGLE_CALENDAR_OPTS.get("token_path")
    if creds_path and os.path.exists(creds_path):
        checks["checks"]["google_creds"] = {"status": "ok", "creds_file": "present"}
    else:
        checks["checks"]["google_creds"] = {"status": "warn", "detail": "Google Calendar creds not configured"}
    if token_path and os.path.exists(token_path):
        checks["checks"]["google_token"] = {"status": "ok", "token_file": "present"}
    else:
        checks["checks"]["google_token"] = {"status": "warn", "detail": "Google Calendar token not found"}

    # Check 3: Frontend assets directory exists
    assets_dir = Path(__file__).parent / "frontend" / "assets"
    if assets_dir.exists():
        checks["checks"]["frontend_assets"] = {"status": "ok"}
    else:
        checks["checks"]["frontend_assets"] = {"status": "fail", "detail": "Assets directory missing"}
        overall_ok = False

    checks["overall"] = "ok" if overall_ok else "degraded"
    status_code = 200 if overall_ok else 503
    return JSONResponse(checks, status_code=status_code)


# Serve static frontend assets
app.mount("/assets", StaticFiles(directory=F"{INDEX_PATH.parent}/assets"), name="assets")
app.mount("/components", StaticFiles(directory=F"{INDEX_PATH.parent}/components"), name="components")
app.mount("/js", StaticFiles(directory=F"{INDEX_PATH.parent}/js"), name="js")
app.mount("/css", StaticFiles(directory=F"{INDEX_PATH.parent}/css"), name="css")

# Route root to premium landing page
@app.get("/", response_class=HTMLResponse)
async def home_route(request: Request):
    index_path = INDEX_PATH.parent / "index.html"
    return HTMLResponse(content=index_path.read_text())


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8003)
