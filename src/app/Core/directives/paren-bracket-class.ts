
import {  AfterViewInit,  Directive,  ElementRef,  NgZone,  OnDestroy,  Renderer2} from '@angular/core';


@Directive({
  selector: '.dropdown-toggle'
})
export class ParenBracketClass implements AfterViewInit, OnDestroy
{
  private observer?: MutationObserver;
  private isProcessing = false;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    // Initial wrap after view renders interpolations
    this.zone.runOutsideAngular(() => {
      this.wrapFirstParenGroup();

      // ✅ Watch for content changes (storecount/neworused may change later)
      this.observer = new MutationObserver(() => this.wrapFirstParenGroup());
      this.observer.observe(this.el.nativeElement, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private wrapFirstParenGroup(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const host = this.el.nativeElement;

      // If already wrapped, refresh classes and exit
      const existing = host.querySelector(':scope > span[data-paren-wrapper="true"]') as HTMLSpanElement | null;
      if (existing) {
        this.applyDynamicClasses(existing);
        return;
      }

      // Find a TEXT NODE that contains "(...)" and replace that substring with a span
      const textNodes = Array.from(host.childNodes).filter(n => n.nodeType === Node.TEXT_NODE) as Text[];
      for (const tn of textNodes) {
        const text = tn.nodeValue ?? '';
        const match = text.match(/\([^)]*\)/); // first (...) in this text node
        if (!match || match.index == null) continue;

        const before = text.slice(0, match.index);
        const parenText = match[0]; // includes ( )
        const after = text.slice(match.index + parenText.length);

        const frag = host.ownerDocument.createDocumentFragment();

        if (before) frag.appendChild(host.ownerDocument.createTextNode(before));

        const span = this.renderer.createElement('span') as HTMLSpanElement;
        this.renderer.setAttribute(span, 'data-paren-wrapper', 'true');
        this.renderer.appendChild(span, this.renderer.createText(parenText));

        // ✅ Add classes based on bracket value
        this.applyDynamicClasses(span);

        frag.appendChild(span);

        if (after) frag.appendChild(host.ownerDocument.createTextNode(after));

        // Replace the original text node with our fragment
        host.replaceChild(frag, tn);

        // Done (wrap only first bracket group)
        break;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private applyDynamicClasses(span: HTMLSpanElement): void {
    // Always apply the common bracket styling class
    this.resetBracketClasses(span);

    const full = (span.textContent || '').trim();     // e.g. "( Selected 2 )"
    const inside = full.replace(/^\(\s*|\s*\)$/g, ''); // remove parentheses => "Selected 2"
    const normalized = inside.replace(/\s+/g, ' ').trim();

    this.renderer.addClass(span, 'paren-common');

    // ✅ Example dynamic rules (customize as you like)
    if (/^none$/i.test(normalized)) this.renderer.addClass(span, 'paren-none');
    if (/selected/i.test(normalized)) this.renderer.addClass(span, 'paren-selected');
    if (/^all$/i.test(normalized)) this.renderer.addClass(span, 'paren-all');
  }

  private resetBracketClasses(span: HTMLSpanElement): void {
    // Remove known classes to avoid duplicates when values change
    ['paren-common', 'paren-none', 'paren-selected', 'paren-all'].forEach(c => {
      if (span.classList.contains(c)) this.renderer.removeClass(span, c);
    });
  }
}
