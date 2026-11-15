"use client";

import React from "react";

interface MathDiagramProps {
  sectionId: string;
  vcaaCode: string;
  strand: string;
}

export function MathDiagram({ sectionId, vcaaCode, strand }: MathDiagramProps) {
  // Determine which canonical SVG diagram to render based on sectionId / vcaaCode / strand
  const renderSvg = () => {
    // 1. Circle & Sector Geometry (7_2)
    if (sectionId === "7_2") {
      return (
        <svg viewBox="0 0 420 180" className="math-diagram-svg" role="img" aria-label="Circle and sector geometry">
          {/* Full circle on left */}
          <circle cx="105" cy="90" r="62" fill="#f4f3ef" stroke="#141413" strokeWidth="2" />
          <line x1="105" y1="90" x2="167" y2="90" stroke="#2e6f40" strokeWidth="2.2" />
          <circle cx="105" cy="90" r="3" fill="#141413" />
          <text x="132" y="83" fontSize="12" fontWeight="600" fill="#2e6f40">r</text>
          <text x="65" y="168" fontSize="11" fill="#4a4945">C = 2πr, A = πr²</text>

          {/* Sector on right */}
          <path d="M 275 130 L 375 130 A 100 100 0 0 0 325 43.4 Z" fill="#eef5f0" stroke="#141413" strokeWidth="2" />
          <path d="M 305 130 A 30 30 0 0 0 290 104" fill="none" stroke="#1e5631" strokeWidth="1.6" />
          <text x="310" y="118" fontSize="12" fontWeight="600" fill="#1e5631">θ = 60°</text>
          <text x="320" y="146" fontSize="12" fontWeight="600" fill="#141413">r</text>
          <text x="360" y="82" fontSize="11" fill="#1e5631">l = (θ/360°)·2πr</text>
          <text x="268" y="168" fontSize="11" fill="#4a4945">Sector Area = (θ/360°)·πr²</text>
        </svg>
      );
    }

    // 2. Right-Angled Triangle / Pythagoras / Trigonometry (8_1, 9_8_1, 9_8_2, 10_6_1)
    if (
      sectionId === "8_1" ||
      sectionId === "9_8_1" ||
      sectionId === "9_8_2" ||
      sectionId === "10_6_1"
    ) {
      const isTrig = sectionId !== "8_1";
      return (
        <svg viewBox="0 0 420 185" className="math-diagram-svg" role="img" aria-label="Right-angled triangle">
          <polygon points="70,145 270,145 70,35" fill="#f4f3ef" stroke="#141413" strokeWidth="2.2" />
          {/* Right angle square */}
          <polyline points="70,129 86,129 86,145" fill="none" stroke="#141413" strokeWidth="1.5" />
          {isTrig && (
            <>
              <path d="M 232 145 A 38 38 0 0 0 237 127" fill="none" stroke="#1e5631" strokeWidth="1.8" />
              <text x="212" y="139" fontSize="13" fontWeight="700" fill="#1e5631">θ</text>
            </>
          )}
          <text x="155" y="165" fontSize="12" fontWeight="600" fill="#141413">
            {isTrig ? "Adjacent (a)" : "a (shorter leg)"}
          </text>
          <text x="14" y="95" fontSize="12" fontWeight="600" fill="#141413">
            {isTrig ? "Opposite" : "b (leg)"}
          </text>
          <text x="178" y="80" fontSize="12" fontWeight="700" fill="#2e6f40">
            {isTrig ? "Hypotenuse (c)" : "c = √(a² + b²)"}
          </text>
          <text x="295" y="75" fontSize="11.5" fontWeight="600" fill="#141413">
            {isTrig ? "sin θ = Opp / Hyp" : "Pythagoras' Theorem:"}
          </text>
          <text x="295" y="96" fontSize="11.5" fill="#4a4945">
            {isTrig ? "cos θ = Adj / Hyp" : "a² + b² = c²"}
          </text>
          <text x="295" y="117" fontSize="11.5" fill="#4a4945">
            {isTrig ? "tan θ = Opp / Adj" : "a² = c² − b²"}
          </text>
        </svg>
      );
    }

    // 3. Unit Circle & Exact Values (10_6_3) or Circle Theorems (10_7_2)
    if (sectionId === "10_6_3" || sectionId === "10_7_2") {
      return (
        <svg viewBox="0 0 420 190" className="math-diagram-svg" role="img" aria-label="Unit circle and circle geometry">
          <line x1="35" y1="95" x2="215" y2="95" stroke="#787670" strokeWidth="1.2" />
          <line x1="125" y1="12" x2="125" y2="178" stroke="#787670" strokeWidth="1.2" />
          <circle cx="125" cy="95" r="68" fill="none" stroke="#141413" strokeWidth="2" />
          <line x1="125" y1="95" x2="173" y2="47" stroke="#2e6f40" strokeWidth="2.2" />
          <line x1="173" y1="47" x2="173" y2="95" stroke="#141413" strokeDasharray="3,3" strokeWidth="1.5" />
          <circle cx="173" cy="47" r="3.5" fill="#2e6f40" />
          <text x="178" y="44" fontSize="11" fontWeight="600" fill="#141413">P(cos θ, sin θ)</text>
          <text x="142" y="88" fontSize="11" fontWeight="700" fill="#2e6f40">θ</text>
          <text x="245" y="65" fontSize="12" fontWeight="600" fill="#141413">
            {sectionId === "10_6_3" ? "Unit Circle Identity:" : "Circle Angle Theorem:"}
          </text>
          <text x="245" y="88" fontSize="11.5" fill="#4a4945">
            {sectionId === "10_6_3" ? "cos²θ + sin²θ = 1" : "Angle at centre = 2 ×"}
          </text>
          <text x="245" y="108" fontSize="11.5" fill="#4a4945">
            {sectionId === "10_6_3" ? "tan θ = sin θ / cos θ" : "angle at circumference"}
          </text>
        </svg>
      );
    }

    // 4. Non-Right Triangle Sine/Cosine Rule (10_6_2) or Congruence/Similarity (8_2, 9_7_1, 9_7_2, 10_7_1)
    if (
      sectionId === "10_6_2" ||
      sectionId === "8_2" ||
      sectionId === "9_7_1" ||
      sectionId === "9_7_2" ||
      sectionId === "10_7_1"
    ) {
      return (
        <svg viewBox="0 0 420 180" className="math-diagram-svg" role="img" aria-label="Triangle geometry relationships">
          <polygon points="50,148 250,148 165,36" fill="#f4f3ef" stroke="#141413" strokeWidth="2" />
          <text x="35" y="155" fontSize="12" fontWeight="700" fill="#141413">A</text>
          <text x="256" y="155" fontSize="12" fontWeight="700" fill="#141413">B</text>
          <text x="160" y="28" fontSize="12" fontWeight="700" fill="#141413">C</text>
          <text x="145" y="165" fontSize="11.5" fontWeight="600" fill="#2e6f40">c</text>
          <text x="215" y="88" fontSize="11.5" fontWeight="600" fill="#2e6f40">a</text>
          <text x="92" y="88" fontSize="11.5" fontWeight="600" fill="#2e6f40">b</text>
          <text x="280" y="65" fontSize="11.5" fontWeight="600" fill="#141413">
            {sectionId === "10_6_2" ? "Sine & Cosine Rules:" : "Congruence & Similarity:"}
          </text>
          <text x="280" y="88" fontSize="11" fill="#4a4945">
            {sectionId === "10_6_2" ? "a/sin A = b/sin B = c/sin C" : "SSS, SAS, ASA/AAA, RHS"}
          </text>
          <text x="280" y="110" fontSize="11" fill="#4a4945">
            {sectionId === "10_6_2" ? "c² = a² + b² − 2ab cos C" : "Area ratio = k², Vol = k³"}
          </text>
          <text x="280" y="132" fontSize="11" fill="#4a4945">
            {sectionId === "10_6_2" ? "Area = ½ab sin C" : "Corresponding sides ∝ k"}
          </text>
        </svg>
      );
    }

    // 5. 3D Coordinates & Prisms/Cylinders/Cones (7_3, 8_3, 9_6_1, 9_6_2, 10_5_1)
    if (
      sectionId === "7_3" ||
      sectionId === "8_3" ||
      sectionId === "9_6_1" ||
      sectionId === "9_6_2" ||
      sectionId === "10_5_1"
    ) {
      return (
        <svg viewBox="0 0 420 185" className="math-diagram-svg" role="img" aria-label="3D prism and solid geometry">
          {/* 3D Rectangular Prism wireframe */}
          <polygon points="60,65 170,65 170,145 60,145" fill="#f4f3ef" stroke="#141413" strokeWidth="2" />
          <polygon points="60,65 95,35 205,35 170,65" fill="#eef5f0" stroke="#141413" strokeWidth="2" />
          <polygon points="170,65 205,35 205,115 170,145" fill="#e6e4dd" stroke="#141413" strokeWidth="2" />
          <line x1="60" y1="145" x2="95" y2="115" stroke="#787670" strokeDasharray="4,3" strokeWidth="1.4" />
          <line x1="95" y1="35" x2="95" y2="115" stroke="#787670" strokeDasharray="4,3" strokeWidth="1.4" />
          <line x1="95" y1="115" x2="205" y2="115" stroke="#787670" strokeDasharray="4,3" strokeWidth="1.4" />
          <circle cx="205" cy="35" r="3.5" fill="#2e6f40" />
          <text x="108" y="162" fontSize="11.5" fontWeight="600" fill="#141413">l (x)</text>
          <text x="192" y="138" fontSize="11.5" fontWeight="600" fill="#141413">w (y)</text>
          <text x="35" y="110" fontSize="11.5" fontWeight="600" fill="#141413">h (z)</text>
          <text x="245" y="65" fontSize="12" fontWeight="600" fill="#141413">3D Spatial Relationships</text>
          <text x="245" y="88" fontSize="11" fill="#4a4945">Prism Volume: V = A_base × h</text>
          <text x="245" y="108" fontSize="11" fill="#4a4945">Cylinder: V = πr²h, TSA = 2πr(r+h)</text>
          <text x="245" y="128" fontSize="11" fill="#4a4945">3D Vertex: P(x, y, z)</text>
        </svg>
      );
    }

    // 6. Parabolas & Non-Linear Graphs (9_5_1, 9_5_2, 9_5_3, 10_3_2, 10_4_1, 10_4_2)
    if (
      sectionId.startsWith("9_5_") ||
      sectionId === "10_3_2" ||
      sectionId.startsWith("10_4_")
    ) {
      return (
        <svg viewBox="0 0 420 185" className="math-diagram-svg" role="img" aria-label="Parabola graph and key features">
          {/* Axes */}
          <line x1="40" y1="130" x2="260" y2="130" stroke="#141413" strokeWidth="1.5" />
          <line x1="110" y1="15" x2="110" y2="175" stroke="#141413" strokeWidth="1.5" />
          {/* Axis of symmetry */}
          <line x1="160" y1="18" x2="160" y2="170" stroke="#2e6f40" strokeDasharray="4,3" strokeWidth="1.4" />
          {/* Parabola curve */}
          <path d="M 85 30 Q 160 220 235 30" fill="none" stroke="#141413" strokeWidth="2.3" />
          {/* Key points */}
          <circle cx="118" cy="130" r="3.5" fill="#2e6f40" />
          <circle cx="202" cy="130" r="3.5" fill="#2e6f40" />
          <circle cx="160" cy="162" r="4" fill="#1e5631" />
          <text x="135" y="176" fontSize="10.5" fontWeight="600" fill="#1e5631">Vertex (h, k)</text>
          <text x="275" y="60" fontSize="12" fontWeight="600" fill="#141413">Quadratic Features:</text>
          <text x="275" y="82" fontSize="11" fill="#4a4945">• Turning point: (h, k)</text>
          <text x="275" y="102" fontSize="11" fill="#4a4945">• Axis of symmetry: x = h</text>
          <text x="275" y="122" fontSize="11" fill="#4a4945">• Roots: x = (−b ± √Δ) / 2a</text>
        </svg>
      );
    }

    // 7. Linear Coordinate Graphs & Gradients (6_2, 9_4_1, 9_4_2, 9_4_3, 10_2_1, 10_2_2, 10_2_3)
    if (
      sectionId === "6_2" ||
      sectionId.startsWith("9_4_") ||
      sectionId.startsWith("10_2_")
    ) {
      return (
        <svg viewBox="0 0 420 185" className="math-diagram-svg" role="img" aria-label="Cartesian linear graph and gradient">
          <line x1="40" y1="135" x2="255" y2="135" stroke="#141413" strokeWidth="1.5" />
          <line x1="95" y1="15" x2="95" y2="172" stroke="#141413" strokeWidth="1.5" />
          {/* Line y = mx + c */}
          <line x1="55" y1="155" x2="235" y2="35" stroke="#141413" strokeWidth="2.2" />
          {/* Rise / Run triangle */}
          <line x1="125" y1="108" x2="185" y2="108" stroke="#2e6f40" strokeDasharray="4,3" strokeWidth="1.8" />
          <line x1="185" y1="108" x2="185" y2="68" stroke="#2e6f40" strokeDasharray="4,3" strokeWidth="1.8" />
          <circle cx="95" cy="128" r="3.5" fill="#141413" />
          <text x="60" y="124" fontSize="10.5" fontWeight="600" fill="#141413">(0, c)</text>
          <text x="145" y="123" fontSize="11" fontWeight="600" fill="#2e6f40">run</text>
          <text x="190" y="92" fontSize="11" fontWeight="600" fill="#2e6f40">rise</text>
          <text x="270" y="60" fontSize="12" fontWeight="600" fill="#141413">Linear Coordinate Geometry</text>
          <text x="270" y="82" fontSize="11" fill="#4a4945">• Gradient: m = rise / run</text>
          <text x="270" y="102" fontSize="11" fill="#4a4945">• Slope-intercept: y = mx + c</text>
          <text x="270" y="122" fontSize="11" fill="#4a4945">• Perpendicular: m₁ × m₂ = −1</text>
        </svg>
      );
    }

    // 8. Probability: Venn Diagrams & Tree Diagrams (strand === "Probability")
    if (strand.includes("Probability")) {
      return (
        <svg viewBox="0 0 420 180" className="math-diagram-svg" role="img" aria-label="Venn diagram for compound events">
          <rect x="25" y="18" width="220" height="144" rx="6" fill="#faf9f6" stroke="#141413" strokeWidth="1.8" />
          <circle cx="105" cy="90" r="50" fill="rgba(46, 111, 64, 0.14)" stroke="#141413" strokeWidth="1.8" />
          <circle cx="165" cy="90" r="50" fill="rgba(20, 20, 19, 0.08)" stroke="#141413" strokeWidth="1.8" />
          <text x="34" y="35" fontSize="12" fontWeight="700" fill="#141413">ξ</text>
          <text x="72" y="62" fontSize="12" fontWeight="700" fill="#141413">A</text>
          <text x="190" y="62" fontSize="12" fontWeight="700" fill="#141413">B</text>
          <text x="122" y="94" fontSize="11" fontWeight="700" fill="#1e5631">A ∩ B</text>
          <text x="262" y="55" fontSize="12" fontWeight="600" fill="#141413">Probability Laws:</text>
          <text x="262" y="78" fontSize="11" fill="#4a4945">• Pr(A&apos;) = 1 − Pr(A)</text>
          <text x="262" y="98" fontSize="11" fill="#4a4945">• Pr(A ∪ B) = Pr(A)+Pr(B)−Pr(A∩B)</text>
          <text x="262" y="118" fontSize="11" fill="#4a4945">• Pr(A | B) = Pr(A ∩ B) / Pr(B)</text>
          <text x="262" y="138" fontSize="11" fill="#4a4945">• Expected: E = n × Pr(A)</text>
        </svg>
      );
    }

    // 9. Statistics: Box Plot & Histogram (strand === "Statistics")
    if (strand.includes("Statistics")) {
      return (
        <svg viewBox="0 0 420 180" className="math-diagram-svg" role="img" aria-label="Statistical box plot and five-number summary">
          {/* Number line at bottom */}
          <line x1="35" y1="138" x2="385" y2="138" stroke="#141413" strokeWidth="1.5" />
          {/* Box plot */}
          <line x1="65" y1="80" x2="125" y2="80" stroke="#141413" strokeWidth="2" />
          <line x1="65" y1="62" x2="65" y2="98" stroke="#141413" strokeWidth="2" />
          <rect x="125" y="50" width="145" height="60" fill="#eef5f0" stroke="#141413" strokeWidth="2" />
          <line x1="190" y1="50" x2="190" y2="110" stroke="#2e6f40" strokeWidth="2.6" />
          <line x1="270" y1="80" x2="335" y2="80" stroke="#141413" strokeWidth="2" />
          <line x1="335" y1="62" x2="335" y2="98" stroke="#141413" strokeWidth="2" />
          {/* Outlier */}
          <circle cx="372" cy="80" r="4" fill="#141413" />
          <text x="53" y="156" fontSize="11" fontWeight="600" fill="#141413">Min</text>
          <text x="118" y="156" fontSize="11" fontWeight="600" fill="#141413">Q₁</text>
          <text x="172" y="156" fontSize="11" fontWeight="700" fill="#2e6f40">Median (Q₂)</text>
          <text x="263" y="156" fontSize="11" fontWeight="600" fill="#141413">Q₃</text>
          <text x="322" y="156" fontSize="11" fontWeight="600" fill="#141413">Max</text>
          <text x="352" y="64" fontSize="10.5" fill="#4a4945">Outlier</text>
          <text x="155" y="36" fontSize="11.5" fontWeight="600" fill="#1e5631">IQR = Q₃ − Q₁ (Middle 50%)</text>
        </svg>
      );
    }

    // 10. Default: Number Line / Area Model for Number, Ratio, and Algebra sections
    return (
      <svg viewBox="0 0 420 155" className="math-diagram-svg" role="img" aria-label={`Mathematical model for ${vcaaCode}`}>
        {/* Area / Distributive Partition Model on Left */}
        <rect x="30" y="38" width="110" height="75" fill="#eef5f0" stroke="#141413" strokeWidth="2" />
        <rect x="140" y="38" width="75" height="75" fill="#f4f3ef" stroke="#141413" strokeWidth="2" />
        <text x="14" y="80" fontSize="12" fontWeight="700" fill="#141413">a</text>
        <text x="80" y="28" fontSize="12" fontWeight="700" fill="#141413">b</text>
        <text x="173" y="28" fontSize="12" fontWeight="700" fill="#141413">c</text>
        <text x="75" y="80" fontSize="13" fontWeight="700" fill="#1e5631">a · b</text>
        <text x="165" y="80" fontSize="13" fontWeight="700" fill="#141413">a · c</text>
        <text x="48" y="135" fontSize="11" fill="#4a4945">a(b + c) = ab + ac</text>

        {/* Directed Number / Scale Line on Right */}
        <line x1="245" y1="85" x2="400" y2="85" stroke="#141413" strokeWidth="2" />
        {[-2, -1, 0, 1, 2].map((val, i) => {
          const x = 265 + i * 28;
          return (
            <g key={val}>
              <line x1={x} y1="79" x2={x} y2="91" stroke="#141413" strokeWidth="1.6" />
              <text x={x - 5} y="106" fontSize="10.5" fill="#141413">{val}</text>
            </g>
          );
        })}
        <path d="M 293 74 Q 321 48 349 74" fill="none" stroke="#2e6f40" strokeWidth="2" />
        <text x="275" y="48" fontSize="11" fontWeight="600" fill="#1e5631">Visual Structural Model</text>
        <text x="260" y="135" fontSize="11" fill="#4a4945">Aligned to {vcaaCode}</text>
      </svg>
    );
  };

  return (
    <div className="math-diagram-panel">
      <div className="math-diagram-header">
        <span className="math-diagram-kicker">Visual Mathematical Model</span>
        <span className="math-diagram-code">{vcaaCode} · {strand}</span>
      </div>
      <div className="math-diagram-canvas">{renderSvg()}</div>
    </div>
  );
}
