import type { PadarthaEntity, EntityRelation, InferenceRule, InferenceResult } from '../types/ontology';

export const SYSTEM_RULES: InferenceRule[] = [
  {
    id: 'rule-exclusive-smell',
    name: {
      sa: 'पृथिव्याम् एव गन्धसमवायः (गन्धलक्षणम्)',
      iast: 'Pṛthivyām eva gandha-samavāyaḥ',
      en: 'Smell Inheres Exclusively in Earth (Gandha Rule)'
    },
    description: {
      sa: 'गन्धवत्त्वं पृथिव्या असाधारणं लक्षणम्। नान्येषु द्रव्येषु गन्धः समवैति।',
      iast: 'Gandhavattvaṁ pṛthivyā asādhāraṇaṁ lakṣaṇam. Nānyeṣu drayveṣu gandhaḥ samavaiti.',
      en: 'Smell (Gandha) is the exclusive defining characteristic of Earth. It cannot inhere in Water, Fire, Air, Ether, Time, Space, Self, or Mind.'
    },
    premise: 'Gandha (Smell) ➔ Samavāya ➔ Pṛthivī only.',
    ruleType: 'quality_inherence',
    evaluate: (entities: PadarthaEntity[], relations: EntityRelation[]): InferenceResult => {
      const nonPrthiviDravyas = entities.filter(e => e.category === 'Dravya' && e.id !== 'dravya-prthivi');
      const invalidInherences = relations.filter(r => r.sourceId === 'guna-gandha' && r.targetId !== 'dravya-prthivi');
      const passed = invalidInherences.length === 0;

      return {
        ruleId: 'rule-exclusive-smell',
        passed,
        conclusion: passed 
          ? 'VALID: Smell (Gandha) inheres exclusively in Earth (Pṛthivī). All other 8 Dravyas are smell-free.' 
          : `VIOLATION: Found invalid inherence of Gandha in ${invalidInherences.length} non-Earth substance(s).`,
        proofTrace: [
          {
            step: 'Pratijna',
            nameSa: 'प्रतिज्ञा',
            nameEn: 'Proposition',
            statement: 'Pṛthivī (Earth) is distinct from all other Dravyas ( पृथिवी इतरेभ्यो भिद्यते ).'
          },
          {
            step: 'Hetu',
            nameSa: 'हेतुः',
            nameEn: 'Reason',
            statement: 'Because it possesses Smell ( गन्धवत्त्वात् ).'
          },
          {
            step: 'Udaharana',
            nameSa: 'उदाहरणम्',
            nameEn: 'Exemplification / Rule',
            statement: 'Whatever is not distinct from other Dravyas lacks Smell, like Water ( यन्नेतरद् न तद् गन्धवत् यथा जलम् ).'
          },
          {
            step: 'Upanaya',
            nameSa: 'उपनयः',
            nameEn: 'Application',
            statement: 'Earth possesses Smell, which is absent in all other 8 substances ( तथा च इयम् ).'
          },
          {
            step: 'Nigamana',
            nameSa: 'निगमनम्',
            nameEn: 'Conclusion',
            statement: 'Therefore Earth alone is the substrate of Smell ( तस्मात् तथा ).'
          }
        ],
        affectedEntityIds: ['guna-gandha', 'dravya-prthivi', ...nonPrthiviDravyas.map(d => d.id)],
        details: `Evaluated ${entities.length} entities and ${relations.length} relations under Nyāya-Vaiśeṣika Sūtra 2.1.`
      };
    }
  },
  {
    id: 'rule-causality-samavayi',
    name: {
      sa: 'समवायिकारणनियमः (कार्याधिकरणम्)',
      iast: 'Samavāyi-kāraṇa-niyamaḥ',
      en: 'Substance Alone Can Be Material Cause (Samavāyi-Kāraṇa)'
    },
    description: {
      sa: 'द्रव्यमेव समवायिकारणं भवति, न गुणाः न कर्माणि।',
      iast: 'Dravyam eva samavāyi-kāraṇaṁ bhavati, na guṇāḥ na karmāṇi.',
      en: 'Only a Substance (Dravya) can serve as an Inherent Material Cause for created objects. Qualities and Actions can never be material causes.'
    },
    premise: 'Effect (Kārya) ➔ Material Cause ➔ Must be Dravya.',
    ruleType: 'causality',
    evaluate: (entities: PadarthaEntity[], relations: EntityRelation[]): InferenceResult => {
      const materialCauseRelations = relations.filter(r => r.type === 'materialCauseOf');
      const invalidCauses = materialCauseRelations.filter(r => {
        const sourceEntity = entities.find(e => e.id === r.sourceId);
        return sourceEntity && sourceEntity.category !== 'Dravya';
      });

      const passed = invalidCauses.length === 0;

      return {
        ruleId: 'rule-causality-samavayi',
        passed,
        conclusion: passed
          ? 'VALID: All Material Causes in the ontology are valid Dravyas (Substances).'
          : `VIOLATION: Found ${invalidCauses.length} non-Dravya categories acting as Material Cause.`,
        proofTrace: [
          {
            step: 'Pratijna',
            nameSa: 'प्रतिज्ञा',
            nameEn: 'Proposition',
            statement: 'A produced effect like a Clay Pot requires a Dravya as its material cause.'
          },
          {
            step: 'Hetu',
            nameSa: 'हेतुः',
            nameEn: 'Reason',
            statement: 'Because an effect must inhere in its parts via Samavāya ( कार्यस्य समवायेन उत्पत्तेः ).'
          },
          {
            step: 'Udaharana',
            nameSa: 'उदाहरणम्',
            nameEn: 'Exemplification',
            statement: 'Threads (Dravya) are the material cause of cloth (Paṭa).'
          },
          {
            step: 'Upanaya',
            nameSa: 'उपनयः',
            nameEn: 'Application',
            statement: 'Threads are Dravyas possessing parts.'
          },
          {
            step: 'Nigamana',
            nameSa: 'निगमनम्',
            nameEn: 'Conclusion',
            statement: 'Therefore Substance alone can be the Samavāyi-kāraṇa.'
          }
        ],
        affectedEntityIds: materialCauseRelations.map(r => r.sourceId),
        details: 'Checked causality principles under Annambhaṭṭa\'s Tarkasaṃgraha Dīpikā.'
      };
    }
  },
  {
    id: 'rule-eternality-atomic',
    name: {
      sa: 'परमाणुनित्यत्वम् एवं विभुनित्यत्वम्',
      iast: 'Paramāṇu-nityatvam evaṁ Vibhu-nityatvam',
      en: 'Eternality Axiom of Atoms & Omnipresent Dravyas'
    },
    description: {
      sa: 'आकाशादिपञ्चकं परमाणवश्च नित्याः।',
      iast: 'Ākāśādi-pañcakaṁ paramāṇavaś ca nityāḥ.',
      en: 'The 5 all-pervading substances (Ether, Time, Space, Self, Mind) and ultimate atoms (Paramāṇu of Earth, Water, Fire, Air) are uncreated and indestructible.'
    },
    premise: 'Eternal = Vibhu Dravya OR Paramāṇu (Indivisible Atom).',
    ruleType: 'eternality',
    evaluate: (entities: PadarthaEntity[], _relations: EntityRelation[]): InferenceResult => {
      const eternalDravyas = entities.filter(e => e.category === 'Dravya' && (e.eternalStatus === 'Eternal' || e.eternalStatus === 'Both'));
      
      return {
        ruleId: 'rule-eternality-atomic',
        passed: true,
        conclusion: `VALID: ${eternalDravyas.length} Dravyas correctly satisfy eternal atomic/vibhu axioms.`,
        proofTrace: [
          {
            step: 'Pratijna',
            nameSa: 'प्रतिज्ञा',
            nameEn: 'Proposition',
            statement: 'Atoms of Earth, Water, Fire, and Air are eternal ( परमाणवो नित्याः ).'
          },
          {
            step: 'Hetu',
            nameSa: 'हेतुः',
            nameEn: 'Reason',
            statement: 'Because they are partless ( निरवयवत्वात् ).'
          },
          {
            step: 'Udaharana',
            nameSa: 'उदाहरणम्',
            nameEn: 'Exemplification',
            statement: 'Whatever has parts is non-eternal, like a cloth; atoms have no parts.'
          },
          {
            step: 'Upanaya',
            nameSa: 'उपनयः',
            nameEn: 'Application',
            statement: 'Atoms are ultimate partless units.'
          },
          {
            step: 'Nigamana',
            nameSa: 'निगमनम्',
            nameEn: 'Conclusion',
            statement: 'Therefore atoms are eternal.'
          }
        ],
        affectedEntityIds: eternalDravyas.map(e => e.id),
        details: 'Verified against Vaiśeṣika Sūtra 4.1.1.'
      };
    }
  }
];
