const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/fabric-cloth-3d.js'),'utf8');
const chapters=vm.runInNewContext(source.match(/const ambientJourneys=(\[[\s\S]*?\n  \]);/)[1]);
test('ambient chapters are bounded, purposeful and include judgment',()=>{
  assert.equal(chapters.length,1);
  assert.equal(JSON.stringify(chapters[0].ids),'[0,17,1,12]');
  for(const chapter of chapters){
    assert.ok(chapter.name.length>0);
    assert.equal(chapter.ids[0],0);
    assert.ok(chapter.ids.includes(17));
    assert.ok(chapter.ids.length+1<=8,'both suspension links fit shader capacity');
    assert.ok(chapter.ids.every(id=>![15,16,18,19].includes(id)));
  }
});
test('selected journeys take priority over the quiet ambient story',()=>{
  assert.match(source,/!journeyHoldUntil&&material\.uniforms\.uManualSignal\.value<0/);
  assert.match(source,/ambientChapter=\(ambientChapter\+1\)%ambientJourneys\.length/);
});
test('quiet points replace physical beads without changing silk density',()=>{
  assert.match(source,/uNodeMaxPx=\{value:3\}/);
  assert.doesNotMatch(source,/beadGeometry|beads\[i\]/);
  assert.match(source,/\.055\+activity\*\.48/);
});
