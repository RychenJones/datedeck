import './IdeaArt.css';

// Flat scenes from the first DateDeck prototype, one per mood. Colors come from
// the --art-* tokens through the class names in IdeaArt.css.
const SCENES = {
  outdoors: (
    <>
      <rect className="idea-art__night" width="420" height="250" />
      <circle className="idea-art__moon" cx="320" cy="70" r="34" />
      <circle className="idea-art__night" cx="336" cy="62" r="30" />
      <g className="idea-art__white">
        <circle cx="70" cy="50" r="3" />
        <circle cx="140" cy="92" r="2" />
        <circle cx="210" cy="40" r="3" />
        <circle cx="252" cy="118" r="2" />
        <circle cx="100" cy="130" r="2.5" />
        <circle cx="386" cy="150" r="2" />
        <circle cx="30" cy="100" r="2" />
      </g>
      <path className="idea-art__grass" d="M0 190 Q110 140 220 180 T420 170 V250 H0Z" />
      <path className="idea-art__grass-dark" d="M0 222 Q140 192 260 215 T420 206 V250 H0Z" />
      <rect className="idea-art__coral" x="150" y="206" width="120" height="22" rx="6" />
    </>
  ),
  food: (
    <>
      <rect className="idea-art__food-bg" width="420" height="250" />
      <circle className="idea-art__food-light" cx="330" cy="60" r="40" />
      <rect className="idea-art__food-ground" y="190" width="420" height="60" />
      <path className="idea-art__white" d="M150 132 h120 a60 60 0 0 1 -120 0z" />
      <rect className="idea-art__coral" x="150" y="128" width="120" height="12" rx="6" />
      <ellipse className="idea-art__food-shadow" cx="210" cy="198" rx="44" ry="8" />
      <g className="idea-art__line idea-art__line--white" strokeWidth="6">
        <path d="M185 110c-10-12 10-18 0-30" />
        <path d="M210 106c-10-12 10-18 0-30" />
        <path d="M235 110c-10-12 10-18 0-30" />
      </g>
      <path
        className="idea-art__line idea-art__line--wood"
        d="M268 90 L330 150 M280 84 L340 142"
        strokeWidth="6"
      />
    </>
  ),
  active: (
    <>
      <rect className="idea-art__sky" width="420" height="250" />
      <circle className="idea-art__sun" cx="330" cy="64" r="30" />
      <path className="idea-art__mountain" d="M-10 230 L120 70 L220 200 Z" />
      <path className="idea-art__mountain-light" d="M150 230 L270 100 L400 230 Z" />
      <path className="idea-art__white" d="M120 70 L146 102 L128 98 L110 112 L98 98Z" />
      <path className="idea-art__white" d="M270 100 L292 124 L272 120 L256 132 L248 120Z" />
      <rect className="idea-art__grass-dark" y="226" width="420" height="24" />
      <path
        className="idea-art__line idea-art__line--coral"
        d="M40 240 C100 210 160 250 220 222 S330 236 390 214"
        strokeWidth="6"
        strokeDasharray="4 12"
      />
    </>
  ),
  creative: (
    <>
      <rect className="idea-art__sun" width="420" height="250" />
      <rect className="idea-art__flame" y="200" width="420" height="50" />
      <path
        className="idea-art__white"
        d="M110 150c-30-60 40-110 110-100s110 50 90 100c-12 30-50 10-60 30s20 40-20 40c-60 0-100-30-120-70z"
      />
      <circle className="idea-art__coral" cx="170" cy="100" r="15" />
      <circle className="idea-art__grass" cx="220" cy="84" r="15" />
      <circle className="idea-art__disco-line" cx="268" cy="100" r="15" />
      <circle className="idea-art__night" cx="160" cy="150" r="15" />
      <path className="idea-art__line idea-art__line--wood" d="M300 210 L360 80" strokeWidth="10" />
      <path className="idea-art__coral" d="M356 88 l14 -30 l8 4 l-10 32z" />
    </>
  ),
  nightlife: (
    <>
      <rect className="idea-art__disco-bg" width="420" height="250" />
      <path className="idea-art__beam" d="M210 0 L90 250 H150 Z M210 0 L330 250 H270 Z" />
      <path className="idea-art__line idea-art__line--disco" d="M210 0 V50" strokeWidth="4" />
      <circle className="idea-art__disco" cx="210" cy="96" r="46" />
      <g className="idea-art__line idea-art__line--disco-dark" strokeWidth="3">
        <path d="M164 96 h92 M172 72 h76 M172 120 h76" />
        <path d="M210 50 v92 M186 54 c-12 26-12 58 0 84 M234 54 c12 26 12 58 0 84" />
      </g>
      <circle className="idea-art__white" cx="196" cy="80" r="6" />
      <g className="idea-art__coral">
        <circle cx="80" cy="170" r="10" />
        <rect x="88" y="120" width="5" height="52" />
        <path d="M88 120 l26 8 v12 l-26 -8z" />
      </g>
      <g className="idea-art__grass">
        <circle cx="330" cy="190" r="10" />
        <rect x="338" y="140" width="5" height="52" />
      </g>
      <rect className="idea-art__beam" y="224" width="420" height="26" />
    </>
  ),
};

// Our categories, matched to the closest scene.
const SCENE_FOR_CATEGORY = {
  food: 'food',
  active: 'active',
  outdoors: 'outdoors',
  animals: 'outdoors',
  creative: 'creative',
  show: 'nightlife',
};

/** A decorative drawing for an idea's category, shown when the idea has no photo. */
export default function IdeaArt({ category }) {
  const scene = SCENE_FOR_CATEGORY[category?.toLowerCase()];

  if (!scene) {
    return (
      <span className="idea-art__fallback" aria-hidden="true">
        Photo coming soon
      </span>
    );
  }

  return (
    <svg
      className="idea-art"
      data-scene={scene}
      viewBox="0 0 420 250"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {SCENES[scene]}
    </svg>
  );
}
