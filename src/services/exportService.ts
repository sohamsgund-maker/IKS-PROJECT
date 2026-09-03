import type { PadarthaEntity, EntityRelation } from '../types/ontology';

export function exportToJSONLD(entities: PadarthaEntity[], relations: EntityRelation[]): string {
  const jsonld = {
    '@context': {
      '@vocab': 'http://padartha.org/ontology#',
      'poms': 'http://padartha.org/ontology#',
      'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',
      'nameSa': { '@id': 'poms:nameSa', '@language': 'sa' },
      'nameIast': { '@id': 'poms:nameIast', '@language': 'sa-Latn' },
      'nameEn': { '@id': 'poms:nameEn', '@language': 'en' },
      'category': 'poms:category',
      'eternalStatus': 'poms:eternalStatus',
      'sutra': 'poms:sutraCitation'
    },
    '@graph': entities.map(entity => {
      const entityRelations = relations.filter(r => r.sourceId === entity.id);
      return {
        '@id': `poms:${entity.id}`,
        '@type': `poms:${entity.category}`,
        'nameSa': entity.name.sa,
        'nameIast': entity.name.iast,
        'nameEn': entity.name.en,
        'description': entity.description.en,
        'category': entity.category,
        'eternalStatus': entity.eternalStatus,
        'attributes': entity.attributes,
        'tags': entity.tags,
        ...(entity.sutra ? {
          'sutra': {
            'textSa': entity.sutra.textSa,
            'textIast': entity.sutra.textIast,
            'translation': entity.sutra.translation,
            'source': entity.sutra.source
          }
        } : {}),
        'relations': entityRelations.map(r => ({
          'relationType': r.type,
          'targetId': `poms:${r.targetId}`,
          'isEternal': r.isEternal
        }))
      };
    })
  };

  return JSON.stringify(jsonld, null, 2);
}

export function exportToTurtle(entities: PadarthaEntity[], relations: EntityRelation[]): string {
  let turtle = `@prefix poms: <http://padartha.org/ontology#> .\n`;
  turtle += `@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n`;
  turtle += `@prefix owl:  <http://www.w3.org/2002/07/owl#> .\n`;
  turtle += `@prefix xsd:  <http://www.w3.org/2001/XMLSchema#> .\n\n`;

  turtle += `# --- PADĀRTHA ONTOLOGY (NYĀYA-VAIŚEṢIKA SYSTEM) ---\n\n`;

  entities.forEach(entity => {
    turtle += `poms:${entity.id} a poms:${entity.category} ;\n`;
    turtle += `    rdfs:label "${entity.name.en}"@en ;\n`;
    turtle += `    poms:nameSa "${entity.name.sa}"@sa ;\n`;
    turtle += `    poms:nameIast "${entity.name.iast}"@sa-Latn ;\n`;
    turtle += `    poms:category "${entity.category}" ;\n`;
    turtle += `    poms:eternalStatus "${entity.eternalStatus}" .\n\n`;
  });

  relations.forEach(r => {
    turtle += `poms:${r.sourceId} poms:${r.type} poms:${r.targetId} .\n`;
  });

  return turtle;
}

export function exportToOWL(entities: PadarthaEntity[], _relations: EntityRelation[]): string {
  let owl = `<?xml version="1.0"?>\n`;
  owl += `<rdf:RDF xmlns="http://padartha.org/ontology#"\n`;
  owl += `     xml:base="http://padartha.org/ontology"\n`;
  owl += `     xmlns:owl="http://www.w3.org/2002/07/owl#"\n`;
  owl += `     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n`;
  owl += `     xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#">\n`;
  owl += `    <owl:Ontology rdf:about="http://padartha.org/ontology"/>\n\n`;

  entities.forEach(entity => {
    owl += `    <owl:Class rdf:about="http://padartha.org/ontology#${entity.id}">\n`;
    owl += `        <rdfs:label xml:lang="en">${entity.name.en}</rdfs:label>\n`;
    owl += `        <rdfs:label xml:lang="sa">${entity.name.sa}</rdfs:label>\n`;
    owl += `        <rdfs:comment xml:lang="en">${entity.description.en}</rdfs:comment>\n`;
    owl += `    </owl:Class>\n\n`;
  });

  owl += `</rdf:RDF>`;
  return owl;
}
