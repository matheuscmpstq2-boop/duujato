import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=readFileSync(new URL('../app/api/admin/services/route.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function route(){const writes=[];const db=()=>({prepare:()=>({bind:(...values)=>({run:async()=>{writes.push(values)}})})});const module={exports:{}};vm.runInNewContext(code,{module,exports:module.exports,require:name=>name==='@/lib/booking'?{owner:async()=>true,db,fail:(message,status=400)=>Response.json({error:message},{status})}:undefined,Response,crypto:globalThis.crypto});return {api:module.exports,writes}}
const request=duration=>({json:async()=>({name:'Lavagem',description:'',duration,price_cents:4500,active:true})});

test('owner can set any whole-minute service duration within one day',async()=>{const {api,writes}=route();for(const duration of [1,45,75,1440])assert.equal((await api.POST(request(duration))).status,201);assert.deepEqual(writes.map(row=>row[3]),[1,45,75,1440])});
test('invalid service durations are rejected before database writes',async()=>{const {api,writes}=route();for(const duration of [0,1.5,-1,1441,null,'abc'])assert.equal((await api.POST(request(duration))).status,400);assert.equal(writes.length,0)});
