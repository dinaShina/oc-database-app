import { WORLD_TYPE_FIELDS } from "../../data/ocFields.js";
import WorkspacePanel from "./WorkspacePanel.jsx";

export default function WorldModule({ oc }) {
  const fields = WORLD_TYPE_FIELDS[oc.worldType] || [];
  const facts = fields.map(([key, label]) => [label, oc[key]]).filter(([, value]) => value);

  return (
    <WorkspacePanel title="World">
      <dl className="fact-list compact-facts">
        <Fact label="World Type" value={oc.worldType} />
        {facts.map(([label, value]) => <Fact key={label} label={label} value={value} />)}
      </dl>
    </WorkspacePanel>
  );
}

function Fact({ label, value }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
