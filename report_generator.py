"""
PDF Report Generator - Compliance reports with images
Generates a daily PDF combining all captured labels with their images.
Reports use 7am-7am 24hr windows. Images retained for 7 days.
"""

from datetime import datetime, timedelta, time
from pathlib import Path
from zoneinfo import ZoneInfo
import io
import json

NZ_TZ = ZoneInfo("Pacific/Auckland")


def _parse_ts(ts):
    """Parse timestamp string to naive datetime (NZ local for range comparison)."""
    if not ts:
        return None
    try:
        dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        if dt.tzinfo:
            dt = dt.astimezone(NZ_TZ).replace(tzinfo=None)  # Convert to NZ local
        return dt
    except Exception:
        return None


def _parse_label_datetime(rec):
    """
    Parse label date + time from record into naive datetime.
    Record keys: date/label_date (DD/MM/YYYY or DD-MM-YYYY), time/label_time (HH:MM or HH:MM:SS).
    Returns None if date is missing.
    """
    date_str = rec.get("date") or rec.get("label_date", "")
    time_str = rec.get("time") or rec.get("label_time", "")
    if not date_str:
        return None
    date_str = str(date_str).strip()
    time_str = str(time_str).strip() if time_str else "00:00"
    try:
        for sep in ["/", "-"]:
            if sep in date_str:
                parts = date_str.split(sep)
                if len(parts) == 3:
                    d, m, y = int(parts[0]), int(parts[1]), int(parts[2])
                    if y < 100:
                        y += 2000
                    break
        else:
            return None
        t_parts = time_str.replace(".", ":").split(":")
        h = int(t_parts[0]) if t_parts else 0
        m = int(t_parts[1]) if len(t_parts) > 1 else 0
        s = int(t_parts[2]) if len(t_parts) > 2 else 0
        return datetime(y, m, d, h, m, s)
    except (ValueError, TypeError):
        return None


def _resolve_image_path(rec, images_dir, record_filename=None):
    """Get local image path from record. Uses image_path field, or derives from record file/timestamp."""
    images_path = Path(images_dir).resolve()
    if not images_path.exists():
        return None

    def _try_path(p):
        if p and p.exists():
            return str(p)
        return None

    # 1. Try image_path from record (e.g. /captured_images/pallet_xxx.jpg or Drive URL = skip)
    img_path = rec.get("image_path", "")
    if img_path and not img_path.startswith("http"):
        fname = Path(img_path).name
        cand = images_path / fname
        r = _try_path(cand)
        if r:
            return r
        # Try without extension (in case stored as .jpeg vs .jpg)
        stem = Path(fname).stem
        for ext in (".jpg", ".jpeg", ".png"):
            r = _try_path(images_path / (stem + ext))
            if r:
                return r

    # 2. Fallback: derive from record filename (record_20260130_143022.json -> pallet_20260130_143022.jpg)
    if record_filename:
        stem = Path(record_filename).stem
        if stem.startswith("record_"):
            base = stem.replace("record_", "pallet_", 1)
            for ext in (".jpg", ".jpeg", ".png"):
                r = _try_path(images_path / (base + ext))
                if r:
                    return r

    # 3. Fallback: derive from timestamp
    dt = _parse_ts(rec.get("timestamp", ""))
    if dt:
        base = "pallet_" + dt.strftime("%Y%m%d_%H%M%S")
        for ext in (".jpg", ".jpeg", ".png"):
            r = _try_path(images_path / (base + ext))
            if r:
                return r

    return None


def get_records_in_range(local_records_dir, images_dir, start_dt, end_dt, filter_by="capture"):
    """
    Get records between start_dt and end_dt (inclusive start, exclusive end).
    filter_by: "capture" = use timestamp (when photographed); "label" = use date/time on pallet label.
    Returns list of dicts with: record, image_path (local path or None)
    """
    results = []
    if Path(local_records_dir).exists():
        for f in Path(local_records_dir).glob("record_*.json"):
            try:
                with open(f, "r") as fp:
                    rec = json.load(fp)
                if filter_by == "label":
                    dt = _parse_label_datetime(rec)
                    if dt is None:
                        continue
                else:
                    dt = _parse_ts(rec.get("timestamp", ""))
                    if dt is None:
                        continue
                if dt < start_dt or dt >= end_dt:
                    continue
                local_path = _resolve_image_path(rec, images_dir, record_filename=f.name)
                results.append({"record": rec, "image_path": local_path})
            except Exception:
                pass

    def _sort_key(r):
        if filter_by == "label":
            d = _parse_label_datetime(r["record"])
            return d if d else datetime.min
        t = r["record"].get("timestamp", "")
        d = _parse_ts(t)
        return d if d else datetime.min

    results.sort(key=_sort_key)
    return results


def get_7am_7am_window(report_date):
    """
    Get start and end datetime for a 7am-7am 24hr block.
    report_date: date or datetime. Block = report_date 07:00 -> report_date+1day 07:00
    """
    if hasattr(report_date, "date"):
        d = report_date.date()
    else:
        d = report_date
    start = datetime.combine(d, time(7, 0, 0))
    end = start + timedelta(days=1)
    return start, end


def get_records_last_24h(local_records_dir, images_dir, sheets_records=None, filter_by="capture"):
    """
    Get records in the last 24 hours (rolling window, NZ Wellington time).
    filter_by: "capture" = when photographed (default); "label" = date/time on pallet label.
    Returns list of dicts with: record, image_path (local path or None)
    """
    now = datetime.now(NZ_TZ).replace(tzinfo=None)
    start = now - timedelta(hours=24)
    return get_records_in_range(local_records_dir, images_dir, start, now, filter_by=filter_by)


def get_records_last_n_days(local_records_dir, images_dir, days=7, filter_by="capture"):
    """Get records from the last N days (NZ Wellington time)."""
    now = datetime.now(NZ_TZ).replace(tzinfo=None)
    start = now - timedelta(days=int(days))
    return get_records_in_range(local_records_dir, images_dir, start, now, filter_by=filter_by)


def _compute_summary(records_with_images):
    """Compute summary stats from records."""
    total_qty = 0
    items = set()
    descs = set()
    for item in records_with_images:
        rec = item["record"]
        q = rec.get("quantity")
        if q is not None:
            try:
                total_qty += int(float(q))
            except (ValueError, TypeError):
                pass
        if rec.get("item_number"):
            items.add(str(rec["item_number"])[:40])
        if rec.get("item_description"):
            descs.add(str(rec["item_description"])[:50])
    return {
        "pallets_produced": len(records_with_images),
        "total_quantity": total_qty,
        "unique_items": len(items),
        "unique_descriptions": len(descs),
        "item_list": sorted(items)[:20],
        "date_from": records_with_images[0]["record"].get("timestamp", "")[:19] if records_with_images else "",
        "date_to": records_with_images[-1]["record"].get("timestamp", "")[:19] if records_with_images else "",
    }


def _compute_shift_totals(records_with_images):
    """Compute batch-level totals for shift totals section."""
    by_batch = {}
    for item in records_with_images:
        rec = item["record"]
        batch = str(rec.get("batch_no") or "").strip() or "(no batch)"
        qty = 0
        try:
            q = rec.get("quantity")
            if q is not None:
                qty = int(float(q))
        except (ValueError, TypeError):
            pass
        if batch not in by_batch:
            by_batch[batch] = {"qty": 0, "desc": rec.get("item_description") or ""}
        by_batch[batch]["qty"] += qty
        if rec.get("item_description"):
            by_batch[batch]["desc"] = rec["item_description"]
    return sorted(by_batch.items(), key=lambda x: x[0])


def _group_by_batch(records_with_images):
    """Group records by batch, each batch sorted by handwritten_number."""
    by_batch = {}
    for item in records_with_images:
        rec = item["record"]
        batch = str(rec.get("batch_no") or "").strip() or "(no batch)"
        if batch not in by_batch:
            by_batch[batch] = []
        by_batch[batch].append(item)

    def _handwritten_sort_key(item):
        hw = item["record"].get("handwritten_number") or ""
        try:
            return (0, int(float(str(hw))))
        except (ValueError, TypeError):
            return (1, str(hw))

    for batch in by_batch:
        by_batch[batch].sort(key=_handwritten_sort_key)
    return sorted(by_batch.items(), key=lambda x: x[0])


def generate_pdf(records_with_images, output_buffer):
    """Generate PDF: Page 1 = Summary, then detail pages with images."""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
    except ImportError:
        raise ImportError("Install reportlab: pip install reportlab")

    c = canvas.Canvas(output_buffer, pagesize=A4)
    page_w, page_h = A4
    margin = 15 * mm
    line_height = 5 * mm

    if not records_with_images:
        y = page_h - margin
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, y, f"Pallet Ticket Capture Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        y -= line_height * 2
        c.setFont("Helvetica", 10)
        c.drawString(margin, y, "No captures in the last 24 hours.")
        c.save()
        return

    summary = _compute_summary(records_with_images)

    # --- PAGE 1: SHIFT TOTALS (at start) ---
    y = page_h - margin
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, "Pallet Ticket Capture - Shift Totals")
    y -= line_height * 2
    c.setFont("Helvetica", 10)
    c.drawString(margin, y, f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= line_height
    c.drawString(margin, y, f"Period (by capture time): {summary['date_from']} to {summary['date_to']}")
    y -= line_height * 2
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, f"Pallets: {summary['pallets_produced']}  |  Total quantity: {summary['total_quantity']}  |  Unique items: {summary['unique_items']}")
    y -= line_height * 1.5
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin, y, "By batch:")
    y -= line_height
    c.setFont("Helvetica", 10)
    shift_totals = _compute_shift_totals(records_with_images)
    for batch_id, data in shift_totals:
        batch_str = str(batch_id)[:25]
        qty_str = str(data["qty"])
        desc_str = (data.get("desc") or "")[:45]
        if len(desc_str) > 45:
            desc_str = desc_str[:42] + "..."
        c.drawString(margin, y, f"Batch {batch_str}  |  Total: {qty_str}  |  {desc_str}")
        y -= line_height
        if y < margin + line_height * 3:
            c.showPage()
            y = page_h - margin
    c.showPage()

    # --- ONE PAGE PER BATCH: handwritten #, SSCC, quantity, running total (after totals) ---
    # Column offsets (mm from margin) - spaced to avoid text overlap
    off_hw, off_sscc, off_qty, off_total = 30, 60, 115, 135
    batches = _group_by_batch(records_with_images)
    for batch_id, batch_items in batches:
        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, page_h - margin, f"Batch: {batch_id}")
        y = page_h - margin - line_height * 2
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin, y, "Batch")
        c.drawString(margin + off_hw * mm, y, "Handwritten #")
        c.drawString(margin + off_sscc * mm, y, "SSCC")
        c.drawString(margin + off_qty * mm, y, "Qty")
        c.drawString(margin + off_total * mm, y, "Running")
        y -= line_height
        c.setStrokeColorRGB(0.8, 0.8, 0.8)
        c.line(margin, y, page_w - margin, y)
        y -= line_height
        c.setStrokeColorRGB(0, 0, 0)
        c.setFont("Helvetica", 9)
        running = 0
        for item in batch_items:
            rec = item["record"]
            hw = str(rec.get("handwritten_number") or "")[:10]
            sscc = str(rec.get("sscc") or "")[:22]
            qty = 0
            try:
                q = rec.get("quantity")
                if q is not None:
                    qty = int(float(q))
            except (ValueError, TypeError):
                pass
            running += qty
            c.drawString(margin, y, str(batch_id)[:10])
            c.drawString(margin + off_hw * mm, y, hw)
            c.drawString(margin + off_sscc * mm, y, sscc)
            c.drawString(margin + off_qty * mm, y, str(qty))
            c.drawString(margin + off_total * mm, y, str(running))
            y -= line_height
            if y < margin + line_height * 2:
                c.showPage()
                y = page_h - margin
        c.drawString(margin, y - line_height, f"Batch total: {running}")
        c.showPage()

    # --- DETAIL PAGES: All images in order with data ---
    y = page_h - margin
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y, "Label Images (with data)")
    y -= line_height * 2
    text_col_width = 75 * mm
    img_col_start = margin + text_col_width + 8 * mm
    img_width = 60 * mm
    img_height_side = 70 * mm
    block_gap = 8 * mm  # Space between captures
    for i, item in enumerate(records_with_images):
        rec = item["record"]
        img_path = item.get("image_path")

        # Check if we need a new page (need space for image + gap)
        if y - img_height_side - block_gap < margin:
            c.showPage()
            y = page_h - margin

        # Horizontal line separator (except before first record)
        if i > 0:
            c.setStrokeColorRGB(0.7, 0.7, 0.7)
            c.setLineWidth(0.5)
            c.line(margin, y, page_w - margin, y)
            c.setStrokeColorRGB(0, 0, 0)
            y -= line_height

        # Left column: text
        y_start = y
        ts_raw = rec.get("timestamp", "")
        ts_display = ts_raw[:19] if ts_raw and len(ts_raw) > 19 else (ts_raw or "N/A")
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y, f"#{i+1} - Captured: {ts_display}")
        y -= line_height

        fields = [
            ("sscc", "sscc"),
            ("item_number", "item_number"),
            ("item_description", "item_description"),
            ("batch_no", "batch_no"),
            ("quantity", "quantity"),
            ("label_date", "date"),
            ("label_time", "time"),
            ("handwritten_number", "handwritten_number"),
        ]
        c.setFont("Helvetica", 9)
        for label, key in fields:
            v = rec.get(key, "")
            if v:
                # Truncate to fit 75mm text column (~38 chars at 9pt) to avoid overlap with image
                text = f"{label}: {str(v)}"
                if len(text) > 38:
                    text = text[:35] + "..."
                c.drawString(margin, y, text)
                y -= line_height
        y -= line_height

        # Right column: image
        if img_path and Path(img_path).exists():
            try:
                c.drawImage(img_path, img_col_start, y_start - img_height_side, width=img_width, height=img_height_side)
            except Exception:
                c.drawString(img_col_start, y_start - line_height, "(Image unavailable)")
        else:
            c.drawString(img_col_start, y_start - line_height, "(No local image)")

        # Move below this block (image extends to y_start - img_height_side)
        y = y_start - img_height_side - block_gap

    c.save()


def send_report_email(pdf_bytes, to_emails, subject=None, smtp_host=None, smtp_port=None, smtp_user=None, smtp_password=None):
    """Email the PDF report. to_emails: list or comma-separated string."""
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email.mime.text import MIMEText
    from email import encoders

    if isinstance(to_emails, str):
        to_emails = [e.strip() for e in to_emails.split(",") if e.strip()]
    if not to_emails:
        return False, "No recipient emails"
    if not smtp_host or not smtp_user or not smtp_password:
        return False, "SMTP not configured (need host, user, password)"

    subject = subject or f"Pallet Ticket Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    msg = MIMEMultipart()
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = ", ".join(to_emails)
    msg.attach(MIMEText("Daily pallet ticket capture report (summary + images).", "plain"))

    part = MIMEBase("application", "pdf")
    part.set_payload(pdf_bytes)
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", "attachment", filename=f"pallet_report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf")
    msg.attach(part)

    try:
        port = int(smtp_port or 587)
        with smtplib.SMTP(smtp_host, port) as s:
            s.starttls()
            s.login(smtp_user, smtp_password)
            s.sendmail(smtp_user, to_emails, msg.as_string())
        return True, None
    except Exception as e:
        return False, str(e)


def cleanup_images_older_than_hours(images_dir, hours=24):
    """Delete image files older than given hours. Returns count deleted."""
    cutoff = datetime.now() - timedelta(hours=hours)
    return _cleanup_before(images_dir, cutoff)


def cleanup_images_older_than_days(images_dir, days=7):
    """Delete image files older than given days. Returns count deleted. Default 7 days retention."""
    cutoff = datetime.now() - timedelta(days=days)
    return _cleanup_before(images_dir, cutoff)


def _cleanup_before(images_dir, cutoff):
    deleted = 0
    images_path = Path(images_dir)
    if not images_path.exists():
        return 0
    for pattern in ("*.jpg", "*.jpeg", "*.png"):
        for f in images_path.glob(pattern):
            try:
                mtime = datetime.fromtimestamp(f.stat().st_mtime)
                if mtime < cutoff:
                    f.unlink()
                    deleted += 1
            except Exception:
                pass
    return deleted
