import type { PadarthaEntity, EntityRelation, SPARQLQuery, RealInstance, DarshanaComparison } from '../types/ontology';

export const INITIAL_PADARTHAS: PadarthaEntity[] = [
  // --- SAPTA-PADĀRTHAS (7 TOP-LEVEL CATEGORIES) ---
  {
    id: 'cat-dravya',
    category: 'Dravya',
    name: { sa: 'द्रव्यम्', iast: 'Dravyam', en: 'Substance' },
    description: {
      sa: 'क्रियागुणवत् समवायिकारणमिति द्रव्यलक्षणम्।',
      iast: 'Kriyā-guṇavat samavāyi-kāraṇam iti dravya-lakṣanam.',
      en: 'Substance is defined as the substrate that possesses qualities (Guṇa) and actions (Karma), and serves as an inherent material cause (Samavāyi-kāraṇa).'
    },
    sutra: {
      textSa: 'तत्राणि द्रव्याणि पृथिव्यप्तेजोवास्वाकाशाकालदिगात्ममनांसि नवैव।',
      textIast: 'Tatrāṇi dravyāṇi pṛthivy-ap-tejo-vāyv-ākāśa-kāla-dig-ātma-manāṁsi navaiva.',
      translation: 'Substances are precisely nine: Earth, Water, Fire, Air, Ether, Time, Space, Self, and Mind.',
      source: 'Tarkasaṃgraha 2'
    },
    eternalStatus: 'Both',
    attributes: ['Substrate of Qualities', 'Substrate of Actions', 'Material Cause'],
    tags: ['Padārtha', 'Primary Category', 'Substance'],
    color: '#EAB308' // Gold
  },
  {
    id: 'cat-guna',
    category: 'Guna',
    name: { sa: 'गुणः', iast: 'Guṇaḥ', en: 'Quality / Attribute' },
    description: {
      sa: 'द्रव्याश्रित्यानिर्गुणः कारणं निष्क्रियागुणाः।',
      iast: 'Dravyāśrity anirguṇaḥ kāraṇaṁ niṣkriyā-guṇāḥ.',
      en: 'A Quality inheres in a substance, is itself quality-less (anirguṇa), static (niṣkriya), and serves as a non-material cause.'
    },
    sutra: {
      textSa: 'रूपरसगन्धस्पर्शसंख्यापरिमाणपृथक्त्वसंयोगविभागपरत्वापरत्वबुद्धिसुखदुःखेच्छाद्वेषप्रयत्नगुरुत्वद्रवत्वस्नेहसंस्कारधर्माधर्मशब्दाः चतुर्विंशतिगुणाः।',
      textIast: 'Rūpa-rasa-gandha-sparśa-saṅkhyā-parimāṇa-pṛthaktva-saṃyoga-vibhāga-paratva-aparatva-buddhi-sukha-duḥkha-ecchā-dveṣa-prayatna-gurutva-dravatva-sneha-saṃskāra-dharma-adharma-śabdāḥ caturviṁśati guṇāḥ.',
      translation: 'Qualities are twenty-four in number: Color, Taste, Smell, Touch, Number, Dimension, Distinctness, Conjunction, Disjunction, Priority, Posteriority, Intellect, Pleasure, Pain, Desire, Aversion, Effort, Weight, Fluidity, Viscosity, Impression/Velocity, Merit, Demerit, and Sound.',
      source: 'Tarkasaṃgraha 3'
    },
    eternalStatus: 'Both',
    attributes: ['Quality-less Substrate', 'Inheres in Dravya', 'Non-Material Cause'],
    tags: ['Padārtha', 'Quality', '24 Attributes'],
    color: '#3B82F6' // Blue
  },
  {
    id: 'cat-karma',
    category: 'Karma',
    name: { sa: 'कर्म', iast: 'Karma', en: 'Action / Motion' },
    description: {
      sa: 'एकद्रव्यमगुणं संयोगविभागेष्वपेक्षकारणं कर्म।',
      iast: 'Eka-dravyam aguṇaṁ saṁyoga-vibhāgeṣv apekṣa-kāraṇaṁ karma.',
      en: 'Action resides in a single physical substance, possesses no qualities, and is the direct cause of conjunction (Saṃyoga) and disjunction (Vibhāga).'
    },
    sutra: {
      textSa: 'उत्क्षेपणमवक्षेपणमाकुञ्चनं प्रसारणं गमनमिति पञ्चकर्माणि।',
      textIast: 'Utkṣepaṇam avakṣepaṇam ākuñcanaṁ prasāraṇam gamanam iti pañca karmāṇi.',
      translation: 'Actions are fivefold: Upward motion, Downward motion, Contraction, Expansion, and General Locomotion.',
      source: 'Tarkasaṃgraha 4'
    },
    eternalStatus: 'Non-Eternal',
    attributes: ['Dynamic Motion', 'Direct cause of Conjunction', 'Resides in Physical Dravya'],
    tags: ['Padārtha', 'Action', '5 Motions'],
    color: '#EF4444' // Red
  },
  {
    id: 'cat-samanya',
    category: 'Samanya',
    name: { sa: 'सामान्यम्', iast: 'Sāmānyam', en: 'Generality / Universal' },
    description: {
      sa: 'नित्यमेकमनेकानुगतं सामान्यम्।',
      iast: 'Nityam ekam anekānugataṁ sāmānyam.',
      en: 'Generality (Universal) is eternal, single, and inheres in many individuals (e.g. Dravyatva in all substances, Gotva in all cows).'
    },
    sutra: {
      textSa: 'परमपरं चेति द्विविधम्। परं सत्ता, अपरं द्रव्यत्वादि।',
      textIast: 'Param aparaṁ ceti dvividham. Paraṁ sattā, aparaṁ dravyatvādi.',
      translation: 'It is two-fold: Higher (Parā - Existence/Sattā) and Subordinate (Aparā - Substancehood/Dravyatva, Qualityhood/Guṇatva).',
      source: 'Tarkasaṃgraha 5'
    },
    eternalStatus: 'Eternal',
    attributes: ['Eternal Universal', 'Inheres in Multiple Individuals', 'Class Concept'],
    tags: ['Padārtha', 'Universal', 'Sattā'],
    color: '#10B981' // Emerald Green
  },
  {
    id: 'cat-visesa',
    category: 'Visesa',
    name: { sa: 'विशेषः', iast: 'Viśeṣaḥ', en: 'Particularity / Individuality' },
    description: {
      sa: 'नित्यद्रव्यवृत्तयो विशेषास्त्वनन्ता एव।',
      iast: 'Nitya-dravya-vṛttayo viśeṣās tv anantā eva.',
      en: 'Particularity is the ultimate principle of differentiation residing exclusively in eternal substances (atoms, souls, mind, space, time).'
    },
    sutra: {
      textSa: 'व्यावर्तका विशेषाः नित्यद्रव्यवर्तिनः।',
      textIast: 'Vyāvartakā viśeṣāḥ nitya-dravya-vartinaḥ.',
      translation: 'Particularities serve to distinguish indivisible eternal substances from one another.',
      source: 'Vaiśeṣika-sūtra 1.2.6'
    },
    eternalStatus: 'Eternal',
    attributes: ['Ultimate Differentiator', 'Resides in Eternal Atoms/Souls', 'Infinite in Number'],
    tags: ['Padārtha', 'Individuality', 'Vaiśeṣika Core'],
    color: '#8B5CF6' // Purple
  },
  {
    id: 'cat-samavaya',
    category: 'Samavaya',
    name: { sa: 'समवायः', iast: 'Samavāyaḥ', en: 'Inherence (Inseparable Relation)' },
    description: {
      sa: 'नित्यसम्बन्धः समवायः अयुतसिद्धवृत्तिः।',
      iast: 'Nitya-sambandhaḥ samavāyaḥ ayuta-siddha-vṛttiḥ.',
      en: 'Inherence is an eternal, intimate relation between two inseparable entities (Ayutasiddha), where one cannot exist without residing in the other.'
    },
    sutra: {
      textSa: 'अयुतसिद्धयोः सम्बन्धः समवायः। ययोर्द्वयोर्मध्ये एकमविनश्यदपराश्रितमेवावतिष्ठते तावयुतसिद्धौ।',
      textIast: 'Ayutasiddhayoḥ sambandhaḥ samavāyaḥ. Yayor dvayor madhye ekam avinaśyad aparāśritam evāvatiṣṭhate tāv ayutasiddhau.',
      translation: 'Inherence is the relation between five pairs of inseparable entities: Part-Whole, Quality-Substance, Action-Substance, Universal-Individual, Particularity-Eternal Substance.',
      source: 'Tarkasaṃgraha 7'
    },
    eternalStatus: 'Eternal',
    attributes: ['Inseparable Relation', 'Ayutasiddha', 'Single & Eternal'],
    tags: ['Padārtha', 'Relation', 'Inherence'],
    color: '#F59E0B' // Amber
  },
  {
    id: 'cat-abhava',
    category: 'Abhava',
    name: { sa: 'अभावः', iast: 'Abhāvaḥ', en: 'Non-existence / Absence' },
    description: {
      sa: 'ज्ञानाधीनाभावनिरूपणम्। भावभिन्नो ऽभावः।',
      iast: 'Jñānādhīnābhāva-nirūpaṇam. Bhāva-bhinno \'bhāvaḥ.',
      en: 'Non-existence is the category representing absence or negation of positive entities (Bhāva-padārthas).'
    },
    sutra: {
      textSa: 'अभावश्चतुर्विधः- प्रागभावः, प्रध्वंसाभावः, अत्यन्ताभावः, अन्योन्याभावश्चेति।',
      textIast: 'Abhāvaś caturvidhaḥ: prāgabhāvaḥ, pradhvaṁsābhāvaḥ, atyantābhāvaḥ, anyonyābhāvaś ceti.',
      translation: 'Non-existence is fourfold: Prior non-existence, Posterior non-existence (destruction), Absolute non-existence, and Mutual non-existence (difference).',
      source: 'Tarkasaṃgraha 8'
    },
    eternalStatus: 'Both',
    attributes: ['Negation Category', '4 Types', 'Relational Absence'],
    tags: ['Padārtha', 'Negation', 'Abhāva'],
    color: '#64748B' // Slate
  },

  // --- THE 9 DRAVYAS (SUBSTANCES) ---
  {
    id: 'dravya-prthivi',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'पृथिवी', iast: 'Pṛthivī', en: 'Earth (Solid State / Matter)' },
    description: {
      sa: 'तत्र गन्धवती पृथिवी। सा द्विविधा नित्या अनित्या च। नित्या परमाणुरूपा, अनित्या कार्यरूपा।',
      iast: 'Tatra gandhavatī pṛthivī. Sā dvividhā nityā anityā ca. Nityā paramāṇurūpā, anityā kāryarūpā.',
      en: 'Earth is that which possesses smell (Gandha) as its exclusive quality. It is atomic (eternal) or composed of products (non-eternal).'
    },
    sutra: {
      textSa: 'तत्र गन्धवती पृथिवी।',
      textIast: 'Tatra gandhavatī pṛthivī.',
      translation: 'Earth is uniquely characterized by the quality of Smell.',
      source: 'Tarkasaṃgraha 2.1'
    },
    eternalStatus: 'Both',
    attributes: ['Exclusive Smell (Gandha)', 'Possesses 14 Guṇas', 'Atomic & Composite forms'],
    associatedGunas: ['guna-gandha', 'guna-rupa', 'guna-rasa', 'guna-sparsa', 'guna-sankhya', 'guna-parimana', 'guna-prthaktva', 'guna-samyoga', 'guna-vibhaga', 'guna-paratva', 'guna-aparatva', 'guna-gurutva', 'guna-dravatva', 'guna-samskara'],
    associatedKarmas: ['karma-utksepana', 'karma-avaksepana', 'karma-akuncana', 'karma-prasarana', 'karma-gamana'],
    tags: ['Dravya', 'Bhūta', 'Physical Element'],
    color: '#D97706'
  },
  {
    id: 'dravya-ap',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'अपः (जलम्)', iast: 'Ap (Jalam)', en: 'Water (Liquid State)' },
    description: {
      sa: 'शीतस्पर्शवत्यः आपः। ताश्च द्विविधाः नित्या अनित्याश्च।',
      iast: 'Śīta-sparśavatyaḥ āpaḥ. Tāś ca dvividhāḥ nityā anityāś ca.',
      en: 'Water is characterized by natural coolness of touch (Śīta-sparśa) and sweet taste (Madhura rasa).'
    },
    sutra: {
      textSa: 'शीतस्पर्शवत्यः आपः। स्नेहो ऽपां विशेषगुणः।',
      textIast: 'Śīta-sparśavatyaḥ āpaḥ. Sneho \'pāṁ viśeṣa-guṇaḥ.',
      translation: 'Water has cold touch and Viscosity (Sneha) as its exclusive quality.',
      source: 'Tarkasaṃgraha 2.2'
    },
    eternalStatus: 'Both',
    attributes: ['Cool Touch', 'Natural Viscosity (Sneha)', 'Natural Fluidity (Dravatva)'],
    associatedGunas: ['guna-sneha', 'guna-rasa', 'guna-sparsa', 'guna-rupa', 'guna-dravatva'],
    tags: ['Dravya', 'Bhūta', 'Physical Element'],
    color: '#0284C7'
  },
  {
    id: 'dravya-tejas',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'तेजः', iast: 'Tejas', en: 'Fire (Thermal State / Light)' },
    description: {
      sa: 'उष्णस्पर्शवत् तेजः। तच्च द्विविधं नित्यमनित्यञ्च।',
      iast: 'Uṣṇa-sparśavat tejaḥ. Tac ca dvividhaṁ nityam anityañ ca.',
      en: 'Fire/Light possesses hot touch (Uṣṇa-sparśa) and luminous white color (Śukla-bhāsvara rūpa).'
    },
    sutra: {
      textSa: 'उष्णस्पर्शवत् तेजः।',
      textIast: 'Uṣṇa-sparśavat tejaḥ.',
      translation: 'Fire is uniquely characterized by hot touch.',
      source: 'Tarkasaṃgraha 2.3'
    },
    eternalStatus: 'Both',
    attributes: ['Hot Touch', 'Luminous Rūpa', 'Fourfold (Bhauma, Divya, Udarya, Ākara)'],
    associatedGunas: ['guna-rupa', 'guna-sparsa', 'guna-sankhya', 'guna-parimana'],
    tags: ['Dravya', 'Bhūta', 'Physical Element'],
    color: '#DC2626'
  },
  {
    id: 'dravya-vayu',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'वायुः', iast: 'Vāyuḥ', en: 'Air (Gaseous State / Motion)' },
    description: {
      sa: 'रूपरहितस्पर्शवान् वायुः। स द्विविधः नित्यश्चानित्यश्च।',
      iast: 'Rūpa-rahita-sparśavān vāyuḥ. Sa dvividhaḥ nityaś cānityaś ca.',
      en: 'Air is a physical substance that possesses touch (neither hot nor cold) but lacks color (Rūpa-rahita).'
    },
    sutra: {
      textSa: 'रूपरहितस्पर्शवान् वायुः।',
      textIast: 'Rūpa-rahita-sparśavān vāyuḥ.',
      translation: 'Air has touch without color.',
      source: 'Tarkasaṃgraha 2.4'
    },
    eternalStatus: 'Both',
    attributes: ['Colorless Touch', 'Impulsion (Prāṇa)', 'Atomic & Atmospheric'],
    associatedGunas: ['guna-sparsa', 'guna-sankhya', 'guna-parimana', 'guna-samskara'],
    tags: ['Dravya', 'Bhūta', 'Physical Element'],
    color: '#10B981'
  },
  {
    id: 'dravya-akasa',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'आकाशः', iast: 'Ākāśaḥ', en: 'Ether / Omnipresent Space' },
    description: {
      sa: 'शब्दगुणकमाकाशम्। तच्च एकं विभु नित्यञ्च।',
      iast: 'Śabda-guṇakam ākāśam. Tac ca ekaṁ vibhu nityañ ca.',
      en: 'Ether is the single, all-pervading (Vibhu), eternal substance whose exclusive quality is Sound (Śabda).'
    },
    sutra: {
      textSa: 'शब्दगुणकमाकाशम्।',
      textIast: 'Śabda-guṇakam ākāśam.',
      translation: 'Ether is the substratum of Sound.',
      source: 'Tarkasaṃgraha 2.5'
    },
    eternalStatus: 'Eternal',
    attributes: ['Substratum of Sound', 'All-Pervading (Vibhu)', 'Single (Eka)'],
    associatedGunas: ['guna-sabda', 'guna-sankhya', 'guna-parimana', 'guna-prthaktva', 'guna-samyoga', 'guna-vibhaga'],
    tags: ['Dravya', 'Vibhu', 'Eternal Element'],
    color: '#6366F1'
  },
  {
    id: 'dravya-kala',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'कालः', iast: 'Kālaḥ', en: 'Time' },
    description: {
      sa: 'अतीतादिव्यवहारहेतुः कालः। स च एको विभुर्नित्यश्च।',
      iast: 'Atītādi-vyavahāra-hetuḥ kālaḥ. Sa ca eko vibhur nityaś ca.',
      en: 'Time is the all-pervading eternal cause behind temporal concepts such as past, present, future, priority, and posteriority.'
    },
    sutra: {
      textSa: 'अतीतादिव्यवहारहेतुः कालः।',
      textIast: 'Atītādi-vyavahāra-hetuḥ kālaḥ.',
      translation: 'Time is the basis for temporal notions of past, present, and future.',
      source: 'Tarkasaṃgraha 2.6'
    },
    eternalStatus: 'Eternal',
    attributes: ['Temporal Cause', 'All-pervading', 'Single & Eternal'],
    associatedGunas: ['guna-paratva', 'guna-aparatva', 'guna-sankhya', 'guna-parimana'],
    tags: ['Dravya', 'Vibhu', 'Temporal'],
    color: '#8B5CF6'
  },
  {
    id: 'dravya-dik',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'दिक्', iast: 'Dik', en: 'Space / Directional Position' },
    description: {
      sa: 'प्राच्यादिव्यवहारहेतुर्दिक्। सा चैका विभ्वी नित्या च।',
      iast: 'Prācyādi-vyavahāra-hetur dik. Sā caikā vibhvī nityā ca.',
      en: 'Directional Space is the eternal, all-pervading cause of spatial orientations (East, West, Far, Near).'
    },
    sutra: {
      textSa: 'प्राच्यादिव्यवहारहेतुर्दिक्।',
      textIast: 'Prācyādi-vyavahāra-hetur dik.',
      translation: 'Space is the basis of directional usages.',
      source: 'Tarkasaṃgraha 2.7'
    },
    eternalStatus: 'Eternal',
    attributes: ['Directional Cause', 'Spatial Orientation', 'All-pervading'],
    associatedGunas: ['guna-paratva', 'guna-aparatva', 'guna-sankhya'],
    tags: ['Dravya', 'Vibhu', 'Spatial'],
    color: '#EC4899'
  },
  {
    id: 'dravya-atman',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'आत्मा', iast: 'Ātmā', en: 'Self / Consciousness Substrate' },
    description: {
      sa: 'ज्ञानाधिकरणमात्मा। स द्विविधः जीवात्मा परमात्मा चेति।',
      iast: 'Jñānādhikaraṇam ātmā. Sa dvividhaḥ jīvātmā paramātmā ceti.',
      en: 'The Self is the substrate of consciousness (Jnāna) and cognition. It is two-fold: Individual Self (Jīvātmā) and Supreme Self (Paramātmā/Īśvara).'
    },
    sutra: {
      textSa: 'ज्ञानाधिकरणमात्मा। तत्रेश्वरः सर्वज्ञः एक एव। जीवात्मा प्रतिशरीरं भिन्नो विभुरनेकश्च।',
      textIast: 'Jñānādhikaraṇam ātmā. Tatreśvaraḥ sarvajñaḥ eka eva. Jīvātmā prati-śarīraṁ bhinno vibhur anekaś ca.',
      translation: 'Self is the receptacle of knowledge. God is omniscient and one; individual selves are infinite and distinct in each body.',
      source: 'Tarkasaṃgraha 2.8'
    },
    eternalStatus: 'Eternal',
    attributes: ['Substrate of Consciousness', 'Possesses Buddhi, Sukha, Duḥkha', 'Eternal & All-pervading'],
    associatedGunas: ['guna-buddhi', 'guna-sukha', 'guna-duhkha', 'guna-iccha', 'guna-dvesa', 'guna-prayatna', 'guna-dharma', 'guna-adharma', 'guna-samskara'],
    tags: ['Dravya', 'Caitanya', 'Consciousness'],
    color: '#F43F5E'
  },
  {
    id: 'dravya-manas',
    category: 'Dravya',
    parentId: 'cat-dravya',
    name: { sa: 'मनः', iast: 'Manaḥ', en: 'Mind (Internal Organ / Atomic Instrument)' },
    description: {
      sa: 'सुखाद्युपलब्धिसाधनमिन्द्रियं मनः। तच्च प्रत्यात्मनियतत्वादनन्तं परमाणुरूपं नित्यञ्च।',
      iast: 'Sukhādy-upalabdhi-sādhanam indriyaṁ manaḥ. Tac ca pratyātma-niyatatvād anantaṁ paramāṇu-rūpaṁ nityañ ca.',
      en: 'Mind is the internal sensory organ required to perceive pleasure, pain, and cognitions. It is atomic (Paramāṇu-rūpa), swift, and eternal.'
    },
    sutra: {
      textSa: 'सुखाद्युपलब्धिसाधनमिन्द्रियं मनः।',
      textIast: 'Sukhādy-upalabdhi-sādhanam indriyaṁ manaḥ.',
      translation: 'Mind is the internal organ for experiencing pleasure and pain.',
      source: 'Tarkasaṃgraha 2.9'
    },
    eternalStatus: 'Eternal',
    attributes: ['Internal Sense Instrument', 'Atomic Size (Anu)', 'Eternal'],
    associatedGunas: ['guna-sankhya', 'guna-parimana', 'guna-prthaktva', 'guna-samyoga', 'guna-vibhaga', 'guna-paratva', 'guna-aparatva', 'guna-samskara'],
    tags: ['Dravya', 'Indriya', 'Atomic Organ'],
    color: '#06B6D4'
  },

  // --- KEY GUṆAS (SELECTED REPRESENTATIVE QUALITIES OUT OF 24) ---
  {
    id: 'guna-gandha',
    category: 'Guna',
    parentId: 'cat-guna',
    name: { sa: 'गन्धः', iast: 'Gandhaḥ', en: 'Smell' },
    description: {
      sa: 'घ्राणग्राह्यो गुणो गन्धः। स च पृथिव्यामेव वर्तते।',
      iast: 'Ghrāṇa-grāhyo guṇo gandhaḥ. Sa ca pṛthivyām eva vartate.',
      en: 'Smell is the quality perceived exclusively by the olfactory organ (nose). It inheres solely in Earth (Pṛthivī).'
    },
    sutra: { textSa: 'घ्राणग्राह्यो गुणो गन्धः।', textIast: 'Ghrāṇa-grāhyo guṇo gandhaḥ.', translation: 'Smell is the quality perceived by smell organ.', source: 'Tarkasaṃgraha 3.3' },
    eternalStatus: 'Both',
    attributes: ['Exclusive to Earth', 'Perceived by Nose', 'Twofold: Surabhi (Fragrant) & Asurabhi (Foul)'],
    associatedDravyas: ['dravya-prthivi'],
    tags: ['Guṇa', 'Viśeṣa-guṇa', 'Sensation'],
    color: '#3B82F6'
  },
  {
    id: 'guna-sneha',
    category: 'Guna',
    parentId: 'cat-guna',
    name: { sa: 'स्नेहः', iast: 'Snehaḥ', en: 'Viscosity / Cohesiveness' },
    description: {
      sa: 'पिण्डीभावहेतुर्गुणः स्नेहः जलमात्रवृत्तिः।',
      iast: 'Piṇḍībhāva-hetur guṇaḥ snehaḥ jalamātra-vṛttiḥ.',
      en: 'Viscosity is the unique quality that causes particles to bind together. It exists exclusively in Water.'
    },
    sutra: { textSa: 'चूर्णादिपिण्डीभावहेतुर्गुणः स्नेहः जलमात्रवृत्तिः।', textIast: 'Cūrṇādi-piṇḍībhāva-hetur guṇaḥ snehaḥ jalamātra-vṛttiḥ.', translation: 'Viscosity causes powder particles to coalesce into lumps; present only in Water.', source: 'Tarkasaṃgraha 3.20' },
    eternalStatus: 'Both',
    attributes: ['Binding Quality', 'Exclusive to Water'],
    associatedDravyas: ['dravya-ap'],
    tags: ['Guṇa', 'Viśeṣa-guṇa'],
    color: '#0284C7'
  },
  {
    id: 'guna-buddhi',
    category: 'Guna',
    parentId: 'cat-guna',
    name: { sa: 'बुद्धिः (ज्ञानम्)', iast: 'Buddhiḥ (Jñānam)', en: 'Intellect / Knowledge' },
    description: {
      sa: 'सर्वव्यवहारहेतुर्ज्ञानं बुद्धिः। सा द्विविधा स्मृतिश्चानुभवश्च।',
      iast: 'Sarva-vyavahāra-hetur jñānaṁ buddhiḥ. Sā dvividhā smṛtiś cānubhavaś ca.',
      en: 'Cognition/Intellect is the quality of the Self that enables all linguistic and behavioral interaction.'
    },
    sutra: { textSa: 'सर्वव्यवहारहेतुज्ञानम्।', textIast: 'Sarva-vyavahāra-hetu-jñānam.', translation: 'Knowledge is the cause of all human experience.', source: 'Tarkasaṃgraha 3.12' },
    eternalStatus: 'Non-Eternal',
    attributes: ['Inheres in Ātman', 'Twofold: Memory (Smṛti) and Experience (Anubhava)'],
    associatedDravyas: ['dravya-atman'],
    tags: ['Guṇa', 'Psychological', 'Cognition'],
    color: '#A855F7'
  },
  {
    id: 'guna-sabda',
    category: 'Guna',
    parentId: 'cat-guna',
    name: { sa: 'शब्दः', iast: 'Śabdaḥ', en: 'Sound' },
    description: {
      sa: 'श्रोत्रग्राह्यो गुणः शब्दः आकाशमात्रवृत्तिः।',
      iast: 'Śrotra-grāhyo guṇo śabdaḥ ākāśamātra-vṛttiḥ.',
      en: 'Sound is perceived by the auditory organ (ear) and inheres exclusively in Ether (Ākāśa).'
    },
    sutra: { textSa: 'श्रोत्रग्राह्यो गुणः शब्दः।', textIast: 'Śrotra-grāhyo guṇo śabdaḥ.', translation: 'Sound is the quality perceived by the ear.', source: 'Tarkasaṃgraha 3.24' },
    eternalStatus: 'Non-Eternal',
    attributes: ['Perceived by Ear', 'Exclusive to Ākāśa'],
    associatedDravyas: ['dravya-akasa'],
    tags: ['Guṇa', 'Viśeṣa-guṇa', 'Sound'],
    color: '#6366F1'
  },

  // --- KARMA EXAMPLES ---
  {
    id: 'karma-utksepana',
    category: 'Karma',
    parentId: 'cat-karma',
    name: { sa: 'उत्क्षेपणम्', iast: 'Utkṣepaṇam', en: 'Upward Motion' },
    description: {
      sa: 'ऊर्ध्वदेशसंयोगहेतुरुत्क्षेपणम्।',
      iast: 'Ūrdhva-deśa-saṁyoga-hetur utkṣepaṇam.',
      en: 'Action causing contact with higher spatial region (e.g. throwing a ball upward).'
    },
    eternalStatus: 'Non-Eternal',
    attributes: ['Upward Direction', 'Causes Saṃyoga with top space'],
    tags: ['Karma', 'Motion'],
    color: '#EF4444'
  },
  {
    id: 'karma-gamana',
    category: 'Karma',
    parentId: 'cat-karma',
    name: { sa: 'गमनम्', iast: 'Gamanam', en: 'General Locomotion / Translation' },
    description: {
      sa: 'अन्यत् सर्वं गमनम्।',
      iast: 'Anyat sarvaṁ gamanam.',
      en: 'All other non-directional or general motions (rotation, walking, flowing, falling).'
    },
    eternalStatus: 'Non-Eternal',
    attributes: ['General Motion', 'Physical Translation'],
    tags: ['Karma', 'Motion'],
    color: '#F97316'
  }
];

export const INITIAL_RELATIONS: EntityRelation[] = [
  // Samavaya (Inherence) relations
  {
    id: 'rel-gandha-prthivi',
    sourceId: 'guna-gandha',
    targetId: 'dravya-prthivi',
    type: 'inheresIn',
    label: { sa: 'समवैति', iast: 'Samavaiti', en: 'Inheres in (Samavāya)' },
    isEternal: false,
    description: { sa: 'गन्धः पृथिव्यां समवायसम्बन्धेन वर्तते।', iast: 'Gandhaḥ pṛthivyāṁ samavāya-sambandhena vartate.', en: 'Smell inheres in Earth via Samavāya relation.' }
  },
  {
    id: 'rel-sneha-ap',
    sourceId: 'guna-sneha',
    targetId: 'dravya-ap',
    type: 'inheresIn',
    label: { sa: 'समवैति', iast: 'Samavaiti', en: 'Inheres in (Samavāya)' },
    isEternal: false,
    description: { sa: 'स्नेहः अप्सु समवायसम्बन्धेन वर्तते।', iast: 'Snehaḥ apsu samavāya-sambandhena vartate.', en: 'Viscosity inheres in Water.' }
  },
  {
    id: 'rel-sabda-akasa',
    sourceId: 'guna-sabda',
    targetId: 'dravya-akasa',
    type: 'inheresIn',
    label: { sa: 'समवैति', iast: 'Samavaiti', en: 'Inheres in (Samavāya)' },
    isEternal: false
  },
  {
    id: 'rel-buddhi-atman',
    sourceId: 'guna-buddhi',
    targetId: 'dravya-atman',
    type: 'inheresIn',
    label: { sa: 'समवैति', iast: 'Samavaiti', en: 'Inheres in (Samavāya)' },
    isEternal: false
  },

  // Taxonomical Subcategory Relations
  { id: 'tax-prthivi', sourceId: 'dravya-prthivi', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-ap', sourceId: 'dravya-ap', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-tejas', sourceId: 'dravya-tejas', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-vayu', sourceId: 'dravya-vayu', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-akasa', sourceId: 'dravya-akasa', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-kala', sourceId: 'dravya-kala', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-dik', sourceId: 'dravya-dik', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-atman', sourceId: 'dravya-atman', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },
  { id: 'tax-manas', sourceId: 'dravya-manas', targetId: 'cat-dravya', type: 'subCategoryOf', label: { sa: 'प्रकारः', iast: 'Prakāraḥ', en: 'Sub-category of' }, isEternal: true },

  // Exclusive Quality Relations
  { id: 'ex-gandha', sourceId: 'guna-gandha', targetId: 'dravya-prthivi', type: 'exclusiveQualityOf', label: { sa: 'असाधारणगुणः', iast: 'Asādhāraṇa-guṇaḥ', en: 'Exclusive Attribute' }, isEternal: true },
  { id: 'ex-sneha', sourceId: 'guna-sneha', targetId: 'dravya-ap', type: 'exclusiveQualityOf', label: { sa: 'असाधारणगुणः', iast: 'Asādhāraṇa-guṇaḥ', en: 'Exclusive Attribute' }, isEternal: true }
];

export const SAMPLE_SPARQL_QUERIES: SPARQLQuery[] = [
  {
    id: 'q1',
    title: 'Find All Eternal Dravyas (Nitya-Dravyāṇi)',
    description: 'Queries all substances that have eternal status (e.g. Ākāśa, Kāla, Dik, Ātman, Manas)',
    query: `PREFIX poms: <http://padartha.org/ontology#>

SELECT ?dravya ?name_en ?name_sa WHERE {
  ?dravya a poms:Dravya ;
          poms:eternalStatus "Eternal" ;
          poms:name_en ?name_en ;
          poms:name_sa ?name_sa .
}`
  },
  {
    id: 'q2',
    title: 'Find Exclusive Qualities (Asādhāraṇa-Guṇas) & Substrates',
    description: 'Finds qualities that reside exclusively in a single substance via Samavāya.',
    query: `PREFIX poms: <http://padartha.org/ontology#>

SELECT ?quality ?substance WHERE {
  ?quality poms:exclusiveQualityOf ?substance .
  ?quality a poms:Guna .
}`
  },
  {
    id: 'q3',
    title: 'Find Physical Elements (Pañca-Mahābhūta)',
    description: 'Selects the 5 gross/subtle physical elements: Earth, Water, Fire, Air, Ether.',
    query: `PREFIX poms: <http://padartha.org/ontology#>

SELECT ?element ?name_iast WHERE {
  ?element poms:tag "Bhūta" ;
           poms:name_iast ?name_iast .
}`
  }
];

export const REAL_WORLD_INSTANCES: RealInstance[] = [
  {
    id: 'inst-pot',
    name: 'Clay Pot (Ghaṭa / घटः)',
    description: 'A traditional earthenware jar produced from clay earth.',
    primaryDravya: 'dravya-prthivi',
    inherentGunas: ['guna-gandha', 'guna-rupa', 'guna-sparsa'],
    possibleKarmas: ['karma-utksepana', 'karma-gamana'],
    isEternal: false,
    causeType: 'Kārya'
  },
  {
    id: 'inst-lightning',
    name: 'Lightning Bolt (Vidyut / विद्युत्)',
    description: 'Atmospheric electrical fire discharge (Divya-tejas).',
    primaryDravya: 'dravya-tejas',
    inherentGunas: ['guna-rupa', 'guna-sparsa'],
    possibleKarmas: ['karma-gamana'],
    isEternal: false,
    causeType: 'Kārya'
  },
  {
    id: 'inst-soul',
    name: 'Individual Consciousness (Jīvātmā / जीवात्मा)',
    description: 'The eternal conscious substrate experiencing thoughts and emotions.',
    primaryDravya: 'dravya-atman',
    inherentGunas: ['guna-buddhi'],
    possibleKarmas: [],
    isEternal: true,
    causeType: 'Nitya'
  }
];

export const DARSHANA_COMPARISONS: DarshanaComparison[] = [
  {
    categoryName: { sa: 'मूलपदार्थाः (संख्या)', iast: 'Mūla-Padārtāḥ (Count)', en: 'Fundamental Categories Count' },
    vaisesika: '7 Padārthas (Dravya, Guṇa, Karma, Sāmānya, Viśeṣa, Samavāya, Abhāva)',
    nyaya: '16 Padārthas (Pramāṇa, Prameya, Saṃśaya, Prayojana, Dṛṣṭānta, Siddhānta, Avayava, Tarka, Nirṇaya, Vāda, Jalpa, Vitaṇḍā, Hetvābhāsa, Chala, Jāti, Nigrahasthāna)',
    sankhya: '25 Tattvas (Prakṛti, Puruṣa, Mahat, Ahaṅkāra, Manas, 5 Jñānendriyas, 5 Karmendriyas, 5 Tanmātras, 5 Mahābhūtas)',
    advaita: '2 Core Reality Levels: Sat (Brahman - Absolute Reality) & Asat/Māyā (Empirical Phenomena)',
    jaina: '7 Tattvas (Jīva, Ajīva, Āsrava, Bandha, Saṁvara, Nirjarā, Mokṣa)'
  },
  {
    categoryName: { sa: 'द्रव्यविचारः', iast: 'Dravya-Vicāraḥ', en: 'Concept of Substance' },
    vaisesika: '9 Distinct Substances (5 Physical + Time, Space, Self, Mind)',
    nyaya: 'Accepts 9 Dravyas identically to Vaiśeṣika',
    sankhya: 'Substances evolved from single unmanifest root (Prakṛti / Guṇa-traya)',
    advaita: 'Brahman alone is ultimate substance (Substratum/Adhiṣṭhāna); others are Vivarta (superimposition)',
    jaina: '6 Dravyas (Jīva, Pudgala/Matter, Dharma, Adharma, Ākāśa, Kāla)'
  },
  {
    categoryName: { sa: 'अभावस्वीकारः', iast: 'Abhāva-Svīkāraḥ', en: 'Status of Non-existence' },
    vaisesika: 'Independent 7th Padārtha (Realist approach)',
    nyaya: 'Independent real category known via Anupalabdhi/Pratyakṣa',
    sankhya: 'Identified with the locus itself (Adhiṣṭhānātmaka)',
    advaita: 'Known via Anupalabdhi Pramāṇa',
    jaina: 'Aspect of Syādvāda (Anekāntavāda)'
  }
];
