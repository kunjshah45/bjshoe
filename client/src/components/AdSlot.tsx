import React, { useEffect, useRef } from 'react';
import { Platform, View } from 'react-native';

// Renders a Google AdSense display ad placement. Web-only — returns null on
// iOS/Android so the component is safe to import anywhere. The actual
// `<ins class="adsbygoogle">` element is created imperatively (RN can't
// render arbitrary HTML tags in its tree), then we ping `adsbygoogle.push({})`
// to request fill.
//
// Note: ads will only render once AdSense moves the site from "Getting ready"
// to "Ready" and the slot ID below corresponds to a real ad unit.

const ADSENSE_CLIENT = 'ca-pub-1675923800122600';

interface AdSlotProps {
  slot: string;            // AdSense ad-unit slot ID (digits only)
  width?: number;
  height?: number;
  format?: string;         // e.g. 'auto', 'rectangle'
  responsive?: boolean;
}

export function AdSlot({ slot, width = 300, height = 250, format, responsive }: AdSlotProps) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
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
      // Ad blocker or AdSense not ready — fail silently, leaves an empty slot.
      console.warn('[AdSlot] adsbygoogle push failed', e);
    }
  }, [slot, width, height, format, responsive]);

  if (Platform.OS !== 'web') return null;

  // Use createElement so TS doesn't complain about <div> inside RN trees.
  return (
    <View style={{ width, height, alignSelf: 'center', marginVertical: 12 }}>
      {React.createElement('div', {
        ref: containerRef,
        style: { width, height },
      })}
    </View>
  );
}
