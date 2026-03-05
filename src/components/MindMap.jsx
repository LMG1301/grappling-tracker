import { useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react'
import { ACTION_COLOR_MAP, ACTION_LABEL_MAP } from '../config/constants'

const NODE_STYLE_BASE = {
  padding: '10px 16px',
  borderRadius: 24,
  fontSize: 12,
  fontFamily: "'Montserrat', system-ui, sans-serif",
  fontWeight: 600,
  cursor: 'pointer',
  border: '2px solid',
  textAlign: 'center',
  width: 'auto',
  minWidth: 80,
  maxWidth: 200,
  lineHeight: 1.3,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

function buildFullTree(techniques, mode) {
  const nodes = []
  const edges = []
  const childrenMap = {}

  const rootId = 'root'
  childrenMap[rootId] = []

  nodes.push({
    id: rootId,
    position: { x: 0, y: 0 },
    data: { label: `🥋 Mes Techniques (${techniques.length})`, collapsible: true },
    style: {
      ...NODE_STYLE_BASE,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderColor: '#818cf8',
      color: '#fff',
      fontSize: 14,
      padding: '12px 20px',
      borderRadius: 32,
      maxWidth: 260,
      boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
    },
  })

  if (mode === 'position') {
    const byPosition = {}
    techniques.forEach((t) => {
      if (!byPosition[t.position]) byPosition[t.position] = {}
      if (!byPosition[t.position][t.action_type]) byPosition[t.position][t.action_type] = []
      byPosition[t.position][t.action_type].push(t)
    })

    const positionKeys = Object.keys(byPosition).sort()
    positionKeys.forEach((pos, pi) => {
      const posId = `pos-${pi}`
      const posCount = Object.values(byPosition[pos]).flat().length
      childrenMap[rootId].push(posId)
      childrenMap[posId] = []

      nodes.push({
        id: posId,
        position: { x: 0, y: 0 },
        data: { label: `📍 ${pos} (${posCount})`, collapsible: true },
        style: {
          ...NODE_STYLE_BASE,
          background: '#f8fafc',
          borderColor: '#6366f1',
          color: '#334155',
          boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
        },
      })
      edges.push({ id: `root-${posId}`, source: rootId, target: posId, type: 'default', style: { stroke: '#a5b4fc', strokeWidth: 2 } })

      const actionKeys = Object.keys(byPosition[pos]).sort()
      actionKeys.forEach((action) => {
        const actionId = `${posId}-${action}`
        const color = ACTION_COLOR_MAP[action]
        const techs = byPosition[pos][action]
        childrenMap[posId].push(actionId)
        childrenMap[actionId] = []

        nodes.push({
          id: actionId,
          position: { x: 0, y: 0 },
          data: { label: `${ACTION_LABEL_MAP[action]} (${techs.length})`, collapsible: true },
          style: { ...NODE_STYLE_BASE, background: color + '15', borderColor: color, color: color },
        })
        edges.push({ id: `${posId}-${actionId}`, source: posId, target: actionId, type: 'default', style: { stroke: color + '66', strokeWidth: 2 } })

        techs.forEach((tech) => {
          const techId = `tech-${tech.id}`
          childrenMap[actionId].push(techId)

          nodes.push({
            id: techId,
            position: { x: 0, y: 0 },
            data: { label: tech.name, technique: tech, collapsible: false },
            style: {
              ...NODE_STYLE_BASE,
              background: '#ffffff',
              borderColor: color + '40',
              color: '#475569',
              fontSize: 11,
              fontWeight: 500,
              padding: '7px 12px',
              maxWidth: 150,
            },
          })
          edges.push({ id: `${actionId}-${techId}`, source: actionId, target: techId, type: 'default', style: { stroke: color + '33', strokeWidth: 1.5 } })
        })
      })
    })
  } else {
    const byAction = {}
    techniques.forEach((t) => {
      if (!byAction[t.action_type]) byAction[t.action_type] = {}
      if (!byAction[t.action_type][t.position]) byAction[t.action_type][t.position] = []
      byAction[t.action_type][t.position].push(t)
    })

    const actionKeys = Object.keys(byAction).sort()
    actionKeys.forEach((action, ai) => {
      const actionId = `action-${ai}`
      const color = ACTION_COLOR_MAP[action]
      const count = Object.values(byAction[action]).flat().length
      childrenMap[rootId].push(actionId)
      childrenMap[actionId] = []

      nodes.push({
        id: actionId,
        position: { x: 0, y: 0 },
        data: { label: `${ACTION_LABEL_MAP[action]} (${count})`, collapsible: true },
        style: {
          ...NODE_STYLE_BASE,
          background: color + '15',
          borderColor: color,
          color: color,
          boxShadow: `0 2px 12px ${color}20`,
        },
      })
      edges.push({ id: `root-${actionId}`, source: rootId, target: actionId, type: 'default', style: { stroke: color + '66', strokeWidth: 2 } })

      const posKeys = Object.keys(byAction[action]).sort()
      posKeys.forEach((pos, pi) => {
        const posId = `${actionId}-pos-${pi}`
        const techs = byAction[action][pos]
        childrenMap[actionId].push(posId)
        childrenMap[posId] = []

        nodes.push({
          id: posId,
          position: { x: 0, y: 0 },
          data: { label: `📍 ${pos} (${techs.length})`, collapsible: true },
          style: { ...NODE_STYLE_BASE, background: '#f8fafc', borderColor: color + '66', color: '#334155' },
        })
        edges.push({ id: `${actionId}-${posId}`, source: actionId, target: posId, type: 'default', style: { stroke: color + '44', strokeWidth: 1.5 } })

        techs.forEach((tech) => {
          const techId = `tech-${tech.id}`
          childrenMap[posId].push(techId)

          nodes.push({
            id: techId,
            position: { x: 0, y: 0 },
            data: { label: tech.name, technique: tech, collapsible: false },
            style: {
              ...NODE_STYLE_BASE,
              background: '#ffffff',
              borderColor: color + '40',
              color: '#475569',
              fontSize: 11,
              fontWeight: 500,
              padding: '7px 12px',
              maxWidth: 150,
            },
          })
          edges.push({ id: `${posId}-${techId}`, source: posId, target: techId, type: 'default', style: { stroke: color + '33', strokeWidth: 1.5 } })
        })
      })
    })
  }

  return { nodes, edges, childrenMap }
}

function getHiddenIds(collapsed, childrenMap) {
  const hidden = new Set()
  function hideChildren(parentId) {
    const children = childrenMap[parentId] || []
    children.forEach((childId) => {
      hidden.add(childId)
      hideChildren(childId)
    })
  }
  collapsed.forEach((id) => hideChildren(id))
  return hidden
}

// Radial layout - places nodes in concentric circles around center
function layoutRadial(visibleNodes, visibleEdges) {
  const childMap = {}
  const parentMap = {}
  visibleEdges.forEach((e) => {
    if (!childMap[e.source]) childMap[e.source] = []
    childMap[e.source].push(e.target)
    parentMap[e.target] = e.source
  })

  const root = visibleNodes.find((n) => !parentMap[n.id])
  if (!root) return visibleNodes

  // Calculate subtree leaf count for proportional angle allocation
  const subtreeSize = {}
  function calcSize(id) {
    const children = childMap[id] || []
    if (children.length === 0) {
      subtreeSize[id] = 1
      return 1
    }
    let size = 0
    children.forEach((c) => { size += calcSize(c) })
    subtreeSize[id] = size
    return size
  }
  calcSize(root.id)

  const positions = {}
  const radiusStep = 280

  function assignPositions(id, depth, angleStart, angleEnd) {
    const radius = depth * radiusStep
    const angleMid = (angleStart + angleEnd) / 2

    positions[id] = {
      x: Math.cos(angleMid) * radius,
      y: Math.sin(angleMid) * radius,
    }

    const children = childMap[id] || []
    if (children.length === 0) return

    const totalSize = subtreeSize[id] || 1
    let currentAngle = angleStart

    children.forEach((childId) => {
      const childSize = subtreeSize[childId] || 1
      const childAngleSpan = ((angleEnd - angleStart) * childSize) / totalSize
      assignPositions(childId, depth + 1, currentAngle, currentAngle + childAngleSpan)
      currentAngle += childAngleSpan
    })
  }

  // Full circle layout
  assignPositions(root.id, 0, 0, 2 * Math.PI)

  return visibleNodes.map((n) => ({
    ...n,
    position: positions[n.id] || { x: 0, y: 0 },
  }))
}

export default function MindMap({ techniques, mode, onSelectTechnique }) {
  const [allNodes, setAllNodes] = useState([])
  const [allEdges, setAllEdges] = useState([])
  const [childrenMap, setChildrenMap] = useState({})
  const [collapsed, setCollapsed] = useState(new Set())
  const [displayNodes, setDisplayNodes] = useState([])
  const [displayEdges, setDisplayEdges] = useState([])
  const reactFlowRef = useRef(null)

  useEffect(() => {
    if (techniques.length === 0) {
      setAllNodes([])
      setAllEdges([])
      setChildrenMap({})
      setCollapsed(new Set())
      return
    }
    const tree = buildFullTree(techniques, mode)
    setAllNodes(tree.nodes)
    setAllEdges(tree.edges)
    setChildrenMap(tree.childrenMap)
    // Start collapsed at level 1
    const initialCollapsed = new Set()
    const rootChildren = tree.childrenMap['root'] || []
    rootChildren.forEach((id) => initialCollapsed.add(id))
    setCollapsed(initialCollapsed)
  }, [techniques, mode])

  useEffect(() => {
    if (allNodes.length === 0) {
      setDisplayNodes([])
      setDisplayEdges([])
      return
    }

    const hiddenIds = getHiddenIds(collapsed, childrenMap)

    const visibleNodes = allNodes
      .filter((n) => !hiddenIds.has(n.id))
      .map((n) => {
        if (!n.data.collapsible || !(childrenMap[n.id]?.length > 0)) return n
        const isCollapsed = collapsed.has(n.id)
        const indicator = isCollapsed ? ' ＋' : ' −'
        const baseLabel = n.data.label.replace(/ [＋−]$/, '')
        return {
          ...n,
          data: { ...n.data, label: baseLabel + indicator },
        }
      })

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
    const visibleEdges = allEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    )

    const laid = layoutRadial(visibleNodes, visibleEdges)
    setDisplayNodes(laid)
    setDisplayEdges(visibleEdges)
  }, [allNodes, allEdges, collapsed, childrenMap])

  const onNodeClick = useCallback(
    (_event, node) => {
      if (node.data?.technique) {
        onSelectTechnique(node.data.technique)
        return
      }
      if (node.data?.collapsible && childrenMap[node.id]?.length > 0) {
        setCollapsed((prev) => {
          const next = new Set(prev)
          if (next.has(node.id)) {
            next.delete(node.id)
          } else {
            next.add(node.id)
          }
          return next
        })
      }
    },
    [onSelectTechnique, childrenMap]
  )

  if (techniques.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-dojo-muted">
        <div className="text-center px-8">
          <p className="text-4xl mb-4">🥋</p>
          <p className="text-xl mb-2">Aucune technique</p>
          <p className="text-sm">Ajoute ta premiere technique avec le bouton +</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <div className="absolute inset-0">
        <ReactFlow
          ref={reactFlowRef}
          nodes={displayNodes}
          edges={displayEdges}
          onNodeClick={onNodeClick}
          fitView
          key={collapsed.size + '-' + displayNodes.length}
          fitViewOptions={{ padding: 0.4 }}
          minZoom={0.05}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e8ecf1" gap={24} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
