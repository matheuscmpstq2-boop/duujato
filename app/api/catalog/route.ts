import { db, fail } from '@/lib/booking';
export async function GET(){try{const result=await db().prepare('SELECT id,name,description,duration,price_cents FROM services WHERE active = 1 ORDER BY sort,name').all();return Response.json(result.results)}catch{ return fail('Não foi possível carregar os serviços.',503) }}
