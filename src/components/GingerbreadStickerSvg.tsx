interface GingerbreadStickerSvgProps {
  day: number;
  className?: string;
  showNumberBadge?: boolean;
  cutOutline?: boolean;
  id?: string;
}

export function GingerbreadStickerSvg({
  day,
  className = 'w-20 h-20',
  showNumberBadge = false,
  cutOutline = false,
  id,
}: GingerbreadStickerSvgProps) {
  const variant = ((day - 1) % 7) + 1;

  return (
    <svg
      id={id}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={showNumberBadge ? undefined : true}
    >
      {/* Subtle outer cut guide behind white die-cut silhouette when exporting printable stickers */}
      {cutOutline && (
        <g stroke="#CBD5E1" strokeWidth="2.5" strokeLinejoin="round">
          <circle cx="60" cy="36" r="24" fill="#FFFFFF" />
          <path
            d="M20 56C20 48 27 44 35 46L85 46C93 44 100 48 100 56C100 63 94 67 86 65L80 64L85 95C87 104 80 111 72 111C65 111 61 106 60 97C59 106 55 111 48 111C40 111 33 104 35 95L40 64L34 65C26 67 20 63 20 56Z"
            fill="#FFFFFF"
          />
        </g>
      )}

      {/* White die-cut sticker outline */}
      <g>
        <circle cx="60" cy="36" r="24" fill="#FFFFFF" />
        <path
          d="M20 56C20 48 27 44 35 46L85 46C93 44 100 48 100 56C100 63 94 67 86 65L80 64L85 95C87 104 80 111 72 111C65 111 61 106 60 97C59 106 55 111 48 111C40 111 33 104 35 95L40 64L34 65C26 67 20 63 20 56Z"
          fill="#FFFFFF"
        />
      </g>

      {/* Baked cookie body */}
      <circle cx="60" cy="36" r="19" fill="#C67D3E" />
      <path
        d="M25 56C25 51 30 48 37 50L44 52C44 48 49 46 60 46C71 46 76 48 76 52L83 50C90 48 95 51 95 56C95 60 90 63 83 61L75 59L80 94C81 100 77 106 71 106C66 106 62 102 61 93L60 88L59 93C58 102 54 106 49 106C43 106 39 100 40 94L45 59L37 61C30 63 25 60 25 56Z"
        fill="#C67D3E"
      />

      {/* Subtle royal icing squiggles on limbs */}
      <path
        d="M31 53C33 56 32 58 34 60"
        stroke="#FFF8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M89 53C87 56 88 58 86 60"
        stroke="#FFF8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M44 96C47 94 50 97 53 95"
        stroke="#FFF8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M67 95C70 97 73 94 76 96"
        stroke="#FFF8F0"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Cute eyes & rosy cheeks */}
      <circle cx="53" cy="33" r="2.6" fill="#3B2314" />
      <circle cx="67" cy="33" r="2.6" fill="#3B2314" />
      <circle cx="52.2" cy="32.2" r="0.9" fill="#FFFFFF" />
      <circle cx="66.2" cy="32.2" r="0.9" fill="#FFFFFF" />
      <ellipse cx="48" cy="38" rx="3.4" ry="2" fill="#F29CB8" opacity="0.8" />
      <ellipse cx="72" cy="38" rx="3.4" ry="2" fill="#F29CB8" opacity="0.8" />

      {/* Icing smile */}
      <path
        d="M53 40C55 43.5 65 43.5 67 40"
        stroke="#FFF8F0"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Cookie buttons */}
      <circle cx="60" cy="67" r="2.6" fill="#C93B3B" />
      <circle cx="60" cy="76" r="2.6" fill="#236443" />

      {/* Day-specific cute accessories */}
      {variant === 1 && (
        <g>
          <path d="M51 50L60 54L51 58Z" fill="#C93B3B" />
          <path d="M69 50L60 54L69 58Z" fill="#C93B3B" />
          <circle cx="60" cy="54" r="2.4" fill="#A52424" />
        </g>
      )}

      {variant === 2 && (
        <g>
          <path
            d="M89 60V42C89 37 96 37 96 42"
            stroke="#FFF8F0"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M89 60V42C89 37 96 37 96 42"
            stroke="#C93B3B"
            strokeWidth="5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        </g>
      )}

      {variant === 3 && (
        <g>
          <path d="M41 25C44 10 64 8 76 22L79 25H41Z" fill="#C93B3B" />
          <rect x="39" y="22" width="42" height="6" rx="3" fill="#FFF8F0" />
          <circle cx="78" cy="14" r="4.5" fill="#FFF8F0" />
        </g>
      )}

      {variant === 4 && (
        <g>
          <rect x="44" y="48" width="32" height="7.5" rx="3.5" fill="#236443" />
          <rect x="61" y="52" width="7" height="14" rx="2.5" fill="#C93B3B" />
        </g>
      )}

      {variant === 5 && (
        <g>
          <rect x="74" y="50" width="18" height="16" rx="3" fill="#C93B3B" />
          <rect x="81" y="50" width="4" height="16" fill="#FBBF24" />
          <rect x="74" y="56" width="18" height="4" fill="#FBBF24" />
        </g>
      )}

      {variant === 6 && (
        <g>
          <path
            d="M46 21L41 9M43 15L36 14M74 21L79 9M77 15L84 14"
            stroke="#6B4226"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="36.5" r="3" fill="#C93B3B" />
        </g>
      )}

      {variant === 7 && (
        <g>
          <path
            d="M90 36L92.5 41.5L98.5 42L94 46L95.5 52L90 48.8L84.5 52L86 46L81.5 42L87.5 41.5Z"
            fill="#F59E0B"
            stroke="#FFF8F0"
            strokeWidth="1.5"
          />
          <path
            d="M47 21L52 13L60 19L68 13L73 21Z"
            fill="#F59E0B"
            stroke="#FFF8F0"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Optional 1-7 number badge for printable stickers */}
      {showNumberBadge && (
        <g>
          <circle
            cx="100"
            cy="98"
            r="13.5"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="1.2"
          />
          <circle cx="100" cy="98" r="11" fill="#B91C1C" />
          <text
            x="100"
            y="98.5"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            fontSize="13"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, 'Noto Sans TC', sans-serif"
          >
            {variant}
          </text>
        </g>
      )}
    </svg>
  );
}
