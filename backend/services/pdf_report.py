from __future__ import annotations

from io import BytesIO
from typing import Any
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def _as_lines(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        s = value.strip()
        return [s] if s else []
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            if item is None:
                continue
            if isinstance(item, str):
                s = item.strip()
                if s:
                    out.append(s)
                continue
            if isinstance(item, dict):
                # Try common shapes.
                title = str(item.get("title") or item.get("role") or item.get("degree") or "").strip()
                company = str(item.get("company") or item.get("institution") or "").strip()
                duration = str(item.get("duration") or item.get("year") or "").strip()
                desc = str(item.get("description") or "").strip()

                parts = [p for p in [title, company, duration] if p]
                line = " — ".join(parts) if parts else ""
                if desc:
                    line = f"{line}: {desc}" if line else desc
                if line:
                    out.append(line)
                continue

            s = str(item).strip()
            if s:
                out.append(s)
        return out

    return [str(value).strip()] if str(value).strip() else []


def generate_candidate_resume_report_pdf(*,
                                        name: str,
                                        email: str,
                                        skills: list[str] | None = None,
                                        experience: Any = None,
                                        education: Any = None,
                                        match_score: int | None = None,
                                        readiness_score: int | None = None,
                                        ) -> bytes:
    """Generate a simple PDF report for a candidate resume analysis."""

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, title="Candidate Resume Report")

    styles = getSampleStyleSheet()
    story: list[Any] = []

    story.append(Paragraph("Candidate Resume Report", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Personal Info", styles["Heading2"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"<b>Name:</b> {escape(str(name or ''))}", styles["BodyText"]))
    story.append(Paragraph(f"<b>Email:</b> {escape(str(email or ''))}", styles["BodyText"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Skills", styles["Heading2"]))
    story.append(Spacer(1, 6))
    skills_list = [str(s).strip() for s in (skills or []) if str(s).strip()]
    story.append(
        Paragraph(
            escape(", ".join(skills_list)) if skills_list else "Not available",
            styles["BodyText"],
        )
    )
    story.append(Spacer(1, 12))

    story.append(Paragraph("Experience", styles["Heading2"]))
    story.append(Spacer(1, 6))
    exp_lines = _as_lines(experience)
    if exp_lines:
        for line in exp_lines[:20]:
            story.append(Paragraph(f"• {escape(line)}", styles["BodyText"]))
    else:
        story.append(Paragraph("Not available", styles["BodyText"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Education", styles["Heading2"]))
    story.append(Spacer(1, 6))
    edu_lines = _as_lines(education)
    if edu_lines:
        for line in edu_lines[:20]:
            story.append(Paragraph(f"• {escape(line)}", styles["BodyText"]))
    else:
        story.append(Paragraph("Not available", styles["BodyText"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Job Match Score", styles["Heading2"]))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            escape(f"{int(match_score)}%" if match_score is not None else "Not available"),
            styles["BodyText"],
        )
    )
    story.append(Spacer(1, 12))

    story.append(Paragraph("Readiness Score", styles["Heading2"]))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            escape(f"{int(readiness_score)}%" if readiness_score is not None else "Not available"),
            styles["BodyText"],
        )
    )

    doc.build(story)
    return buffer.getvalue()
