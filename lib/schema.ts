import { z } from 'zod';
import { bloodGroups } from './config';

const required = 'ഈ വിവരം നിർബന്ധമാണ്';
const phone = z.string().regex(/^[6-9]\d{9}$/, 'സാധുവായ 10 അക്ക ഇന്ത്യൻ മൊബൈൽ നമ്പർ നൽകുക');
const optionalPhone = z.string().refine((value) => value === '' || /^[6-9]\d{9}$/.test(value), {
  message: 'സാധുവായ 10 അക്ക ഇന്ത്യൻ മൊബൈൽ നമ്പർ നൽകുക',
});

export const memberSchema = z.object({
  name: z.string().trim().min(1, required).max(120),
  age: z.union([z.literal(''), z.coerce.number().int().min(0).max(120)]),
  relation: z.string().trim().max(120),
  education: z.string().trim().max(200),
  technicalQualification: z.string().trim().max(200),
  occupation: z.string().trim().max(200),
  bloodGroup: z.string().max(20),
  phone: optionalPhone,
});

export const registrationSchema = z.object({
  headName: z.string().trim().min(1, required).max(120),
  houseName: z.string().trim().min(1, required).max(120),
  headAge: z.coerce.number().int().min(10, 'വയസ്സ് 10 മുതൽ 120 വരെ നൽകുക').max(120, 'വയസ്സ് 10 മുതൽ 120 വരെ നൽകുക'),
  phone,
  houseType: z.enum(['sheet', 'ode', 'warp'], { message: required }),
  hasChronicIllness: z.enum(['yes', 'no'], { message: required }),
  chronicDetails: z.string().trim().max(1000),
  receivesAid: z.enum(['yes', 'no'], { message: required }),
  aidDetails: z.string().trim().max(1000),
  members: z.array(memberSchema).max(10, 'പരമാവധി 10 അംഗങ്ങളെ മാത്രം ചേർക്കാം'),
  website: z.string().max(200).optional().default(''),
}).superRefine((value, context) => {
  if (value.hasChronicIllness === 'yes' && !value.chronicDetails) {
    context.addIssue({ code: 'custom', path: ['chronicDetails'], message: required });
  }
  if (value.receivesAid === 'yes' && !value.aidDetails) {
    context.addIssue({ code: 'custom', path: ['aidDetails'], message: required });
  }
});

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.output<typeof registrationSchema>;

export const filterSchema = z.object({
  q: z.string().trim().max(100).catch(''),
  house_type: z.enum(['sheet', 'ode', 'warp']).optional().catch(undefined),
  illness: z.enum(['yes', 'no']).optional().catch(undefined),
  aid: z.enum(['yes', 'no']).optional().catch(undefined),
  blood: z.enum(bloodGroups).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  sort: z.enum(['new', 'old', 'name']).default('new').catch('new'),
  page: z.coerce.number().int().positive().default(1).catch(1),
});

export type Filters = z.output<typeof filterSchema>;
