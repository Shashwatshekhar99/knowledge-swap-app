CREATE TABLE public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 240),
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (provider_id, weekday, start_time)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;
GRANT SELECT ON public.availability_slots TO anon;
GRANT ALL ON public.availability_slots TO service_role;

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open availability is readable by everyone"
  ON public.availability_slots FOR SELECT
  USING (is_open OR auth.uid() = provider_id);

CREATE POLICY "Users can create their own availability"
  ON public.availability_slots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update their own availability"
  ON public.availability_slots FOR UPDATE TO authenticated
  USING (auth.uid() = provider_id) WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can delete their own availability"
  ON public.availability_slots FOR DELETE TO authenticated
  USING (auth.uid() = provider_id);

CREATE INDEX availability_slots_provider_idx ON public.availability_slots (provider_id);
CREATE INDEX availability_slots_weekday_idx ON public.availability_slots (weekday, start_time);

CREATE TRIGGER availability_slots_updated_at
  BEFORE UPDATE ON public.availability_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.availability_slots (provider_id, weekday, start_time, duration_minutes)
SELECT o.provider_id, w.weekday, w.start_time, 60
FROM (SELECT DISTINCT provider_id FROM public.skill_offerings WHERE is_active) o
CROSS JOIN (VALUES (2, '5:00 PM'), (4, '11:00 AM'), (6, '10:00 AM')) AS w(weekday, start_time)
ON CONFLICT DO NOTHING;