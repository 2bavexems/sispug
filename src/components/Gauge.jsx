// src/components/Gauge.jsx — medidor radial de prontidão (disponibilidade da frota)
export function Gauge({ disp, restr, indisp }) {
  const total = disp + restr + indisp;
  const pct = total ? Math.round((disp / total) * 100) : 0;
  const cx = 100, cy = 100, r = 82, sw = 18;
  const C = 2 * Math.PI * r;
  const cores = [
    { v: disp, cor: "#36c47d", nome: "Disponível" },
    { v: restr, cor: "#e7bd58", nome: "Restrita" },
    { v: indisp, cor: "#e06b65", nome: "Indisponível" },
  ];
  const segs = cores.filter((s) => s.v > 0);
  const vao = segs.length > 1 ? 8 : 0; // pequeno espaço entre segmentos
  let acc = 0;
  const arcos = segs.map((s, i) => {
    const len = (s.v / (total || 1)) * C;
    const traco = Math.max(len - vao, 1);
    const el = (
      <circle
        key={i}
        cx={cx} cy={cy} r={r}
        fill="none" stroke={s.cor} strokeWidth={sw}
        strokeDasharray={`${traco} ${C - traco}`}
        strokeDashoffset={-acc}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        filter="url(#pc-glow)"
      >
        <title>{`${s.nome}: ${s.v}`}</title>
      </circle>
    );
    acc += len;
    return el;
  });
  const nivel = pct >= 80 ? "alto" : pct >= 50 ? "medio" : "baixo";
  return (
    <svg viewBox="0 0 200 200" className="pc-gauge">
      <defs>
        <filter id="pc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#16263a" strokeWidth={sw} />
      {arcos}
      <text x={cx} y={cy - 6} textAnchor="middle" className={"pc-gauge-pct " + nivel}>{pct}%</text>
      <text x={cx} y={cy + 17} textAnchor="middle" className="pc-gauge-lab">DISPONIBILIDADE</text>
      <text x={cx} y={cy + 36} textAnchor="middle" className="pc-gauge-frac">{disp} de {total} aeronaves</text>
    </svg>
  );
}
