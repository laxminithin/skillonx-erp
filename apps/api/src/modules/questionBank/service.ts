import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { QUESTION_TYPES } from '../../types/domain.js';

export const bankItemSchema = z.object({
  questionType: z.enum(QUESTION_TYPES),
  prompt: z.string().min(1),
  helpText: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  config: z.record(z.unknown()).optional().nullable(),
  options: z
    .array(z.object({ label: z.string(), value: z.number().optional().nullable() }))
    .optional()
    .nullable(),
  tags: z.array(z.string()).default([]),
});

export async function listBankItems(collegeId: number, tag?: string, q?: string) {
  let query = db('question_bank_items as qbi')
    .where({ 'qbi.college_id': collegeId, 'qbi.is_active': true })
    .select('qbi.*')
    .orderBy('qbi.created_at', 'desc');

  if (q) {
    query = query.andWhere('qbi.prompt', 'like', `%${q}%`);
  }
  if (tag) {
    query = query
      .join('question_bank_tags as t', 't.question_bank_item_id', 'qbi.id')
      .andWhere('t.tag', tag);
  }

  const items = await query;
  const ids = items.map((i) => i.id);
  const tags = ids.length
    ? await db('question_bank_tags').whereIn('question_bank_item_id', ids)
    : [];
  const tagsByItem = new Map<number, string[]>();
  for (const t of tags) {
    const list = tagsByItem.get(t.question_bank_item_id) ?? [];
    list.push(t.tag);
    tagsByItem.set(t.question_bank_item_id, list);
  }

  return items.map((item) => ({
    id: item.id,
    questionType: item.question_type,
    prompt: item.prompt,
    helpText: item.help_text,
    category: item.category,
    config: typeof item.config === 'string' ? JSON.parse(item.config) : item.config,
    options: typeof item.options === 'string' ? JSON.parse(item.options) : item.options,
    tags: tagsByItem.get(item.id) ?? [],
    createdAt: item.created_at,
  }));
}

export async function createBankItem(
  collegeId: number,
  createdBy: number,
  input: z.output<typeof bankItemSchema>,
) {
  const [id] = await db('question_bank_items').insert({
    college_id: collegeId,
    created_by: createdBy,
    question_type: input.questionType,
    prompt: input.prompt,
    help_text: input.helpText ?? null,
    category: input.category ?? null,
    config: JSON.stringify(input.config ?? {}),
    options: input.options ? JSON.stringify(input.options) : null,
  });

  for (const tag of input.tags ?? []) {
    await db('question_bank_tags').insert({ question_bank_item_id: id, tag });
  }

  const list = await listBankItems(collegeId);
  return list.find((i) => i.id === id);
}

export async function updateBankItem(
  collegeId: number,
  id: number,
  input: Partial<z.infer<typeof bankItemSchema>>,
) {
  const item = await db('question_bank_items').where({ id, college_id: collegeId }).first();
  if (!item) throw new AppError(404, 'Question bank item not found');

  await db('question_bank_items')
    .where({ id })
    .update({
      question_type: input.questionType ?? item.question_type,
      prompt: input.prompt ?? item.prompt,
      help_text: input.helpText !== undefined ? input.helpText : item.help_text,
      category: input.category !== undefined ? input.category : item.category,
      config: input.config !== undefined ? JSON.stringify(input.config) : item.config,
      options: input.options !== undefined ? JSON.stringify(input.options) : item.options,
    });

  if (input.tags) {
    await db('question_bank_tags').where({ question_bank_item_id: id }).del();
    for (const tag of input.tags) {
      await db('question_bank_tags').insert({ question_bank_item_id: id, tag });
    }
  }

  const list = await listBankItems(collegeId);
  return list.find((i) => i.id === id);
}

export async function deleteBankItem(collegeId: number, id: number) {
  const item = await db('question_bank_items').where({ id, college_id: collegeId }).first();
  if (!item) throw new AppError(404, 'Question bank item not found');
  await db('question_bank_items').where({ id }).update({ is_active: false });
  return { ok: true };
}
