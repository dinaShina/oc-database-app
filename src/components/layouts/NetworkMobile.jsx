import { useMemo, useState } from "react";
import CharacterNetworkEditor from "../CharacterNetworkEditor.jsx";

export default function NetworkMobile(props) {
  const { familyMembers, oc, relationshipMaps, relationships = [] } = props;
  const [view, setView] = useState("list");
  const visibleFamily = familyMembers.filter((member) => member.ownerOcId === oc.id);
  const graph = relationshipMaps.find((map) => map.ownerOcId === oc.id);
  const relationshipRows = useMemo(() => {
    const graphRows = graph?.edges?.map((edge) => ({
      id: edge.id,
      title: edge.label || "Relationship",
      detail: [edge.ocFeels, edge.targetFeels].filter(Boolean).join(" / "),
      notes: edge.notes
    })) || [];
    const legacyRows = relationships.filter((item) => item.fromOcId === oc.id).map((item) => ({
      id: item.id,
      title: item.label || item.characterName || "Relationship",
      detail: item.characterName,
      notes: item.notes
    }));
    return [...graphRows, ...legacyRows];
  }, [graph, relationships, oc.id]);

  return (
    <section className="mobile-network-layout">
      <div className="mobile-network-toggle" role="tablist" aria-label="Network mobile views">
        <button className={view === "list" ? "tab-button active" : "tab-button"} type="button" onClick={() => setView("list")}>List</button>
        <button className={view === "graph" ? "tab-button active" : "tab-button"} type="button" onClick={() => setView("graph")}>Graph</button>
      </div>

      {view === "list" ? (
        <div className="mobile-network-list">
          <section className="panel dashboard-panel">
            <h2>Family</h2>
            {visibleFamily.length === 0 ? <p className="empty-state">No family members yet.</p> : visibleFamily.map((member) => (
              <article className="desk-card" key={member.id}><strong>{member.name}</strong><span>{member.relationLabel || "Family member"}</span>{member.notes ? <small>{member.notes}</small> : null}</article>
            ))}
          </section>
          <section className="panel dashboard-panel">
            <h2>Relationships</h2>
            {relationshipRows.length === 0 ? <p className="empty-state">No relationships yet.</p> : relationshipRows.map((row) => (
              <article className="desk-card" key={row.id}><strong>{row.title}</strong>{row.detail ? <span>{row.detail}</span> : null}{row.notes ? <small>{row.notes}</small> : null}</article>
            ))}
          </section>
        </div>
      ) : <CharacterNetworkEditor {...props} />}
    </section>
  );
}
