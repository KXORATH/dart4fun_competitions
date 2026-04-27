import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

export default function QRCodeDisplay({ peerId, isHost }) {
  const [expanded, setExpanded] = useState(false);

  const joinUrl = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(peerId)}`;

  return (
    <>
      {/* Small QR + code in header */}
      <div
        className="qr-header-badge"
        onClick={() => setExpanded(true)}
        title="Click to enlarge QR code"
      >
        <div className="qr-small-wrapper">
          <QRCodeSVG
            value={joinUrl}
            size={44}
            bgColor="transparent"
            fgColor="#a5b4fc"
            level="L"
          />
        </div>
        <div className="qr-code-text">
          <div className="qr-label">{isHost ? 'Room Code' : 'Connected'}</div>
          <div className="qr-code-value">{peerId}</div>
        </div>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div className="qr-overlay" onClick={() => setExpanded(false)}>
          <div className="qr-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="qr-close-btn" onClick={() => setExpanded(false)}>
              <X size={24} />
            </button>
            <h3 className="qr-overlay-title">Scan to Join</h3>
            <div className="qr-large-wrapper">
              <QRCodeSVG
                value={joinUrl}
                size={240}
                bgColor="#ffffff"
                fgColor="#1e1b4b"
                level="M"
                includeMargin={true}
              />
            </div>
            <div className="qr-overlay-code">{peerId}</div>
            <p className="qr-overlay-hint">
              Scan QR or enter code manually
            </p>
          </div>
        </div>
      )}
    </>
  );
}
