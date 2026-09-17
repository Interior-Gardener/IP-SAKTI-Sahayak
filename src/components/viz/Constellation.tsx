import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HEIGHT,
  LINE_H,
  WIDTH,
  buildGraph,
  placeCaption,
  resolveCaptions,
  step,
} from './constellationLayout'

/* ------------------------------------------------------------------ *
 * The therapeutic constellation.
 *
 * Every plant is tied to the complaints it treats. Written as a table
 * that is 25 rows of repetition; drawn as a graph it becomes obvious
 * which herbs are generalists, which ailments are well covered, and
 * where the collection is thin. The layout — a small spring simulation
 * and the caption placement that follows it — lives next door in
 * constellationLayout.ts. No chart library, and it settles in well
 * under a second.
 * ------------------------------------------------------------------ */

export function Constellation({ className }: { className?: string }) {
  const graph = useMemo(buildGraph, [])
  const [, force] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const frame = useRef(0)

  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph])

  useEffect(() => {
    let alpha = 1
    let raf = 0
    const tick = () => {
      // Several steps per frame: it settles in ~1s of wall clock, and
      // the motion of it settling is half the appeal.
      for (let i = 0; i < 2; i++) step(graph.nodes, graph.edges, byId, alpha)
      alpha *= 0.985
      frame.current += 1
      force(frame.current)
      if (alpha > 0.02) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [graph, byId])

  const neighbours = useMemo(() => {
    if (!hovered) return null
    const set = new Set<string>([hovered])
    for (const e of graph.edges) {
      if (e.source === hovered) set.add(e.target)
      if (e.target === hovered) set.add(e.source)
    }
    return set
  }, [hovered, graph.edges])

  const dim = (id: string) => (neighbours && !neighbours.has(id) ? 0.12 : 1)
  const hoveredNode = hovered ? byId.get(hovered) : null

  /* Complaints are always named. Plants are named while something is
   * isolated and they belong to it — hovering "Digestive" to learn which
   * herbs settle a stomach is no use if the answer is a dozen anonymous
   * circles. The rest stay unlabelled: all twenty-five at once is a
   * thicket nobody can read.
   *
   * Rebuilt every render rather than memoised: the layout is still moving
   * the nodes underneath it while it settles. */
  const captions = (() => {
    const visible = graph.nodes.filter(
      (node) => node.kind === 'tag' || neighbours?.has(node.id),
    )
    const caps = visible.map((node) =>
      placeCaption(node, hoveredNode ?? null, node.kind === 'tag'),
    )
    resolveCaptions(caps)
    return caps
  })()

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full touch-none" role="img" aria-label="Plants linked to what they treat">
        <g>
          {graph.edges.map((edge, i) => {
            const a = byId.get(edge.source)!
            const b = byId.get(edge.target)!
            const lit = neighbours ? neighbours.has(edge.source) && neighbours.has(edge.target) : false
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={lit ? b.color : 'var(--line-strong)'}
                strokeWidth={lit ? 1.6 : 0.7}
                opacity={neighbours ? (lit ? 0.85 : 0.06) : 0.34}
              />
            )
          })}
        </g>

        {graph.nodes.map((node) => {
          const isTag = node.kind === 'tag'
          const plantId = isTag ? null : node.id.slice('plant:'.length)
          const body = (
            <g
              opacity={dim(node.id)}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.25s' }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={isTag ? node.color : `color-mix(in srgb, ${node.color} 55%, var(--surface-raised))`}
                stroke={isTag ? 'var(--surface-raised)' : node.color}
                strokeWidth={isTag ? 2 : 1.3}
              />
            </g>
          )
          return plantId ? (
            <Link key={node.id} to={`/plant/${plantId}`} aria-label={node.label}>
              {body}
            </Link>
          ) : (
            <g key={node.id}>{body}</g>
          )
        })}

        {/* Every label in one pass after every circle. SVG paints in document
            order, so a name drawn beside its own node would otherwise vanish
            under whichever node happened to be drawn next. */}
        <g style={{ pointerEvents: 'none' }}>
          {captions.map((cap) => (
            <text
              key={cap.id}
              x={cap.x}
              y={cap.y}
              textAnchor={cap.anchor}
              fontSize={cap.size}
              fontWeight={cap.isTag ? 700 : 500}
              fill={cap.isTag ? 'var(--ink)' : 'var(--ink-soft)'}
              stroke="var(--surface-raised)"
              strokeWidth={3.5}
              strokeLinejoin="round"
              paintOrder="stroke"
              opacity={dim(cap.id)}
              style={{ transition: 'opacity 0.25s' }}
            >
              {cap.lines.map((line, i) => (
                <tspan key={line} x={cap.x} dy={i === 0 ? 0 : LINE_H}>
                  {line}
                </tspan>
              ))}
            </text>
          ))}
        </g>
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.74rem] text-ink-faint">
        <span>
          {hoveredNode
            ? `${hoveredNode.label} — ${hoveredNode.degree} ${hoveredNode.kind === 'tag' ? 'plants' : 'uses'}`
            : 'Hover a node to isolate it · click a plant to open its entry'}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-accent" /> complaint
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border border-accent" /> plant
          </span>
        </span>
      </div>
    </div>
  )
}
