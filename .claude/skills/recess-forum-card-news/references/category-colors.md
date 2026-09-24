# Topic badge colors

Recess Forum colors each topic badge by the **category** it belongs to (not
the topic itself). This is a snapshot of `CATEGORY_COLORS` in
`lib/taxonomy.ts` — if it's been a while, diff against that file, since it's
the real source of truth and the app doesn't read this file.

| categoryId | category label | text | bg | solid |
|---|---|---|---|---|
| school-types | School Types | `#3B5BA5` | `#E9EEF7` | `#3B5BA5` |
| grade-stages | Grade & Age Stages | `#3F7A52` | `#E9F2EC` | `#3F7A52` |
| college-prep | College Prep & Admissions | `#9C3B4A` | `#F5E4E7` | `#9C3B4A` |
| academics | Academics & Curriculum | `#A8791E` | `#F6EFDD` | `#A8791E` |
| support-needs | Support Needs | `#8C4F86` | `#F3E9F2` | `#8C4F86` |
| special-education | Special Education | `#3D6E8C` | `#E5EEF2` | `#3D6E8C` |
| homeschooling | Homeschooling | `#6E7F3F` | `#EEF1E2` | `#6E7F3F` |
| enrichment | Enrichment | `#217A78` | `#E4F2F1` | `#217A78` |
| wellbeing | Wellbeing & Social | `#B85A3A` | `#F7E9E2` | `#B85A3A` |
| fun | Fun & Family Time | `#C15B7A` | `#F7E6EC` | `#C15B7A` |
| logistics | Logistics & Parent Life | `#5C5AA0` | `#ECEBF6` | `#5C5AA0` |

Fallback (unknown/uncategorized): text `#26364A`, bg `#EFEDE6`, solid `#26364A`.

## Mapping a topic to its category

A post's `topicId` (e.g. `bullying`) isn't itself in this table — it belongs
to a category (e.g. `bullying` → `wellbeing`). The full topic → category
list lives in `CATEGORIES` in `lib/taxonomy.ts`; a few common ones parents
actually post about:

- `bullying` → `wellbeing`
- `mental-health` → `wellbeing`
- `special-ed`, `regional-center` → `special-education`
- `learning-differences`, `gifted`, `ell` → `support-needs`
- `homeschool` → `homeschooling`
- `public-school`, `private-school`, `charter-school`, `online-school` → `school-types`

If a topic isn't listed above, open `lib/taxonomy.ts` and find which
`CATEGORIES[].topics[]` entry it's nested under.
