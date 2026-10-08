"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const DEVICES = {
  iphone: { label: "iPhone", width: 390, height: 844 },
  android: { label: "Android", width: 412, height: 915 },
} as const;

type DeviceId = keyof typeof DEVICES;

function safeFrom(raw: string | null): string {
  const value = String(raw || "/").trim() || "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/phone-view")) return "/";
  return value;
}

export function PhoneViewStudio() {
  const params = useSearchParams();
  const from = safeFrom(params.get("from"));
  const [device, setDevice] = useState<DeviceId>("iphone");
  const spec = DEVICES[device];
  const iframeSrc = useMemo(() => from, [from]);

  return (
    <div className="phone-preview">
      <div className="phone-preview-stage" style={{ width: spec.width, height: spec.height }}>
        <div className="phone-preview-status" aria-hidden="true">
          <div className="phone-preview-notch" />
        </div>
        <iframe className="phone-preview-frame" title="Phone-sized All In On Musk" src={iframeSrc} />
      </div>

      <aside className="phone-preview-panel">
        <a className="phone-preview-back" href={from}>
          ← PC view
        </a>
        <h1>This is the phone layout</h1>
        <p>
          The window on the left is a typical phone screen. If something looks cramped or huge here, it will look that way on iPhone and Android too. Only your admin login can open this preview. Visitors never see the button.
        </p>
        <div className="phone-preview-devices" role="group" aria-label="Phone size">
          {(Object.keys(DEVICES) as DeviceId[]).map((id) => (
            <button key={id} type="button" className={device === id ? "active" : ""} onClick={() => setDevice(id)}>
              {DEVICES[id].label}
              <span>
                {DEVICES[id].width}×{DEVICES[id].height}
              </span>
            </button>
          ))}
        </div>
        <p className="phone-preview-hint">
          Admin only · {spec.label} · {spec.width}×{spec.height}
        </p>
      </aside>
    </div>
  );
}
