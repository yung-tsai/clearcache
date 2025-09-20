-- Fix INSERT policy to include WITH CHECK condition
DROP POLICY IF EXISTS "Users can create their own entries" ON public.entries;

CREATE POLICY "Users can create their own entries" 
ON public.entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);