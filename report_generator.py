"""
PDF Report Generator - Compliance reports with images
Generates a daily PDF combining all captured labels with their images.
"""

from datetime import datetime, timedelta
from pathlib import Path
import io
import json


def get_records_last_24h(local_records_dir, images_dir, sheets_records=None):
    """sheets_records: optional list from Sheets (may not have local images)"""
    """
    Get all records from the last 24 hours.
    Returns list of dicts with: record, image_path (local path or None)
    """
    cutoff = datetime.now() - timedelta(hours=24)
    results = []

    # From local records
    if Path(local_records_dir).exists():
        for f in Path(local_records_dir).glob("record_*.json"):
            try:
                with open(f, "r") as fp:
                    rec = json.load(fp)
                ts = rec.get("timestamp", "")
                if ts:
                    try:
                        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                        if dt.tzinfo:
                            dt = dt.replace(tzinfo=None)  # naive compare
                    except Exception:
                        continue
                    if dt < cutoff:
                        continue
                img_path = rec.get("image_path", "")
                if img_path and img_path.startswith("/captured_images/"):
                    local_path = Path(images_dir) / img_path.split("/")[-1]
                else:
                    local_path = None
                results.append({"record": rec, "image_path": str(local_path) if local_path and local_path.exists() else None})
            except Exception:
                pass

    # Sort by timestamp
    def _ts(r):
        t = r["record"].get("timestamp", "")
        try:
            return datetime.fromisoformat(t.replace("Z", "+00:00"))
        except Exception:
            return datetime.min

    results.sort(key=_ts)
    return results


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

    # --- PAGE 1: SUMMARY (one-page overview) ---
    y = page_h - margin
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, "Pallet Ticket Capture - Daily Summary")
    y -= line_height * 2
    c.setFont("Helvetica", 10)
    c.drawString(margin, y, f"Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= line_height * 2

    summary = _compute_summary(records_with_images)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin, y, "Label Run Summary")
    y -= line_height * 1.5
    c.setFont("Helvetica", 11)
    c.drawString(margin, y, f"Pallets produced: {summary['pallets_produced']}")
    y -= line_height
    c.drawString(margin, y, f"Total quantity: {summary['total_quantity']}")
    y -= line_height
    c.drawString(margin, y, f"Unique items: {summary['unique_items']}")
    y -= line_height
    c.drawString(margin, y, f"Period: {summary['date_from']} to {summary['date_to']}")
    y -= line_height * 1.5

    if summary["item_list"]:
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y, "Items captured:")
        y -= line_height
        c.setFont("Helvetica", 9)
        for it in summary["item_list"][:15]:
            c.drawString(margin + 5 * mm, y, "- " + it)
            y -= line_height
        if len(summary["item_list"]) > 15:
            c.drawString(margin + 5 * mm, y, f"... and {len(summary['item_list']) - 15} more")
            y -= line_height

    y -= line_height
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(margin, y, "--- Detail with images follows ---")
    c.showPage()

    # --- DETAIL PAGES: Text on left, image on right ---
    text_col_width = 75 * mm
    img_col_start = margin + text_col_width + 8 * mm
    img_width = 60 * mm
    img_height_side = 70 * mm
    y = page_h - margin
    for i, item in enumerate(records_with_images):
        rec = item["record"]
        img_path = item.get("image_path")

        # Check if we need a new page (need space for image height)
        if y - img_height_side < margin:
            c.showPage()
            y = page_h - margin

        # Left column: text
        y_start = y
        ts = rec.get("timestamp", "N/A")
        if len(ts) > 25:
            ts = ts[:25]
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y, f"#{i+1} - {ts}")
        y -= line_height

        fields = ["sscc", "item_number", "item_description", "batch_no", "quantity", "date", "time", "handwritten_number"]
        c.setFont("Helvetica", 9)
        for f in fields:
            v = rec.get(f, "")
            if v:
                text = f"{f}: {str(v)[:50]}"
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

        y -= line_height * 1.5  # Space before next record

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
    deleted = 0
    images_path = Path(images_dir)
    if not images_path.exists():
        return 0
    for f in images_path.glob("*.jpg"):
        try:
            mtime = datetime.fromtimestamp(f.stat().st_mtime)
            if mtime < cutoff:
                f.unlink()
                deleted += 1
        except Exception:
            pass
    return deleted
