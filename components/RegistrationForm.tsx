'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import imageCompression from 'browser-image-compression';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { bloodGroups, houseTypeLabels, relationSuggestions } from '@/lib/config';
import { labels } from '@/lib/labels';
import { registrationSchema, type RegistrationInput } from '@/lib/schema';
import { Spinner } from './Spinner';
import { CompactSelect } from './CompactSelect';

type Props = {
  mode?: 'create' | 'edit';
  householdId?: string;
  initialValues?: RegistrationInput;
  currentPhotoUrl?: string;
  serialNo?: number;
  submittedAt?: string;
};

const emptyMember = {
  name: '', age: '' as const, relation: '', education: '', technicalQualification: '',
  occupation: '', bloodGroup: '', phone: '',
};

const defaults: RegistrationInput = {
  headName: '', houseName: '', headAge: '' as unknown as number, phone: '', houseType: undefined as never,
  hasChronicIllness: undefined as never, chronicDetails: '', receivesAid: undefined as never,
  aidDetails: '', members: [], website: '',
};

function todayInIndia() {
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' }).format(new Date());
}

export function RegistrationForm({
  mode = 'create', householdId, initialValues, currentPhotoUrl, serialNo, submittedAt,
}: Props) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(currentPhotoUrl ?? '');
  const [photoError, setPhotoError] = useState('');
  const [serverError, setServerError] = useState('');
  const [compressing, setCompressing] = useState(false);
  const dateText = useMemo(() => submittedAt
    ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(submittedAt))
    : todayInIndia(), [submittedAt]);

  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: initialValues ?? defaults,
    mode: 'onTouched',
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'members' });
  const hasIllness = useWatch({ control: form.control, name: 'hasChronicIllness' });
  const hasAid = useWatch({ control: form.control, name: 'receivesAid' });

  useEffect(() => () => {
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
  }, [preview]);

  async function choosePhoto(file?: File) {
    setPhotoError('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError(labels.invalidPhoto);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setPhotoError(labels.tooLargePhoto);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.82,
      });
      if (compressed.size > 2 * 1024 * 1024) throw new Error('compressed-too-large');
      const jpeg = new File([compressed], 'owner-photo.jpg', { type: 'image/jpeg' });
      setPhoto(jpeg);
      setPreview(URL.createObjectURL(jpeg));
    } catch {
      setPhotoError(labels.compressedTooLarge);
    } finally {
      setCompressing(false);
    }
  }

  async function submit(values: RegistrationInput) {
    setServerError('');
    if (mode === 'create' && !photo) {
      setPhotoError(labels.photoRequired);
      document.getElementById('owner-photo')?.focus();
      return;
    }
    const body = new FormData();
    body.set('payload', JSON.stringify(values));
    if (photo) body.set('photo', photo);
    const target = mode === 'edit' ? `/api/households/${householdId}` : '/api/submit';
    try {
      const response = await fetch(target, { method: mode === 'edit' ? 'PUT' : 'POST', body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || labels.genericError);
      if (mode === 'edit') {
        router.push(`/data/${householdId}`);
        router.refresh();
      } else {
        router.push(`/thanks?no=${encodeURIComponent(result.serialNo)}`);
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : labels.genericError);
    }
  }

  const inputError = (message?: string) => message ? <p className="field-error" role="alert">{message}</p> : null;

  return (
    <form onSubmit={form.handleSubmit(submit, (errors) => {
      const first = Object.keys(errors)[0];
      if (first) document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    })} className="space-y-5" noValidate>
      <section className="section-card space-y-5">
        <div>
          <h2 className="section-title">{labels.homeDetails}</h2>
          {mode === 'edit' && serialNo && <p className="mt-1 text-sm text-slate-600">രജിസ്ട്രേഷൻ നമ്പർ: {serialNo}</p>}
        </div>
        <div>
          <label className="field-label" htmlFor="date">{labels.date}</label>
          <input id="date" value={dateText} readOnly className="bg-slate-50 text-slate-600" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="headName">{labels.headName} *</label>
            <input id="headName" autoComplete="name" {...form.register('headName')} aria-invalid={!!form.formState.errors.headName} />
            {inputError(form.formState.errors.headName?.message)}
          </div>
          <div>
            <label className="field-label" htmlFor="houseName">{labels.houseName} *</label>
            <input id="houseName" {...form.register('houseName')} aria-invalid={!!form.formState.errors.houseName} />
            {inputError(form.formState.errors.houseName?.message)}
          </div>
          <div>
            <label className="field-label" htmlFor="headAge">{labels.age} *</label>
            <input id="headAge" type="number" inputMode="numeric" min={10} max={120} {...form.register('headAge')} />
            {inputError(form.formState.errors.headAge?.message)}
          </div>
          <div>
            <label className="field-label" htmlFor="phone">{labels.phone} *</label>
            <input id="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" {...form.register('phone')} />
            {inputError(form.formState.errors.phone?.message)}
          </div>
        </div>
        <fieldset>
          <legend className="field-label">{labels.houseType} *</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {Object.entries(houseTypeLabels).map(([value, text]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2">
                <input type="radio" value={value} {...form.register('houseType')} /> {text}
              </label>
            ))}
          </div>
          {inputError(form.formState.errors.houseType?.message)}
        </fieldset>
        <fieldset>
          <legend className="field-label">{labels.illness} *</legend>
          <div className="flex gap-6">
            {(['yes', 'no'] as const).map((value) => <label key={value} className="flex min-h-11 items-center gap-2"><input type="radio" value={value} {...form.register('hasChronicIllness')} />{value === 'yes' ? labels.yes : labels.no}</label>)}
          </div>
          {inputError(form.formState.errors.hasChronicIllness?.message)}
        </fieldset>
        {hasIllness === 'yes' && <div>
          <label className="field-label" htmlFor="chronicDetails">{labels.illnessDetails} *</label>
          <textarea id="chronicDetails" {...form.register('chronicDetails')} />
          {inputError(form.formState.errors.chronicDetails?.message)}
        </div>}
        <fieldset>
          <legend className="field-label">{labels.aid} *</legend>
          <div className="flex gap-6">
            {(['yes', 'no'] as const).map((value) => <label key={value} className="flex min-h-11 items-center gap-2"><input type="radio" value={value} {...form.register('receivesAid')} />{value === 'yes' ? labels.yes : labels.no}</label>)}
          </div>
          {inputError(form.formState.errors.receivesAid?.message)}
        </fieldset>
        {hasAid === 'yes' && <div>
          <label className="field-label" htmlFor="aidDetails">{labels.aidDetails} *</label>
          <textarea id="aidDetails" {...form.register('aidDetails')} />
          {inputError(form.formState.errors.aidDetails?.message)}
        </div>}
      </section>

      <section className="section-card">
        <h2 className="section-title">{labels.photo}</h2>
        <p className="mt-1 text-sm text-slate-600">JPEG, PNG, WebP · പരമാവധി 20 MB</p>
        {preview && <img src={preview} alt="തിരഞ്ഞെടുത്ത ഫോട്ടോ" className="mt-4 aspect-[4/3] w-full max-w-sm rounded-xl border border-slate-200 object-cover" />}
        <label className="secondary-button mt-4 cursor-pointer" htmlFor="owner-photo">
          {compressing ? 'ഫോട്ടോ ചുരുക്കുന്നു…' : preview ? 'ഫോട്ടോ മാറ്റുക' : 'ഫോട്ടോ എടുക്കുക / തിരഞ്ഞെടുക്കുക'}
        </label>
        <input id="owner-photo" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={compressing} onChange={(event) => choosePhoto(event.target.files?.[0])} />
        {inputError(photoError)}
      </section>

      <section className="section-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">{labels.members}</h2>
            <p className="text-sm text-slate-600">കുടുംബനാഥനെ കൂടാതെ പരമാവധി 10 പേർ</p>
          </div>
          {fields.length < 10 && <button type="button" className="secondary-button" onClick={() => append(emptyMember)}>{labels.addMember}</button>}
        </div>
        {fields.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-slate-600">മറ്റ് അംഗങ്ങളില്ലെങ്കിൽ ഈ ഭാഗം ഒഴിവാക്കാം.</p>}
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-emerald-900">അംഗം {index + 1}</h3>
              <button
                type="button"
                className="danger-button icon-button"
                aria-label={labels.remove}
                title={labels.remove}
                onClick={() => remove(index)}
              >
                <Trash2 aria-hidden="true" size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="field-label" htmlFor={`member-${index}-name`}>{labels.name} *</label><input id={`member-${index}-name`} {...form.register(`members.${index}.name`)} />{inputError(form.formState.errors.members?.[index]?.name?.message)}</div>
              <div><label className="field-label">{labels.age}</label><input type="number" inputMode="numeric" min={0} max={120} {...form.register(`members.${index}.age`)} />{inputError(form.formState.errors.members?.[index]?.age?.message)}</div>
              <div><label className="field-label">{labels.relation}</label><input list="relations" {...form.register(`members.${index}.relation`)} /></div>
              <div><label className="field-label">{labels.education}</label><input {...form.register(`members.${index}.education`)} /></div>
              <div><label className="field-label">{labels.technical}</label><input {...form.register(`members.${index}.technicalQualification`)} /></div>
              <div><label className="field-label">{labels.occupation}</label><input {...form.register(`members.${index}.occupation`)} /></div>
              <div>
                <label className="field-label" htmlFor={`member-${index}-blood`}>{labels.bloodGroup}</label>
                <Controller
                  control={form.control}
                  name={`members.${index}.bloodGroup`}
                  render={({ field }) => (
                    <CompactSelect
                      id={`member-${index}-blood`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="തിരഞ്ഞെടുക്കുക"
                      options={[
                        { value: '', label: 'തിരഞ്ഞെടുക്കുക' },
                        ...bloodGroups.map((group) => ({ value: group, label: group })),
                      ]}
                    />
                  )}
                />
              </div>
              <div><label className="field-label">{labels.phone}</label><input type="tel" inputMode="numeric" maxLength={10} {...form.register(`members.${index}.phone`)} />{inputError(form.formState.errors.members?.[index]?.phone?.message)}</div>
            </div>
          </div>
        ))}
        <datalist id="relations">{relationSuggestions.map((relation) => <option key={relation} value={relation} />)}</datalist>
      </section>

      {serverError && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800" role="alert">{serverError}</p>}
      <button className="primary-button w-full text-lg" type="submit" disabled={form.formState.isSubmitting || compressing}>
        {form.formState.isSubmitting && <Spinner />}{form.formState.isSubmitting ? labels.loading : mode === 'edit' ? labels.save : labels.submit}
      </button>
    </form>
  );
}
