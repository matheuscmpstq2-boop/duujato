import postgres from 'postgres';

let client:ReturnType<typeof postgres>|undefined;
function connection(){
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL não configurada');
  client??=postgres(process.env.DATABASE_URL,{max:5,prepare:false,connect_timeout:10});
  return client;
}
function convert(query:string){let index=0;let converted=query.replace(/\?/g,()=>`$${++index}`);if(/^INSERT OR IGNORE INTO /i.test(converted))converted=converted.replace(/^INSERT OR IGNORE INTO /i,'INSERT INTO ')+' ON CONFLICT DO NOTHING';return converted}
class Statement{
  constructor(readonly query:string,readonly args:unknown[]=[]){ }
  bind(...values:unknown[]){return new Statement(this.query,values)}
  execute(sql:ReturnType<typeof postgres>){return sql.unsafe(convert(this.query),this.args as never[])}
  async first<T>(){const rows=await this.execute(connection());return (rows[0] as T|undefined)??null}
  async all<T>(){const rows=await this.execute(connection());return {results:rows as unknown as T[]}}
  async run(){const rows=await this.execute(connection());return {meta:{changes:rows.count??0},success:true}}
}
export function db(){return {prepare:(query:string)=>new Statement(query),batch:(statements:Statement[])=>connection().begin(async tx=>{const output=[];for(const statement of statements)output.push(await statement.execute(tx as never));return output})}}
