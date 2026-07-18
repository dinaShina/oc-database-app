export function createGlobalSearchIndex({ ocs, timelineData, worlds }) {
  return [
    ...ocs.map((oc) => ({ id: oc.id, type: "OC", title: oc.name, text: `${oc.name} ${oc.fandom} ${oc.species} ${oc.notes}` })),
    ...worlds.map((world) => ({ id: world.name, type: "World", title: world.name, text: `${world.name} ${world.type} ${world.description}` })),
    ...timelineData.events.map((event) => ({ id: event.id, type: "Timeline Event", title: event.title, text: `${event.title} ${event.description} ${event.notes}` }))
  ];
}
