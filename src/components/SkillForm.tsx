import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, DURATIONS, FORMATS } from "@/lib/skillswap";

export type SkillFormValues = {
  title: string;
  category: string;
  description: string;
  what_youll_learn: string;
  experience: string;
  session_duration: number;
  format: string;
  availability: string;
  price: number;
};

export const EMPTY_SKILL: SkillFormValues = {
  title: "",
  category: "",
  description: "",
  what_youll_learn: "",
  experience: "",
  session_duration: 60,
  format: "Online",
  availability: "",
  price: 0,
};

type Errors = Partial<Record<keyof SkillFormValues, string>>;

export function SkillForm({
  initialValues,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initialValues: SkillFormValues;
  submitLabel: string;
  pending: boolean;
  onSubmit: (values: SkillFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<SkillFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  function update<K extends keyof SkillFormValues>(key: K, value: SkillFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Errors = {};
    if (values.title.trim().length < 4) next.title = "Give your skill a clear title (4+ characters).";
    if (!values.category) next.category = "Pick a category.";
    if (values.description.trim().length < 30)
      next.description = "Describe your session in at least 30 characters.";
    if (values.price < 0) next.price = "Price cannot be negative.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
      what_youll_learn: values.what_youll_learn.trim(),
      experience: values.experience.trim(),
      availability: values.availability.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="card-surface space-y-6 p-6 sm:p-8">
      <Field label="Skill title" htmlFor="title" error={errors.title} required>
        <Input
          id="title"
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          placeholder="e.g. Case Interview Preparation"
          className="rounded-xl"
        />
      </Field>

      <Field label="Category" htmlFor="category" error={errors.category} required>
        <Select value={values.category} onValueChange={(value) => update("category", value)}>
          <SelectTrigger id="category" className="w-full rounded-xl">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description} required>
        <Textarea
          id="description"
          rows={5}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
          placeholder="What is this session about and who is it for?"
          className="rounded-xl"
        />
      </Field>

      <Field label="What you'll teach" htmlFor="learn">
        <Textarea
          id="learn"
          rows={3}
          value={values.what_youll_learn}
          onChange={(event) => update("what_youll_learn", event.target.value)}
          placeholder="Market sizing, profitability cases, structuring and interview communication."
          className="rounded-xl"
        />
      </Field>

      <Field label="Your experience" htmlFor="experience">
        <Textarea
          id="experience"
          rows={3}
          value={values.experience}
          onChange={(event) => update("experience", event.target.value)}
          placeholder="Participated in 12+ consulting case interviews and helped juniors prepare for placements."
          className="rounded-xl"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Session duration" htmlFor="duration">
          <Select
            value={String(values.session_duration)}
            onValueChange={(value) => update("session_duration", Number(value))}
          >
            <SelectTrigger id="duration" className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((duration) => (
                <SelectItem key={duration} value={String(duration)}>
                  {duration} minutes
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Format" htmlFor="format">
          <Select value={values.format} onValueChange={(value) => update("format", value)}>
            <SelectTrigger id="format" className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Availability" htmlFor="availability">
        <Input
          id="availability"
          value={values.availability}
          onChange={(event) => update("availability", event.target.value)}
          placeholder="Weekdays after 6 PM"
          className="rounded-xl"
        />
      </Field>

      <Field
        label="Price"
        htmlFor="price"
        error={errors.price}
        hint="Leave at 0 for a free peer exchange."
      >
        <Input
          id="price"
          type="number"
          min={0}
          value={values.price}
          onChange={(event) => update("price", Number(event.target.value))}
          className="rounded-xl"
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" className="rounded-xl" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
