-- Bucket لصور التصاميم المؤقتة (تصميم قطعة → Replicate)
insert into storage.buckets (id, name, public)
values ('designs', 'designs', true)
on conflict (id) do nothing;

-- القراءة عامة (لإرجاع رابط الصورة لـ Replicate)
create policy "Public read designs"
  on storage.objects for select
  using ( bucket_id = 'designs' );

-- الرفع من الخادم فقط (عبر Service Role). المستخدمون لا يرفعون مباشرة لهذا الـ bucket.
-- إن رغبت بسماح للمصادقين بالرفع يمكن إضافة سياسة insert لاحقاً.
