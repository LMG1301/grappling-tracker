import { useMemo, useCallback, useEffect, useState } from 'react'
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
  fontWeight: 600,
  cursor: 'pointer',
  border: '2px solid',
  textAlign: 'center',
  maxWidth: 180,
  lineHeight: 1.3,
}

function buildByPositionGraph(techniques) {
  const nodes = []
  const edges = []

  nodes.push({
    id: 'root',
    position: { x: 0, y: 0 },
    data: { label: `Mes Techniques (${techniques.length})` },
    style: {
      ...NODE_STYLE_BASE,
      background: '#6366f1',
      borderColor: '#818cf8',
      color: '#fff',
      fontSize: 15,
    },
  })

  const byPosition = {}
  techniques.forEach((t) => {
    if (!byPosition[t.position]) byPosition[t.position] = {}
    if (!byPosition[t.position][t.action_type]) byPosition[t.position][t.action_type] = []
    byPosition[t.position][t.action_type].push(t)
  })

  const positionKeys = Object.keys(byPosition).sort()
  const posSpacing = 220
  const startY = -((positionKeys.length - 1) * posSpacing) / 2

  positionKeys.forEach((pos, pi) => {
    const posId = `pos-${pi}`
    const posCount = Object.values(byPosition[pos]).flat().length
    const y = startY + pi * posSpacing

    nodes.push({
      id: posId,
      position: { x: 350, y },
      data: { label: `${pos} (${posCount})` },
      style: {
        ...NODE_STYLE_BASE,
        background: '#1e2a4a',
        borderColor: '#3b5998',
        color: '#e2e8f0',
      },
    })
    edges.push({ id: `root-${posId}`, source: 'root', target: posId, type: 'smoothstep' })

    const actionKeys = Object.keys(byPosition[pos]).sort()
    const actionSpacing = 100
    const actionStartY = y - ((actionKeys.length - 1) * actionSpacing) / 2

    actionKeys.forEach((action, ai) => {
      const actionId = `${posId}-${action}`
      const color = ACTION_COLOR_MAP[action]
      const techs = byPosition[pos][action]
      const actionY = actionStartY + ai * actionSpacing

      nodes.push({
        id: actionId,
        position: { x: 700, y: actionY },
        data: { label: `${ACTION_LABEL_MAP[action]} (${techs.length})` },
        style: {
          ...NODE_STYLE_BASE,
          background: color + '22',
          borderColor: color,
          color: color,
        },
      })
      edges.push({ id: `${posId}-${actionId}`, source: posId, target: actionId, type: 'smoothstep' })

      techs.forEach((tech, ti) => {
        const techId = `tech-${tech.id}`
        nodes.push({
          id: techId,
          position: { x: 1050, y: actionY - ((techs.length - 1) * 55) / 2 + ti * 55 },
          data: { label: tech.name, technique: tech },
          style: {
            ...NODE_STYLE_BASE,
            background: '#16213e',
            borderColor: color + '66',
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 500,
          },
        })
        edges.push({ id: `${actionId}-${techId}`, source: actionId, target: techId, type: 'smoothstep' })
      })
    })
  })

  return { nodes, edges }
}

function buildByActionGraph(techniques) {
  const nodes = []
  const edges = []

  nodes.push({
    id: 'root',
    position: { x: 0, y: 0 },
    data: { label: `Mes Techniques (${techniques.length})` },
    style: {
      ...NODE_STYLE_BASE,
      background: '#6366f1',
      borderColor: '#818cf8',
      color: '#fff',
      fontSize: 15,
    },
  })

  const byAction = {}
  techniques.forEach((t) => {
    if (!byAction[t.action_type]) byAction[t.action_type] = {}
    if (!byAction[t.action_type][t.position]) byAction[t.action_type][t.position] = []
    byAction[t.action_type][t.position].push(t)
  })

  const actionKeys = Object.keys(byAction).sort()
  const actionSpacing = 250
  const startY = -((actionKeys.length - 1) * actionSpacing) / 2

  actionKeys.forEach((action, ai) => {
    const actionId = `action-${ai}`
    const color = ACTION_COLOR_MAP[action]
    const count = Object.values(byAction[action]).flat().length
    const y = startY + ai * actionSpacing

    nodes.push({
      id: actionId,
      position: { x: 350, y },
      data: { label: `${ACTION_LABEL_MAP[action]} (${count})` },
      style: {
        ...NODE_STYLE_BASE,
        background: color + '22',
        borderColor: color,
        color: color,
      },
    })
    edges.push({ id: `root-${actionId}`, source: 'root', target: actionId, type: 'smoothstep' })

    const posKeys = Object.keys(byAction[action]).sort()
    const posSpacing = 100
    const posStartY = y - ((posKeys.length - 1) * posSpacing) / 2

    posKeys.forEach((pos, pi) => {
      const posId = `${actionId}-pos-${pi}`
      const techs = byAction[action][pos]
      const posY = posStartY + pi * posSpacing

      nodes.push({
        id: posId,
        position: { x: 700, y: posY },
        data: { label: `${pos} (${techs.length})` },
        style: {
          ...NODE_STYLE_BASE,
          background: '#1e2a4a',
          borderColor: '#3b5998',
          color: '#e2e8f0',
        },
      })
      edges.push({ id: `${actionId}-${posId}`, source: actionId, target: posId, type: 'smoothstep' })

      techs.forEach((tech, ti) => {
        const techId = `tech-${tech.id}`
        nodes.push({
          id: techId,
          position: { x: 1050, y: posY - ((techs.length - 1) * 55) / 2 + ti * 55 },
          data: { label: tech.name, technique: tech },
          style: {
            ...NODE_STYLE_BASE,
            background: '#16213e',
            borderColor: color + '66',
            color: '#e2e8f0',
            fontSize: 12,
            fontWeight: 500,
          },
        })
        edges.push({ id: `${posId}-${techId}`, source: posId, target: techId, type: 'smoothstep' })
      })
    })
  })

  return { nodes, edges }
}

export default function MindMap({ techniques, mode, onSelectTechnique }) {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])

  useEffect(() => {
    if (techniques.length === 0) {
      setNodes([])
      setEdges([])
      return
    }
    const graph = mode === 'position'
      ? buildByPositionGraph(techniques)
      : buildByActionGraph(techniques)
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [techniques, mode])

  const onNodeClick = useCallback(
    (_event, node) => {
      if (node.data?.technique) {
        onSelectTechnique(node.data.technique)
      }
    },
    [onSelectTechnique]
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
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#2a3a5c" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}
