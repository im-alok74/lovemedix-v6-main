-- 025 — Populate medicine_health_conditions.
--
-- Migration 024 created the health-condition taxonomy but left the join table empty, so
-- every /health-conditions/<slug> page rendered "no medicines tagged yet".
--
-- This does a first-pass automatic tagging by matching category, salt composition and
-- generic name against per-condition keyword sets. It is deliberately conservative:
-- matching is on word boundaries, and a medicine may map to several conditions.
--
-- This is a starting point, not a clinical classification. An admin should be able to
-- correct it, and nothing here should be treated as medical categorisation.
--
-- Idempotent: ON CONFLICT DO NOTHING, so re-running adds only new matches.

BEGIN;

-- Keyword sets per condition slug. `\y` is a Postgres word boundary, so "ace" cannot
-- match inside "paracetamol".
WITH condition_keywords(slug, pattern) AS (
  VALUES
    ('diabetes-care',    '\y(metformin|glimepiride|insulin|gliclazide|sitagliptin|vildagliptin|glucose|diabet|glucometer|dapagliflozin|empagliflozin|pioglitazone)\y'),
    ('heart-care',       '\y(atorvastatin|rosuvastatin|amlodipine|telmisartan|losartan|metoprolol|ramipril|clopidogrel|aspirin|statin|cardiac|hypertension|blood pressure|enalapril|bisoprolol)\y'),
    ('stomach-care',     '\y(omeprazole|pantoprazole|rabeprazole|esomeprazole|ranitidine|domperidone|ondansetron|antacid|acidity|laxative|lactulose|constipat|digest|probiotic|gastro)\y'),
    ('pain-relief',      '\y(paracetamol|acetaminophen|ibuprofen|diclofenac|aceclofenac|naproxen|tramadol|analgesic|nimesulide|ketorolac|balm|pain)\y'),
    ('cold-immunity',    '\y(cetirizine|levocetirizine|montelukast|phenylephrine|chlorpheniramine|cough|cold|fever|vitamin c|zinc|immunity|ambroxol|guaifenesin|antihistamin)\y'),
    ('liver-care',       '\y(silymarin|ursodeoxycholic|liver|hepat|udiliv|essentiale)\y'),
    ('respiratory-care', '\y(salbutamol|levosalbutamol|budesonide|formoterol|ipratropium|inhaler|asthma|respirat|nebuli|doxofylline|theophylline)\y'),
    ('skin-care',        '\y(clotrimazole|ketoconazole|terbinafine|mometasone|betamethasone|hydrocortisone|calamine|moisturi|derma|skin|acne|fungal|eczema)\y'),
    ('bone-joint-care',  '\y(calcium|glucosamine|alendronate|arthrit|joint|bone|osteo|collagen|chondroitin)\y'),
    ('kidney-care',      '\y(renal|kidney|nephro|potassium citrate|electrolyte|dialys)\y'),
    ('eye-care',         '\y(eye drop|ophthalmic|moxifloxacin eye|carboxymethylcellulose|lubricant eye|conjunctiv|vision)\y'),
    ('womens-health',    '\y(folic acid|prenatal|iron folic|menstrual|contracept|estrogen|progesterone|pregnan|lactation|women)\y'),
    ('baby-care',        '\y(baby|infant|paediatric|pediatric|diaper|colic|gripe water|nappy)\y'),
    ('elderly-care',     '\y(geriatric|elderly|memory|donepezil|adult diaper|walking stick|mobility)\y'),
    ('sexual-wellness',  '\y(condom|sildenafil|tadalafil|contraceptive|lubricant|sexual|fertility)\y'),
    ('mental-wellness',  '\y(sertraline|escitalopram|fluoxetine|alprazolam|clonazepam|melatonin|sleep|anxiet|depress|zolpidem|stress)\y')
)
INSERT INTO medicine_health_conditions (medicine_id, condition_id)
SELECT DISTINCT m.id, hc.id
FROM medicines m
JOIN condition_keywords ck
  ON  LOWER(COALESCE(m.name, '') || ' ' ||
            COALESCE(m.generic_name, '') || ' ' ||
            COALESCE(m.salt_composition, '') || ' ' ||
            COALESCE(m.category, '')) ~ ck.pattern
JOIN health_conditions hc ON hc.slug = ck.slug
WHERE m.status = 'active'
ON CONFLICT (medicine_id, condition_id) DO NOTHING;

COMMIT;

-- How many medicines ended up under each concern.
SELECT hc.name, COUNT(mhc.medicine_id)::int AS tagged
FROM health_conditions hc
LEFT JOIN medicine_health_conditions mhc ON mhc.condition_id = hc.id
GROUP BY hc.name
ORDER BY tagged DESC;
