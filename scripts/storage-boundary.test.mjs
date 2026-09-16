import {build} from 'esbuild';
import assert from 'node:assert/strict';
globalThis.__storageTest={identity:null,allowed:false,signed:0,context:null};
const mocks={
 '@/lib/auth/server':`export async function requireCurrentIdentity(){if(!globalThis.__storageTest.identity) throw Error('Not authenticated');return globalThis.__storageTest.identity}`,
 '@/lib/db/pool':`export async function withRequestContext(context,fn){globalThis.__storageTest.context=context;return fn({query:async(sql,args)=>{globalThis.__storageTest.sql=sql;globalThis.__storageTest.args=args;return {rows:[{allowed:globalThis.__storageTest.allowed}]}}})}`,
 '@/lib/runtime/config':`export function requireServerEnv(name){return name==='AWS_REGION'?'ap-southeast-1':'test-bucket'}`,
 '@/lib/storage/s3':`export class S3ObjectStorage {async createSignedDownloadUrl(bucket,key,ttl){globalThis.__storageTest.signed++;globalThis.__storageTest.ttl=ttl;return 'signed-test-url'}}`,
};
const result=await build({entryPoints:['lib/storage/server.ts'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'test-boundaries',setup(b){b.onResolve({filter:/^@\//},a=>a.path in mocks?{path:a.path,namespace:'mock'}:undefined);b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}))}}]});
const {getAuthorizedEvidenceUrl}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
await assert.rejects(()=>getAuthorizedEvidenceUrl('someone/secret'),/Not authenticated/);
assert.equal(globalThis.__storageTest.signed,0);
globalThis.__storageTest.identity={id:'test-user'};
await assert.rejects(()=>getAuthorizedEvidenceUrl('someone/secret'),/not available/);
assert.equal(globalThis.__storageTest.signed,0);
globalThis.__storageTest.allowed=true;
assert.equal(await getAuthorizedEvidenceUrl('test-user/report/file'),'signed-test-url');
assert.deepEqual(globalThis.__storageTest.context,{userId:'test-user'});
assert.deepEqual(globalThis.__storageTest.args,['test-user/report/file']);
assert.match(globalThis.__storageTest.sql,/report_evidence/);
assert.match(globalThis.__storageTest.sql,/dispute_evidence/);
assert.equal(globalThis.__storageTest.ttl,900);
console.log('PASS anonymous denied; unauthorized denied before signing; authorized RLS context; parameterized key; 15-minute TTL');
