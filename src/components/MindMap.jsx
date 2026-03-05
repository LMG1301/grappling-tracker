import { useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react'
import { ACTION_COLOR_MAP, ACTION_LABEL_MAP } from '../config/constants'

const NODE_STYLE_BASE = {
  padding: '10px 16px',
  borderRadius: 12,
  fontSize: 13,
  fontFamily: "'Montserrat', system-ui, sans-serif",
  fontWeight: 600,
  cursor: 'pointer',
  border: '2px solid',
  textAlign: 'center',
  maxWidth: 200,
  lineHeight: 1.3,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
}

// Build the full tree structure (nodes + edges + parent/children relationships)
function buildFullTree(techniques, mode) {
  const nodes = []
  const edges = []
  const childrenMap = {} // parentId -> [childId, ...]

  const rootId = 'root'
  childrenMap[rootId] = []

  nodes.push({
    id: rootId,
    position: { x: 0, y: 0 },
    data: { label: `🥋 Mes Techniques (${techniques.length})`, collapsible: true },
    style: {
      ...NODE_STYLE_BASE,
      background: '#6366f1',
      borderColor: '#818cf8',
      color: '#fff',
      fontSize: 15,
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
        data: { label: `${pos} (${posCount})`, collapsible: true },
        style: { ...NODE_STYLE_BASE, background: '#f1f5f9', borderColor: '#cbd5e1', color: '#334155' },
      })
      edges.push({ id: `root-${posId}`, source: rootId, target: posId, type: 'smoothstep' })

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
          style: { ...NODE_STYLE_BASE, background: color + '22', borderColor: color, color: color },
        })
        edges.push({ id: `${posId}-${actionId}`, source: posId, target: actionId, type: 'smoothstep' })

        techs.forEach((tech) => {
          const techId = `tech-${tech.id}`
          childrenMap[actionId].push(techId)

          nodes.push({
            id: techId,
            position: { x: 0, y: 0 },
            data: { label: tech.name, technique: tech, collapsible: false },
            style: { ...NODE_STYLE_BASE, background: '#ffffff', borderColor: color + '44', color: '#334155', fontSize: 12, fontWeight: 500 },
          })
          edges.push({ id: `${actionId}-${techId}`, source: actionId, target: techId, type: 'smoothstep' })
        })
      })
    })
  } else {
    // By action
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
        style: { ...NODE_STYLE_BASE, background: color + '22', borderColor: color, color: color },
      })
      edges.push({ id: `root-${actionId}`, source: rootId, target: actionId, type: 'smoothstep' })

      const posKeys = Object.keys(byAction[action]).sort()
      posKeys.forEach((pos, pi) => {
        const posId = `${actionId}-pos-${pi}`
        const techs = byAction[action][pos]
        childrenMap[actionId].push(posId)
        childrenMap[posId] = []

        nodes.push({
          id: posId,
          position: { x: 0, y: 0 },
          data: { label: `${pos} (${techs.length})`, collapsible: true },
          style: { ...NODE_STYLE_BASE, background: '#f1f5f9', borderColor: '#cbd5e1', color: '#334155' },
        })
        edges.push({ id: `${actionId}-${posId}`, source: actionId, target: posId, type: 'smoothstep' })

        techs.forEach((tech) => {
          const techId = `tech-${tech.id}`
          childrenMap[posId].push(techId)

          nodes.push({
            id: techId,
            position: { x: 0, y: 0 },
            data: { label: tech.name, technique: tech, collapsible: false },
            style: { ...NODE_STYLE_BASE, background: '#ffffff', borderColor: color + '44', color: '#334155', fontSize: 12, fontWeight: 500 },
          })
          edges.push({ id: `${posId}-${techId}`, source: posId, target: techId, type: 'smoothstep' })
        })
      })
    })
  }

  return { nodes, edges, childrenMap }
}

// Get all descendant IDs of collapsed nodes (these will be hidden)
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

// Compute positions for visible nodes (tree layout)
function layoutNodes(visibleNodes, visibleEdges) {
  // Build adjacency from edges
  const childMap = {}
  const parentMap = {}
  visibleEdges.forEach((e) => {
    if (!childMap[e.source]) childMap[e.source] = []
    childMap[e.source].push(e.target)
    parentMap[e.target] = e.source
  })

  // Find root
  const root = visibleNodes.find((n) => !parentMap[n.id])
  if (!root) return visibleNodes

  // Calculate subtree sizes for spacing
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

  // Assign positions
  const xSpacing = 300
  const ySpacing = 60
  const positions = {}

  function assignPositions(id, depth, yStart) {
    const children = childMap[id] || []
    const totalSize = subtreeSize[id] || 1

    if (children.length === 0) {
      positions[id] = { x: depth * xSpacing, y: yStart }
      return
    }

    let currentY = yStart
    children.forEach((childId) => {
      const childSize = subtreeSize[childId] || 1
      assignPositions(childId, depth + 1, currentY)
      currentY += childSize * ySpacing
    })

    // Center parent vertically among its children
    const firstChild = positions[children[0]]
    const lastChild = positions[children[children.length - 1]]
    positions[id] = {
      x: depth * xSpacing,
      y: (firstChild.y + lastChild.y) / 2,
    }
  }

  const totalHeight = (subtreeSize[root.id] || 1) * ySpacing
  assignPositions(root.id, 0, -totalHeight / 2)

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

  // Rebuild full tree when techniques or mode changes
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
    // Start with level 2+ collapsed (only root + first level visible)
    const initialCollapsed = new Set()
    const rootChildren = tree.childrenMap['root'] || []
    rootChildren.forEach((id) => initialCollapsed.add(id))
    setCollapsed(initialCollapsed)
  }, [techniques, mode])

  // Filter visible nodes/edges based on collapsed state
  useEffect(() => {
    if (allNodes.length === 0) {
      setDisplayNodes([])
      setDisplayEdges([])
      return
    }

    const hiddenIds = getHiddenIds(collapsed, childrenMap)

    // Update labels to show +/- indicator
    const visibleNodes = allNodes
      .filter((n) => !hiddenIds.has(n.id))
      .map((n) => {
        if (!n.data.collapsible || !(childrenMap[n.id]?.length > 0)) return n
        const isCollapsed = collapsed.has(n.id)
        const indicator = isCollapsed ? ' [+]' : ' [-]'
        const baseLabel = n.data.label.replace(/ \[[\+\-]\]$/, '')
        return {
          ...n,
          data: { ...n.data, label: baseLabel + indicator },
        }
      })

    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
    const visibleEdges = allEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    )

    const laid = layoutNodes(visibleNodes, visibleEdges)
    setDisplayNodes(laid)
    setDisplayEdges(visibleEdges)
  }, [allNodes, allEdges, collapsed, childrenMap])

  const onNodeClick = useCallback(
    (_event, node) => {
      // If it's a technique leaf node, show detail
      if (node.data?.technique) {
        onSelectTechnique(node.data.technique)
        return
      }

      // If it's a collapsible branch node, toggle collapse
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
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
