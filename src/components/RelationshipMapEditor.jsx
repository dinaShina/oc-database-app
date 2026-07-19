import { useMemo, useRef, useState } from "react";
import {
  INITIAL_RELATIONSHIP_EDGE,
  INITIAL_RELATIONSHIP_NODE,
  RELATIONSHIP_DIRECTIONS,
  RELATIONSHIP_LABELS
} from "../data/relationshipSchema.js";
import MediaInput from "./MediaInput.jsx";
import { saveRelationshipMaps, upsertRelationshipMap } from "../storage/relationshipMapRepository.js";

const CANVAS_HEIGHT = 680;
const NODE_WIDTH = 190;
const NODE_HEIGHT = 118;

export default function RelationshipMapEditor({
  embedded = false,
  oc,
  ocs,
  onBack,
  onRelationshipMapsChange,
  relationshipMaps,
  relationships = []
}) {
  const canvasRef = useRef(null);
  const [nodeForm, setNodeForm] = useState(INITIAL_RELATIONSHIP_NODE);
  const [edgeForm, setEdgeForm] = useState(INITIAL_RELATIONSHIP_EDGE);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingEdgeId, setEditingEdgeId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [canvasPanning, setCanvasPanning] = useState(null);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [expandedNodeIds, setExpandedNodeIds] = useState([]);
  const [expandedEdgeIds, setExpandedEdgeIds] = useState([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const graph = useMemo(
    () => getGraphForOC(relationshipMaps, relationships, oc, ocs),
    [relationshipMaps, relationships, oc, ocs]
  );

  const nodes = graph.nodes;
  const edges = graph.edges;
  const savedTargetOCs = ocs.filter((item) => item.id !== oc.id);
  const Wrapper = embedded ? "div" : "section";

  function persistGraph(nextGraph) {
    const nextMaps = upsertRelationshipMap(relationshipMaps, oc.id, nextGraph);
    saveRelationshipMaps(nextMaps);
    onRelationshipMapsChange(nextMaps);
  }

  function updateNodeForm(event) {
    const { name, value } = event.target;
    setNodeForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "savedOcId") {
        const savedOC = ocs.find((item) => item.id === value);
        if (savedOC) {
          next.name = savedOC.name;
          next.profilePictureUrl = savedOC.profilePictureUrl || "";
          next.profilePictureData = savedOC.profilePictureData || "";
        }
      }
      return next;
    });
  }

  function updateEdgeForm(event) {
    const { name, value } = event.target;
    setEdgeForm((current) => ({ ...current, [name]: value }));
  }

  function updateNodeImage({ data, url }) {
    setNodeForm((current) => ({ ...current, profilePictureData: data, profilePictureUrl: url }));
  }

  function handleNodeSubmit(event) {
    event.preventDefault();
    if (!nodeForm.name.trim()) return;

    const normalizedNode = {
      ...INITIAL_RELATIONSHIP_NODE,
      ...nodeForm,
      name: nodeForm.name.trim(),
      x: Number(nodeForm.x) || 460,
      y: Number(nodeForm.y) || 220
    };

    if (editingNodeId) {
      persistGraph({
        ...graph,
        nodes: nodes.map((node) => (node.id === editingNodeId ? { ...node, ...normalizedNode, id: node.id } : node))
      });
    } else {
      persistGraph({
        ...graph,
        nodes: [{ ...normalizedNode, id: crypto.randomUUID() }, ...nodes]
      });
    }

    closeEditor();
  }

  function startNodeEdit(node) {
    if (node.id === "main") return;
    setEditingNodeId(node.id);
    setEditingEdgeId(null);
    setNodeForm({ ...INITIAL_RELATIONSHIP_NODE, ...node });
    setEdgeForm(INITIAL_RELATIONSHIP_EDGE);
    setIsEditorOpen(true);
  }

  function cancelNodeEdit() {
    setEditingNodeId(null);
    setNodeForm(INITIAL_RELATIONSHIP_NODE);
  }

  function deleteNode(nodeId) {
    if (nodeId === "main") return;
    persistGraph({
      ...graph,
      nodes: nodes.filter((node) => node.id !== nodeId),
      edges: edges.filter((edge) => edge.fromNodeId !== nodeId && edge.toNodeId !== nodeId)
    });
    if (editingNodeId === nodeId) cancelNodeEdit();
  }

  function handleEdgeSubmit(event) {
    event.preventDefault();
    if (!edgeForm.fromNodeId || !edgeForm.toNodeId || edgeForm.fromNodeId === edgeForm.toNodeId) return;

    const normalizedEdge = {
      ...INITIAL_RELATIONSHIP_EDGE,
      ...edgeForm,
      label: edgeForm.label.trim()
    };

    if (editingEdgeId) {
      persistGraph({
        ...graph,
        edges: edges.map((edge) => (edge.id === editingEdgeId ? { ...edge, ...normalizedEdge, id: edge.id } : edge))
      });
    } else {
      persistGraph({
        ...graph,
        edges: [{ ...normalizedEdge, id: crypto.randomUUID() }, ...edges]
      });
    }

    closeEditor();
  }

  function startEdgeEdit(edge) {
    setEditingEdgeId(edge.id);
    setEditingNodeId(null);
    setEdgeForm({ ...INITIAL_RELATIONSHIP_EDGE, ...edge });
    setNodeForm(INITIAL_RELATIONSHIP_NODE);
    setIsEditorOpen(true);
  }

  function cancelEdgeEdit() {
    setEditingEdgeId(null);
    setEdgeForm(INITIAL_RELATIONSHIP_EDGE);
  }

  function openEditor() {
    setEditingNodeId(null);
    setEditingEdgeId(null);
    setNodeForm(INITIAL_RELATIONSHIP_NODE);
    setEdgeForm(INITIAL_RELATIONSHIP_EDGE);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setEditingNodeId(null);
    setEditingEdgeId(null);
    setNodeForm(INITIAL_RELATIONSHIP_NODE);
    setEdgeForm(INITIAL_RELATIONSHIP_EDGE);
    setIsEditorOpen(false);
  }
  function deleteEdge(edgeId) {
    persistGraph({ ...graph, edges: edges.filter((edge) => edge.id !== edgeId) });
    if (editingEdgeId === edgeId) cancelEdgeEdit();
  }

  function startDrag(event, node) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const point = getCanvasPoint(event);
    if (!point) return;
    setDragging({
      nodeId: node.id,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y
    });
  }

  function startCanvasPan(event) {
    if (event.button !== 0 || event.target.closest("button, input, textarea, select, .graph-node")) return;
    setCanvasPanning({ startX: event.clientX, startY: event.clientY, originX: canvasPan.x, originY: canvasPan.y });
  }

  function moveDrag(event) {
    if (dragging) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const point = getCanvasPoint(event);
      if (!rect || !point) return;

      const logicalWidth = Math.max(rect.width, rect.width / zoom);
      const x = clamp(point.x - dragging.offsetX, 8, logicalWidth - NODE_WIDTH - 8);
      const y = clamp(point.y - dragging.offsetY, 8, CANVAS_HEIGHT - NODE_HEIGHT - 8);
      persistGraph({
        ...graph,
        nodes: nodes.map((node) => (node.id === dragging.nodeId ? { ...node, x, y } : node))
      });
      return;
    }

    if (canvasPanning) {
      setCanvasPan({
        x: canvasPanning.originX + event.clientX - canvasPanning.startX,
        y: canvasPanning.originY + event.clientY - canvasPanning.startY
      });
    }
  }

  function stopDrag() {
    setDragging(null);
    setCanvasPanning(null);
  }

  function getCanvasPoint(event) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: (event.clientX - rect.left - canvasPan.x) / zoom,
      y: (event.clientY - rect.top - canvasPan.y) / zoom
    };
  }

  function handleWheelZoom(event) {
    if (!canvasRef.current) return;
    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const nextZoom = clamp(Number((zoom + (event.deltaY < 0 ? 0.08 : -0.08)).toFixed(2)), 0.55, 1.7);
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const logicalX = (mouseX - canvasPan.x) / zoom;
    const logicalY = (mouseY - canvasPan.y) / zoom;
    setZoom(nextZoom);
    setCanvasPan({ x: mouseX - logicalX * nextZoom, y: mouseY - logicalY * nextZoom });
  }
  function changeZoom(delta) {
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), 0.55, 1.65));
  }

  function resetView() {
    setZoom(1);
    setCanvasPan({ x: 0, y: 0 });
  }

  function toggleExpandedNode(nodeId) {
    setExpandedNodeIds((current) => current.includes(nodeId) ? current.filter((id) => id !== nodeId) : [...current, nodeId]);
  }

  function toggleExpandedEdge(edgeId) {
    setExpandedEdgeIds((current) => current.includes(edgeId) ? current.filter((id) => id !== edgeId) : [...current, edgeId]);
  }

  const nodeImage = nodeForm.profilePictureData || nodeForm.profilePictureUrl;

  return (
    <Wrapper className={embedded ? "network-tab-panel" : "panel editor-page"}>
      {!embedded ? (
        <div className="page-heading">
          <button className="secondary-button" type="button" onClick={onBack}>Back to OC list</button>
          <div>
            <p className="eyebrow">Relationship Map</p>
            <h2>{oc.name}</h2>
          </div>
        </div>
      ) : null}

      {isEditorOpen ? <div className="dialog-backdrop" role="presentation"><section className="confirm-dialog relationship-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="relationship-dialog-title"><div className="modal-heading-row"><div><p className="eyebrow">Relationship Map</p><h2 id="relationship-dialog-title">{editingNodeId ? "Edit Character Node" : editingEdgeId ? "Edit Relationship" : "Add Relationship"}</h2></div><button className="icon-close-button" type="button" onClick={closeEditor} aria-label="Close">x</button></div><div className="relationship-map-tools">
        <form className="sub-form" onSubmit={handleNodeSubmit}>
          <h3>{editingNodeId ? "Edit character node" : "Add character node"}</h3>
          <div className="field-grid">
            <label className="field">
              <span>Node type</span>
              <select name="type" value={nodeForm.type} onChange={updateNodeForm}>
                <option value="savedOC">Saved OC</option>
                <option value="manualCharacter">Manual character</option>
                <option value="canonCharacter">Later canon character</option>
              </select>
            </label>

            {nodeForm.type === "savedOC" ? (
              <label className="field">
                <span>Saved OC</span>
                <select name="savedOcId" value={nodeForm.savedOcId} onChange={updateNodeForm}>
                  <option value="">Choose OC</option>
                  {savedTargetOCs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            ) : null}

            {nodeForm.type === "canonCharacter" ? (
              <TextInput label="Character pack id" name="canonCharacterPackId" value={nodeForm.canonCharacterPackId} placeholder="Prepared for later packs" onChange={updateNodeForm} />
            ) : null}

            <TextInput label="Character name" name="name" value={nodeForm.name} onChange={updateNodeForm} />
            <MediaInput label="Profile Picture" dataValue={nodeForm.profilePictureData} urlValue={nodeForm.profilePictureUrl} onChange={updateNodeImage} />
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea name="notes" value={nodeForm.notes} rows="3" onChange={updateNodeForm} />
          </label>

          <div className="form-actions">
            <button className="primary-button inline-primary" type="submit">{editingNodeId ? "Save node" : "Add node"}</button>
            <button className="secondary-button" type="button" onClick={closeEditor}>Cancel</button>
          </div>
        </form>

        <form className="sub-form" onSubmit={handleEdgeSubmit}>
          <h3>{editingEdgeId ? "Edit relationship line" : "Add relationship line"}</h3>
          <div className="field-grid">
            <NodeSelect label="From" name="fromNodeId" nodes={nodes} value={edgeForm.fromNodeId} onChange={updateEdgeForm} />
            <NodeSelect label="To" name="toNodeId" nodes={nodes} value={edgeForm.toNodeId} onChange={updateEdgeForm} />
            <label className="field">
              <span>Relationship label</span>
              <input name="label" list="relationship-labels" value={edgeForm.label} placeholder="loves, hates, friend..." onChange={updateEdgeForm} />
              <datalist id="relationship-labels">
                {RELATIONSHIP_LABELS.map((label) => <option key={label} value={label} />)}
              </datalist>
            </label>
            <label className="field">
              <span>Direction</span>
              <select name="direction" value={edgeForm.direction} onChange={updateEdgeForm}>
                {RELATIONSHIP_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}
              </select>
            </label>
            <TextInput label="How the OC feels" name="ocFeels" value={edgeForm.ocFeels} onChange={updateEdgeForm} />
            <TextInput label="How this character feels" name="targetFeels" value={edgeForm.targetFeels} onChange={updateEdgeForm} />
          </div>
          <label className="field">
            <span>Relationship notes</span>
            <textarea name="notes" value={edgeForm.notes} rows="3" onChange={updateEdgeForm} />
          </label>
          <div className="form-actions">
            <button className="primary-button inline-primary" type="submit">{editingEdgeId ? "Save line" : "Add line"}</button>
            <button className="secondary-button" type="button" onClick={closeEditor}>Cancel</button>
          </div>
        </form>
      </div></section></div> : null}

      <section className="map-focus-wrap">
        <div className="graph-view-toolbar" aria-label="Relationship map view controls">
          <button className="secondary-button" type="button" onClick={resetView}>Reset View</button>
          <span>{Math.round(zoom * 100)}% - wheel to zoom, drag blank space to pan</span>
        </div>
        <button className="floating-add-button map-add-button" type="button" onClick={openEditor} aria-label="Add relationship">+</button>

      <div className={canvasPanning ? "graph-canvas is-panning" : "graph-canvas"} ref={canvasRef} onWheel={handleWheelZoom} onPointerDown={startCanvasPan} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerLeave={stopDrag} style={{ height: CANVAS_HEIGHT }}>
        <div className="graph-viewport" style={{ transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${zoom})` }}>
          <svg className="graph-lines" aria-hidden="true">
            {edges.map((edge) => <GraphEdge key={edge.id} edge={edge} nodes={nodes} />)}
          </svg>

          {nodes.map((node) => (
            <article
              className={node.id === "main" ? "graph-node main-graph-node" : "graph-node"}
              key={node.id}
              onPointerDown={(event) => startDrag(event, node)}
              style={{ left: node.x, top: node.y }}
            >
              <ProfileImage source={node.profilePictureData || node.profilePictureUrl} name={node.name} />
              <div className="graph-node-body">
                <h3>{node.name || "Unnamed character"}</h3>
                <p>{getNodeTypeLabel(node.type)}</p>
                <ExpandablePreview className="muted-text graph-note" id={node.id} isExpanded={expandedNodeIds.includes(node.id)} onToggle={toggleExpandedNode} text={node.notes} />
              </div>
              <div className="graph-node-actions" onPointerDown={(event) => event.stopPropagation()}>
                {node.id !== "main" ? <button className="secondary-button" type="button" onClick={() => startNodeEdit(node)}>Edit</button> : null}
                {node.id !== "main" ? <button className="delete-button" type="button" onClick={() => deleteNode(node.id)}>Delete</button> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
      </section>

      <div className="edge-list">
        <h3>Relationship lines</h3>
        {edges.length === 0 ? <p className="empty-state">No relationship lines yet.</p> : edges.map((edge) => (
          <article className="edge-row" key={edge.id}>
            <div>
              <h3>{edge.label || "Unlabeled relationship"}</h3>
              <p>{getNodeName(nodes, edge.fromNodeId)}{" -> "}{getNodeName(nodes, edge.toNodeId)}{" | "}{edge.direction}</p>
              {edge.ocFeels ? <p className="muted-text">OC feels: {edge.ocFeels}</p> : null}
              {edge.targetFeels ? <p className="muted-text">Other feels: {edge.targetFeels}</p> : null}
              <ExpandablePreview className="muted-text" id={edge.id} isExpanded={expandedEdgeIds.includes(edge.id)} onToggle={toggleExpandedEdge} text={edge.notes} />
            </div>
            <div className="card-actions">
              <button className="secondary-button" type="button" onClick={() => startEdgeEdit(edge)}>Edit</button>
              <button className="delete-button" type="button" onClick={() => deleteEdge(edge.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </Wrapper>
  );
}

function GraphEdge({ edge, nodes }) {
  const from = nodes.find((node) => node.id === edge.fromNodeId);
  const to = nodes.find((node) => node.id === edge.toNodeId);
  if (!from || !to) return null;

  const x1 = from.x + NODE_WIDTH / 2;
  const y1 = from.y + NODE_HEIGHT / 2;
  const x2 = to.x + NODE_WIDTH / 2;
  const y2 = to.y + NODE_HEIGHT / 2;
  const labelX = (x1 + x2) / 2;
  const labelY = (y1 + y2) / 2;

  return (
    <g>
      <line className="graph-line" x1={x1} y1={y1} x2={x2} y2={y2} />
      {edge.direction === "one-way" ? <polygon className="graph-arrow" points={getArrowPoints(x1, y1, x2, y2)} /> : null}
      <foreignObject x={labelX - 72} y={labelY - 18} width="144" height="38">
        <div className="graph-edge-label">{edge.label || "relationship"}</div>
      </foreignObject>
    </g>
  );
}

function getGraphForOC(relationshipMaps, legacyRelationships, oc, ocs) {
  const savedMap = relationshipMaps.find((map) => map.ownerOcId === oc.id);
  const savedMainNode = savedMap?.nodes.find((node) => node.id === "main");
  const mainNode = createMainNode(oc, savedMainNode);

  if (savedMap) {
    const otherNodes = savedMap.nodes.filter((node) => node.id !== "main");
    return { ...savedMap, nodes: [mainNode, ...otherNodes] };
  }

  return {
    id: crypto.randomUUID(),
    ownerOcId: oc.id,
    nodes: [mainNode, ...legacyRelationships.filter((relationship) => relationship.fromOcId === oc.id).map((relationship, index) => legacyRelationshipToNode(relationship, ocs, index))],
    edges: legacyRelationships.filter((relationship) => relationship.fromOcId === oc.id).map(legacyRelationshipToEdge),
    createdAt: "",
    updatedAt: ""
  };
}

function createMainNode(oc, savedMainNode = {}) {
  return {
    id: "main",
    type: "savedOC",
    savedOcId: oc.id,
    canonCharacterId: "",
    canonCharacterPackId: "",
    name: oc.name,
    profilePictureUrl: oc.profilePictureUrl || "",
    profilePictureData: oc.profilePictureData || "",
    notes: savedMainNode.notes || "Main character",
    x: Number.isFinite(Number(savedMainNode.x)) ? Number(savedMainNode.x) : 360,
    y: Number.isFinite(Number(savedMainNode.y)) ? Number(savedMainNode.y) : 260
  };
}

function legacyRelationshipToNode(relationship, ocs, index) {
  const savedOC = ocs.find((item) => item.id === relationship.toCharacterId);
  const type = relationship.targetType === "manualCharacter" ? "manualCharacter" : relationship.targetType === "canonCharacter" ? "canonCharacter" : "savedOC";

  return {
    id: `legacy-node-${relationship.id}`,
    type,
    savedOcId: relationship.toCharacterId || "",
    canonCharacterId: relationship.canonCharacterId || "",
    canonCharacterPackId: relationship.canonCharacterPackId || "",
    name: relationship.characterName || relationship.canonCharacterName || savedOC?.name || "Unknown character",
    profilePictureUrl: savedOC?.profilePictureUrl || "",
    profilePictureData: savedOC?.profilePictureData || "",
    notes: relationship.notes || "",
    x: 120 + (index % 4) * 230,
    y: index < 4 ? 80 : 470
  };
}

function legacyRelationshipToEdge(relationship) {
  return {
    id: `legacy-edge-${relationship.id}`,
    fromNodeId: "main",
    toNodeId: `legacy-node-${relationship.id}`,
    label: relationship.label || "",
    ocFeels: "",
    targetFeels: "",
    notes: relationship.notes || "",
    direction: relationship.direction === "two-way" ? "mutual" : "one-way"
  };
}

function getArrowPoints(x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const tipX = x2 - NODE_WIDTH / 2 + Math.cos(angle) * 8;
  const tipY = y2 - NODE_HEIGHT / 2 + Math.sin(angle) * 8;
  const size = 8;
  const leftX = tipX - size * Math.cos(angle - Math.PI / 6);
  const leftY = tipY - size * Math.sin(angle - Math.PI / 6);
  const rightX = tipX - size * Math.cos(angle + Math.PI / 6);
  const rightY = tipY - size * Math.sin(angle + Math.PI / 6);
  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}

function NodeSelect({ label, name, nodes, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        <option value="">Choose node</option>
        {nodes.map((node) => <option key={node.id} value={node.id}>{node.name || "Unnamed character"}</option>)}
      </select>
    </label>
  );
}

function ProfileImage({ source, name }) {
  return <div className="profile-picture-preview graph-node-picture">{source ? <img src={source} alt={name || "Character"} /> : <span>No picture</span>}</div>;
}

function ExpandablePreview({ className = "", id, isExpanded, onToggle, text }) {
  if (!text) return null;
  const preview = getPreviewText(text, 74);
  const isLong = preview !== text;
  return (
    <p className={className}>
      {isExpanded || !isLong ? text : preview}
      {isLong ? (
        <button className="text-link-button" type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onToggle(id)}>
          {isExpanded ? "Show less" : "See more"}
        </button>
      ) : null}
    </p>
  );
}

function getPreviewText(value, maxLength) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function TextInput({ label, name, onChange, placeholder = "", value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} value={value} placeholder={placeholder} onChange={onChange} />
    </label>
  );
}

function getNodeName(nodes, nodeId) {
  return nodes.find((node) => node.id === nodeId)?.name || "Unknown node";
}

function getNodeTypeLabel(type) {
  if (type === "savedOC") return "saved OC";
  if (type === "canonCharacter") return "later canon character";
  return "manual character";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}








