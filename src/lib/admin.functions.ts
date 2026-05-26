import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const ROLES = [
  "admin_general",
  "admin_rh",
  "admin_patrimoine",
  "admin_stock",
  "admin_archives",
] as const;

const CreateInput = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  full_name: z.string().min(1).max(120),
  roles: z.array(z.enum(ROLES)).min(1).max(5),
});

const SetRolesInput = z.object({
  user_id: z.string().uuid(),
  roles: z.array(z.enum(ROLES)),
});

const DeleteInput = z.object({ user_id: z.string().uuid() });

async function assertAdminGeneral(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin_general")
    .maybeSingle();
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminGeneral(context.supabase, context.userId);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Création échouée");
    // Replace any auto-assigned roles with the chosen set
    await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
    if (data.roles.length) {
      await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((r) => ({ user_id: created.user!.id, role: r })));
    }
    return { id: created.user.id };
  });

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetRolesInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminGeneral(context.supabase, context.userId);

    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id);
    if (deleteError) throw new Error(deleteError.message);

    if (data.roles.length) {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((r) => ({ user_id: data.user_id, role: r })));
      if (insertError) throw new Error(insertError.message);
    }
    return { ok: true };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdminGeneral(context.supabase, context.userId);
    if (data.user_id === context.userId)
      throw new Error("Vous ne pouvez pas supprimer votre propre compte");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
