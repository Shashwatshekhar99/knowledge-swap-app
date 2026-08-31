CREATE TABLE public.session_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.session_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX session_messages_request_id_created_at_idx ON public.session_messages (request_id, created_at);

GRANT SELECT, INSERT ON public.session_messages TO authenticated;
GRANT ALL ON public.session_messages TO service_role;

ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read session messages"
ON public.session_messages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.session_requests r
  WHERE r.id = session_messages.request_id
    AND (auth.uid() = r.requester_id OR auth.uid() = r.provider_id)
));

CREATE POLICY "Participants can send session messages"
ON public.session_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.session_requests r
    WHERE r.id = session_messages.request_id
      AND r.status IN ('accepted','completed')
      AND (auth.uid() = r.requester_id OR auth.uid() = r.provider_id)
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.session_messages;