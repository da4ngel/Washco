import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { asyncHandler } from '../utils/helpers';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { Service } from '../types';

/** Returns the tenant owned by the user, or throws. */
async function ownedTenantId(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('tenants')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle<{ id: string }>();
  if (!data) throw new NotFoundError('No business found for this account.');
  return data.id;
}

/** Ensures the service belongs to the user's tenant. */
async function assertOwnsService(serviceId: string, tenantId: string): Promise<Service> {
  const { data } = await supabaseAdmin.from('services').select('*').eq('id', serviceId).single<Service>();
  if (!data) throw new NotFoundError('Service not found.');
  if (data.tenant_id !== tenantId) throw new ForbiddenError();
  return data;
}

/** POST /api/services */
export const createService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);

  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({ ...req.body, tenant_id: tenantId })
    .select('*')
    .single<Service>();
  if (error) throw new BadRequestError(error.message);
  res.status(201).json({ service: data });
});

/** PUT /api/services/:id */
export const updateService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  await assertOwnsService(req.params.id, tenantId);

  const { data, error } = await supabaseAdmin
    .from('services')
    .update(req.body)
    .eq('id', req.params.id)
    .select('*')
    .single<Service>();
  if (error) throw new BadRequestError(error.message);
  res.json({ service: data });
});

/** DELETE /api/services/:id — soft delete (is_active = false). */
export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  await assertOwnsService(req.params.id, tenantId);

  const { error } = await supabaseAdmin
    .from('services')
    .update({ is_active: false })
    .eq('id', req.params.id);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Service removed.' });
});

/** PUT /api/services/:id/reorder */
export const reorderService = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new UnauthorizedError();
  const tenantId = await ownedTenantId(req.user.id);
  await assertOwnsService(req.params.id, tenantId);

  const { sort_order } = req.body as { sort_order: number };
  const { error } = await supabaseAdmin.from('services').update({ sort_order }).eq('id', req.params.id);
  if (error) throw new BadRequestError(error.message);
  res.json({ message: 'Order updated.' });
});
