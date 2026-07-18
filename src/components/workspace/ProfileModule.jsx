import WorkspacePanel from "./WorkspacePanel.jsx";
import { getBirthSummary } from "../OCList.jsx";

const PROFILE_FACTS = [
  ["Full name", "fullName"], ["Nickname", "nickname"], ["Gender", "gender"], ["Gender details", "genderDetails"],
  ["Species / Being", "species"], ["Ethnicity / Ethnicities", "ethnicities"], ["Birthdate", "birth"], ["Current age", "currentAge"]
];

const APPEARANCE_FACTS = [
  ["Hair color", "hairColor"], ["Hair length", "hairLength"], ["Hair type / texture", "hairTexture"], ["Hair details", "hairDetails"],
  ["Beard color", "beardColor"], ["Beard length", "beardLength"], ["Beard style", "beardStyle"], ["Beard details", "beardDetails"],
  ["Face shape", "faceShape"], ["Facial features", "facialFeatures"], ["Expressions / resting face", "expressionsRestingFace"],
  ["Eye color", "eyeColor"], ["Eye shape", "eyeShape"], ["Eye details", "eyeDetails"], ["Skin tone", "skinTone"], ["Skin details", "skinDetails"],
  ["Height", "height"], ["Body type", "bodyType"], ["Build", "build"], ["Posture", "posture"], ["Scars", "scars"], ["Birthmarks", "birthmarks"],
  ["Tattoos", "tattoos"], ["Piercings", "piercings"], ["Clothing style", "clothingStyle"], ["Accessories", "accessories"], ["Signature item", "signatureItem"],
  ["Voice", "voice"], ["Scent", "scent"], ["Aura / presence", "auraPresence"], ["General appearance notes", "appearanceNotes"]
];

const LINK_FACTS = [
  ["Pinterest", "pinterestLink"], ["Playlist", "playlistLink"], ["Reference", "referenceLink"], ["Other", "otherLink"]
];

export default function ProfileModule({ oc, onEdit }) {
  const facts = PROFILE_FACTS.map(([label, key]) => [label, key === "birth" ? getBirthSummary(oc) : oc[key]]).filter(([, value]) => value && value !== "Unknown");
  const appearance = APPEARANCE_FACTS.filter(([, key]) => oc[key]).map(([label, key]) => [label, oc[key]]);
  const links = LINK_FACTS.filter(([, key]) => oc[key]).map(([label, key]) => [label, oc[key]]);

  return (
    <WorkspacePanel title="Profile">
      <div className="workspace-section-stack profile-clean-stack">
        <div className="profile-actions-row"><button className="secondary-button inline-primary" type="button" onClick={onEdit}>Edit profile</button></div>
        {facts.length > 0 ? <dl className="fact-list compact-facts profile-basics">{facts.map(([label, value]) => <Fact key={label} label={label} value={value} />)}</dl> : <p className="empty-state">No profile basics yet.</p>}
        <CollapsibleFacts label="Appearance" facts={appearance} />
        <CollapsibleText label="Personality" value={oc.personality} />
        <CollapsibleText label="Backstory" value={oc.backstory} />
        <CollapsibleText label="Skills / Powers" value={oc.skillsPowers} />
        <CollapsibleText label="Weaknesses" value={oc.weaknesses} />
        <CollapsibleText label="Notes" value={oc.notes || oc.genderNotes} />
        <CollapsibleFacts label="Links" facts={links} linkMode />
      </div>
    </WorkspacePanel>
  );
}

function CollapsibleFacts({ facts, label, linkMode = false }) {
  if (facts.length === 0) return null;
  return <details className="card-details profile-details"><summary>{label}</summary><dl className="fact-list compact-facts">{facts.map(([factLabel, value]) => <Fact key={factLabel} label={factLabel} value={value} linkMode={linkMode} />)}</dl></details>;
}

function CollapsibleText({ label, value }) {
  if (!value) return null;
  return <details className="card-details profile-details"><summary>{label}</summary><section className="text-block"><p>{value}</p></section></details>;
}

function Fact({ label, linkMode, value }) {
  if (!value) return null;
  return <div><dt>{label}</dt><dd>{linkMode ? <a href={value} target="_blank" rel="noreferrer">Open link</a> : value}</dd></div>;
}
