#!/usr/bin/env python3
"""
Measurement harness for MagShine booking flow UX quality.
Evaluates UI/UX metrics for slot selection, confirmation state, empty states.
"""
import json
import re
import subprocess
from pathlib import Path

FRONTEND_DIR = Path(__file__).parent / "frontend"
BOOKING_HTML = FRONTEND_DIR / "components" / "booking.html"
BOOKING_JS = FRONTEND_DIR / "js" / "booking.js"
CORE_CSS = FRONTEND_DIR / "css" / "core.css"
INDEX_HTML = FRONTEND_DIR / "index.html"


def read_file(path):
    return path.read_text() if path.exists() else ""


def measure_booking_html():
    """Measure booking form HTML quality metrics."""
    html = read_file(BOOKING_HTML)
    js = read_file(BOOKING_JS)
    metrics = {}

    # Form field count
    metrics["form_field_count"] = len(re.findall(r'<input|<select|<textarea', html))

    # Required field count
    metrics["required_field_count"] = len(re.findall(r'required', html))

    # Label association (for + id matching)
    labels = re.findall(r'<label[^>]+for="([^"]+)"', html)
    inputs = re.findall(r'<(?:input|select|textarea)[^>]+id="([^"]+)"', html)
    matched = sum(1 for l in labels if l in inputs)
    metrics["label_association_rate"] = matched / len(labels) if labels else 1.0

    # ARIA attributes
    metrics["aria_attributes"] = len(re.findall(r'aria-[a-z-]+', html))

    # Empty state presence
    metrics["has_empty_state_text"] = "No appointments" in html or "no appointments" in html.lower()

    # Loading state indicators in HTML
    metrics["has_loading_skeleton"] = "skeleton" in html.lower() or "animate-pulse" in html

    # Confirmation modal/area in HTML or JS
    metrics["has_confirmation_modal"] = ("modal" in html.lower() or "confirmation" in html.lower() or
                                          "modal" in js.lower() and "confirmation" in js.lower() or
                                          "showConfirmationModal" in js)

    # Grouped slot selection (optgroup) - check both HTML and JS
    metrics["has_slot_groups"] = "<optgroup" in html or "optgroup" in js or 'role="group"' in js or 'role=group' in js

    # Help text / hints
    metrics["help_text_count"] = len(re.findall(r'placeholder="[^"]*"', html))

    # Error message containers
    metrics["error_containers"] = len(re.findall(r'error|invalid|alert', html, re.I))

    return metrics


def measure_booking_js():
    """Measure booking.js UX implementation quality."""
    js = read_file(BOOKING_JS)
    metrics = {}

    # Loading states during fetch
    metrics["has_loading_state"] = "loading" in js.lower() or "disabled = true" in js

    # Toast/notification system (not alert)
    metrics["uses_toast_not_alert"] = "toast" in js.lower() or "sonner" in js.lower() or "notification" in js.lower()
    metrics["uses_alert"] = "alert(" in js

    # Inline validation
    metrics["has_inline_validation"] = "validation" in js.lower() or "checkValidity" in js or "reportValidity" in js

    # Confirmation flow quality (not just alert)
    metrics["has_confirmation_flow"] = "confirm" in js.lower() and "modal" in js.lower()

    # Empty state rendering function
    metrics["has_empty_state_render"] = "No appointments" in js or "no appointments" in js.lower()

    # Optimistic UI updates
    metrics["optimistic_updates"] = "optimistic" in js.lower()

    # Debounced/throttled inputs
    metrics["debounced_inputs"] = "debounce" in js.lower() or "throttle" in js.lower()

    # Error boundary / graceful degradation
    metrics["error_handling"] = "catch" in js and "try" in js

    # Accessibility: focus management
    metrics["focus_management"] = "focus()" in js or "focus" in js.lower()

    # Keyboard navigation support
    metrics["keyboard_navigation"] = "keydown" in js or "keyup" in js or "keypress" in js

    return metrics


def measure_css():
    """Measure CSS for UX-relevant patterns."""
    css = read_file(CORE_CSS)
    metrics = {}

    # Focus visible styles
    metrics["focus_visible"] = "focus-visible" in css or ":focus" in css

    # Reduced motion support
    metrics["reduced_motion"] = "prefers-reduced-motion" in css

    # Loading animation (skeleton, pulse, shimmer)
    metrics["has_loading_animations"] = any(k in css for k in ["animate-pulse", "shimmer", "skeleton", "@keyframes"])

    # Transition smoothness
    metrics["has_transitions"] = "transition" in css

    # High contrast mode support
    metrics["high_contrast"] = "prefers-contrast" in css

    return metrics


def measure_bundle():
    """Measure frontend bundle characteristics."""
    metrics = {}

    # Check if Vite/build setup exists
    metrics["has_build_system"] = (FRONTEND_DIR / "vite.config.js").exists() or (FRONTEND_DIR / "vite.config.ts").exists()

    # Tailwind via CDN (no build) vs compiled
    index_html = read_file(INDEX_HTML)
    metrics["uses_tailwind_cdn"] = "cdn.tailwindcss.com" in index_html

    # JS module count
    js_files = list((FRONTEND_DIR / "js").glob("*.js"))
    metrics["js_module_count"] = len(js_files)

    # Total JS size (raw)
    total_js_size = sum(f.stat().st_size for f in js_files)
    metrics["total_js_bytes"] = total_js_size

    # CSS size
    metrics["css_bytes"] = CORE_CSS.stat().st_size if CORE_CSS.exists() else 0

    return metrics


def main():
    all_metrics = {}
    all_metrics.update({f"html_{k}": v for k, v in measure_booking_html().items()})
    all_metrics.update({f"js_{k}": v for k, v in measure_booking_js().items()})
    all_metrics.update({f"css_{k}": v for k, v in measure_css().items()})
    all_metrics.update({f"bundle_{k}": v for k, v in measure_bundle().items()})

    # Degenerate gates (must pass)
    gates = {
        "html_form_field_count": all_metrics.get("html_form_field_count", 0) >= 6,
        "html_label_association_rate": all_metrics.get("html_label_association_rate", 0) >= 0.8,
        "js_error_handling": all_metrics.get("js_error_handling", False),
        "css_focus_visible": all_metrics.get("css_focus_visible", False),
        "css_reduced_motion": all_metrics.get("css_reduced_motion", False),
    }

    # Diagnostics
    diagnostics = {
        "html_aria_attributes": all_metrics.get("html_aria_attributes", 0),
        "html_help_text_count": all_metrics.get("html_help_text_count", 0),
        "js_uses_alert": all_metrics.get("js_uses_alert", False),
        "js_has_loading_state": all_metrics.get("js_has_loading_state", False),
        "js_has_inline_validation": all_metrics.get("js_has_inline_validation", False),
        "css_has_loading_animations": all_metrics.get("css_has_loading_animations", False),
        "bundle_total_js_bytes": all_metrics.get("bundle_total_js_bytes", 0),
        "bundle_css_bytes": all_metrics.get("bundle_css_bytes", 0),
    }

    # Primary metric: UX quality score (0-100)
    # Weighted composite of key UX indicators
    ux_score = 0
    ux_score += 15 if all_metrics.get("html_label_association_rate", 0) >= 0.9 else 0
    ux_score += 10 if all_metrics.get("html_aria_attributes", 0) >= 3 else all_metrics.get("html_aria_attributes", 0) * 3
    ux_score += 10 if all_metrics.get("js_has_loading_state", False) else 0
    ux_score += 15 if all_metrics.get("js_uses_toast_not_alert", False) else (-10 if all_metrics.get("js_uses_alert", False) else 0)
    ux_score += 10 if all_metrics.get("js_has_inline_validation", False) else 0
    ux_score += 10 if all_metrics.get("html_has_confirmation_modal", False) else 0
    ux_score += 10 if all_metrics.get("html_has_slot_groups", False) else 0
    ux_score += 10 if all_metrics.get("css_has_loading_animations", False) else 0
    ux_score += 10 if all_metrics.get("css_focus_visible", False) else 0

    # Cap at 100
    ux_score = min(100, max(0, ux_score))

    result = {
        "gates": {k: v for k, v in gates.items()},
        "diagnostics": diagnostics,
        "primary_metric": {"name": "ux_quality_score", "value": ux_score},
    }

    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    main()
