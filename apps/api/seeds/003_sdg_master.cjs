/**
 * Official UN Sustainable Development Goals — global master data.
 * Idempotent: never duplicates SDGs. Does not fabricate PSOs.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  if (!(await knex.schema.hasTable('sustainable_development_goals'))) return;

  const sdgs = [
    {
      sdg_number: 1,
      sdg_code: 'SDG1',
      official_title: 'No Poverty',
      official_description:
        'End poverty in all its forms everywhere.',
      icon_key: 'sdg-01',
      color_hex: '#E5243B',
    },
    {
      sdg_number: 2,
      sdg_code: 'SDG2',
      official_title: 'Zero Hunger',
      official_description: 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture.',
      icon_key: 'sdg-02',
      color_hex: '#DDA63A',
    },
    {
      sdg_number: 3,
      sdg_code: 'SDG3',
      official_title: 'Good Health and Well-being',
      official_description: 'Ensure healthy lives and promote well-being for all at all ages.',
      icon_key: 'sdg-03',
      color_hex: '#4C9F38',
    },
    {
      sdg_number: 4,
      sdg_code: 'SDG4',
      official_title: 'Quality Education',
      official_description:
        'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.',
      icon_key: 'sdg-04',
      color_hex: '#C5192D',
    },
    {
      sdg_number: 5,
      sdg_code: 'SDG5',
      official_title: 'Gender Equality',
      official_description: 'Achieve gender equality and empower all women and girls.',
      icon_key: 'sdg-05',
      color_hex: '#FF3A21',
    },
    {
      sdg_number: 6,
      sdg_code: 'SDG6',
      official_title: 'Clean Water and Sanitation',
      official_description: 'Ensure availability and sustainable management of water and sanitation for all.',
      icon_key: 'sdg-06',
      color_hex: '#26BDE2',
    },
    {
      sdg_number: 7,
      sdg_code: 'SDG7',
      official_title: 'Affordable and Clean Energy',
      official_description: 'Ensure access to affordable, reliable, sustainable and modern energy for all.',
      icon_key: 'sdg-07',
      color_hex: '#FCC30B',
    },
    {
      sdg_number: 8,
      sdg_code: 'SDG8',
      official_title: 'Decent Work and Economic Growth',
      official_description:
        'Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.',
      icon_key: 'sdg-08',
      color_hex: '#A21942',
    },
    {
      sdg_number: 9,
      sdg_code: 'SDG9',
      official_title: 'Industry, Innovation and Infrastructure',
      official_description:
        'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.',
      icon_key: 'sdg-09',
      color_hex: '#FD6925',
    },
    {
      sdg_number: 10,
      sdg_code: 'SDG10',
      official_title: 'Reduced Inequalities',
      official_description: 'Reduce inequality within and among countries.',
      icon_key: 'sdg-10',
      color_hex: '#DD1367',
    },
    {
      sdg_number: 11,
      sdg_code: 'SDG11',
      official_title: 'Sustainable Cities and Communities',
      official_description: 'Make cities and human settlements inclusive, safe, resilient and sustainable.',
      icon_key: 'sdg-11',
      color_hex: '#FD9D24',
    },
    {
      sdg_number: 12,
      sdg_code: 'SDG12',
      official_title: 'Responsible Consumption and Production',
      official_description: 'Ensure sustainable consumption and production patterns.',
      icon_key: 'sdg-12',
      color_hex: '#BF8B2E',
    },
    {
      sdg_number: 13,
      sdg_code: 'SDG13',
      official_title: 'Climate Action',
      official_description: 'Take urgent action to combat climate change and its impacts.',
      icon_key: 'sdg-13',
      color_hex: '#3F7E44',
    },
    {
      sdg_number: 14,
      sdg_code: 'SDG14',
      official_title: 'Life Below Water',
      official_description:
        'Conserve and sustainably use the oceans, seas and marine resources for sustainable development.',
      icon_key: 'sdg-14',
      color_hex: '#0A97D9',
    },
    {
      sdg_number: 15,
      sdg_code: 'SDG15',
      official_title: 'Life on Land',
      official_description:
        'Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss.',
      icon_key: 'sdg-15',
      color_hex: '#56C02B',
    },
    {
      sdg_number: 16,
      sdg_code: 'SDG16',
      official_title: 'Peace, Justice and Strong Institutions',
      official_description:
        'Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels.',
      icon_key: 'sdg-16',
      color_hex: '#00689D',
    },
    {
      sdg_number: 17,
      sdg_code: 'SDG17',
      official_title: 'Partnerships for the Goals',
      official_description:
        'Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development.',
      icon_key: 'sdg-17',
      color_hex: '#19486A',
    },
  ];

  for (const sdg of sdgs) {
    const existing = await knex('sustainable_development_goals').where({ sdg_number: sdg.sdg_number }).first();
    const payload = {
      ...sdg,
      source: 'United Nations Sustainable Development Goals',
      source_url: 'https://sdgs.un.org/goals',
      active: true,
      updated_at: knex.fn.now(),
    };
    if (existing) {
      await knex('sustainable_development_goals').where({ id: existing.id }).update(payload);
    } else {
      await knex('sustainable_development_goals').insert(payload);
    }
  }
};
