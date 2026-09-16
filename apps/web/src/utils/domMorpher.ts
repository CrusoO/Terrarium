function copyAttrs(target: Element, source: Element) {
  for (const attr of Array.from(target.attributes)) {
    if (!source.hasAttribute(attr.name)) {
      target.removeAttribute(attr.name);
    }
  }
  for (const attr of Array.from(source.attributes)) {
    if (target.getAttribute(attr.name) !== attr.value) {
      target.setAttribute(attr.name, attr.value);
    }
  }
}

/**
 * Enhanced progressive reveal CSS injected during morph transitions.
 * Provides smooth blur-to-focus and fade-in effects when content updates.
 */
function injectProgressiveRevealStyles(doc: Document) {
  const existingStyle = doc.getElementById("terrarium-progressive-reveal");
  if (existingStyle) return;

  const style = doc.createElement("style");
  style.id = "terrarium-progressive-reveal";
  style.textContent = `
    /* Progressive content reveal animations */
    @keyframes terrarium-content-reveal {
      from {
        opacity: 0;
        filter: blur(8px);
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        filter: blur(0);
        transform: translateY(0);
      }
    }

    @keyframes terrarium-element-clarify {
      from {
        filter: blur(4px);
        opacity: 0.6;
      }
      to {
        filter: blur(0);
        opacity: 1;
      }
    }

    /* Apply progressive reveal to newly morphed elements */
    .terrarium-progressive-reveal {
      animation: terrarium-content-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }

    .terrarium-element-clarify {
      animation: terrarium-element-clarify 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }

    /* Smooth transitions for attribute changes */
    [data-terrarium-morphing] {
      transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                  filter 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
  `;
  doc.head.appendChild(style);
}

/**
 * Enhanced morphing with progressive reveal.
 * Detects structural changes and applies smooth blur-to-focus transitions.
 */
function morphWithProgressiveReveal(target: Element, source: Element) {
  const hadSkeletonClasses = target.innerHTML.includes("shimmer") || target.innerHTML.includes("calc-keys");
  const hasRealContent = source.innerHTML.length > 500 && !source.innerHTML.includes("shimmer");

  copyAttrs(target, source);

  if (target.innerHTML !== source.innerHTML) {
    // Transitioning from skeleton to real content
    if (hadSkeletonClasses && hasRealContent) {
      target.setAttribute("data-terrarium-morphing", "true");
      target.innerHTML = source.innerHTML;

      // Apply progressive reveal to new content elements
      const elements = Array.from(target.querySelectorAll("section, article, div, p, h1, h2, h3, button, input"));
      elements.forEach((el, index) => {
        if (el instanceof HTMLElement) {
          el.style.animationDelay = `${index * 0.03}s`;
          el.classList.add("terrarium-progressive-reveal");
        }
      });

      // Clean up after animation
      setTimeout(() => {
        target.removeAttribute("data-terrarium-morphing");
        elements.forEach((el) => {
          el.classList.remove("terrarium-progressive-reveal");
          if (el instanceof HTMLElement) {
            el.style.animationDelay = "";
          }
        });
      }, 800 + elements.length * 30);
    } else {
      // Standard morph for other updates
      target.innerHTML = source.innerHTML;
    }
  }
}

export function applyPreviewDocument(iframe: HTMLIFrameElement, html: string): boolean {
  const doc = iframe.contentDocument;
  if (!doc?.documentElement || !doc.body) {
    iframe.srcdoc = html;
    return false;
  }

  const next = new DOMParser().parseFromString(html, "text/html");

  // Inject progressive reveal styles
  injectProgressiveRevealStyles(doc);

  const apply = () => {
    morphWithProgressiveReveal(doc.documentElement, next.documentElement);
    doc.body.classList.add("terrarium-preview-flash");
    window.setTimeout(() => {
      doc.body?.classList.remove("terrarium-preview-flash");
    }, 700);
  };

  if (doc.startViewTransition) {
    doc.startViewTransition(apply);
  } else {
    apply();
  }
  return true;
}
