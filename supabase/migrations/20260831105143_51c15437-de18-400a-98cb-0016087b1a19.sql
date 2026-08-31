CREATE TABLE public.peer_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile','offering')),
  target_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rater_id, target_type, target_id)
);

CREATE INDEX peer_ratings_target_idx ON public.peer_ratings (target_type, target_id);

GRANT SELECT ON public.peer_ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.peer_ratings TO authenticated;
GRANT ALL ON public.peer_ratings TO service_role;

ALTER TABLE public.peer_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Peer ratings are readable by everyone"
  ON public.peer_ratings FOR SELECT USING (true);

CREATE POLICY "Users can create their own peer ratings"
  ON public.peer_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can update their own peer ratings"
  ON public.peer_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = rater_id) WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "Users can delete their own peer ratings"
  ON public.peer_ratings FOR DELETE TO authenticated
  USING (auth.uid() = rater_id);

CREATE OR REPLACE FUNCTION public.validate_peer_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.target_type = 'profile' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = NEW.target_id) THEN
      RAISE EXCEPTION 'That student profile no longer exists';
    END IF;
    IF NEW.target_id = NEW.rater_id THEN
      RAISE EXCEPTION 'You cannot rate your own profile';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.skill_offerings o WHERE o.id = NEW.target_id) THEN
      RAISE EXCEPTION 'That skill offering no longer exists';
    END IF;
    IF EXISTS (SELECT 1 FROM public.skill_offerings o WHERE o.id = NEW.target_id AND o.provider_id = NEW.rater_id) THEN
      RAISE EXCEPTION 'You cannot rate your own skill offering';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_peer_rating() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER peer_ratings_validate
BEFORE INSERT OR UPDATE ON public.peer_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_peer_rating();