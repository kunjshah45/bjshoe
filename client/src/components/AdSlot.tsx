import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';

// Renders a Google AdSense display ad placement. Web-only — returns null on
// iOS/Android so the component is safe to import anywhere. The actual
// `<ins class="adsbygoogle">` element is created imperatively (RN can't
// render arbitrary HTML tags in its tree), then we ping `adsbygoogle.push({})`
// to request fill.
//
// Auto-collapses (returns null) when AdSense reports the slot as unfilled —
// that way placeholder/unapproved slots don't reserve blank space on the page.

const ADSENSE_CLIENT = 'ca-pub-1675923800122600';

// Real AdSense ad-unit IDs are pure digits. Anything else (placeholders like
// 'INTERSTITIAL_SLOT_A_PLACEHOLDER') gets rejected with 400 by AdSense — skip
// the push entirely to avoid console noise and a quality-signal hit.
export function isRealAdSlot(slot: string): boolean {
  return /^\d+$/.test(slot);
}

interface AdSlotProps {
  slot: string;            // AdSense ad-unit slot ID (digits only)
  width?: number;
  height?: number;
  format?: string;         // e.g. 'auto', 'rectangle'
  responsive?: boolean;
}

type FillState = 'pending' | 'filled' | 'unfilled';

export function AdSlot({ slot, width = 300, height = 250, format, responsive }: AdSlotProps) {
  const containerRef = useRef<any>(null);
  const [fillState, setFillState] = useState<FillState>('pending');

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // Bail before touching the DOM if the slot ID isn't real.
    if (!isRealAdSlot(slot)) {
      setFillState('unfilled');
      return;
    }
    const container = containerRef.current;
    if (!container) return;

    // Strict-mode double-effect guard.
    if (container.querySelector('.adsbygoogle')) return;

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = `${width}px`;
    ins.style.height = `${height}px`;
    ins.setAttribute('data-ad-client', ADSENSE_CLIENT);
    ins.setAttribute('data-ad-slot', slot);
    if (format) ins.setAttribute('data-ad-format', format);
    if (responsive) ins.setAttribute('data-full-width-responsive', 'true');
    container.appendChild(ins);

    try {
      const w = window as any;
      (w.adsbygoogle = w.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('[AdSlot] adsbygoogle push failed', e);
    }

    // AdSense sets data-ad-status on the <ins> element to either "filled" or
    // "unfilled" after its push() resolves. Observe it so we can collapse on
    // unfilled (no approved account / placeholder slot ID / no ad available).
    const observer = new MutationObserver(() => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'filled') setFillState('filled');
      else if (status === 'unfilled') setFillState('unfilled');
    });
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    // Final fallback: if no status appears within 5 seconds, treat as unfilled
    // (covers the AdSense-still-pending-approval case where push() succeeds
    // but no fill event ever fires).
    const timeout = setTimeout(() => {
      if (!ins.getAttribute('data-ad-status')) setFillState('unfilled');
    }, 5000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [slot, width, height, format, responsive]);

  if (Platform.OS !== 'web') return null;
  if (fillState === 'unfilled') return null;

  return (
    <View style={{ width, height, alignSelf: 'center', marginVertical: 12 }}>
      {React.createElement('div', {
        ref: containerRef,
        style: { width, height },
      })}
    </View>
  );
}
