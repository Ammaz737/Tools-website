import assert from "node:assert/strict";
import test from "node:test";
import { extractPdfLayout, type PdfLayoutTextItem } from "../lib/pdf-layout";
const item=(str: string,x: number,y: number,width=40,font=12): PdfLayoutTextItem=>({str,width,transform:[font,0,0,font,x,y],fontName:"fixture"});

test("blank pages and whitespace-only text produce no fabricated rows",()=>{
  assert.deepEqual(extractPdfLayout([]),{rows:[],blocks:[],columnStarts:[],ignoredItems:0,warnings:[]});
  assert.equal(extractPdfLayout([item("   ",10,10)]).rows.length,0);
});
test("rows follow descending PDF baseline and cells follow horizontal geometry",()=>{
  const result=extractPdfLayout([item("bottom",10,40),item("right",120,100),item("left",10,100)]);
  assert.deepEqual(result.rows.map(row=>row.cells.map(cell=>cell.text)),[["left","right"],["bottom"]]);
  assert.equal(result.blocks.every(block=>block.type==="text"),true);
  assert.deepEqual(result.columnStarts,[]);
});
test("split glyph items join inside words and infer only geometric interword spaces",()=>{
  const result=extractPdfLayout([item("Hel",10,100,15),item("lo",25,100,10),item("world",40,100,25)]);
  assert.equal(result.rows[0].cells[0].text,"Hello world");
  assert.equal(result.rows[0].cells[0].width,55);
});
test("source Unicode and explicit multiple spaces remain intact",()=>{
  const result=extractPdfLayout([item("اردو",10,100,25),item("  ",35,100,8),item("🙂 é",43,100,25)]);
  assert.equal(result.rows[0].cells[0].text,"اردو  🙂 é");
});
test("repeated aligned rows form a table while words inside each cell stay together",()=>{
  const result=extractPdfLayout([
    item("Full",10,100,20),item("name",34,100,22),item("Amount",150,100,42),
    item("Ada",10,80,20),item("Lovelace",34,80,45),item("120",150,80,20),
    item("Grace Hopper",10,60,76),item("240",150,60,20),
  ]);
  assert.deepEqual(result.columnStarts,[10,150]);assert.equal(result.blocks.length,1);assert.equal(result.blocks[0].type,"table");
  assert.deepEqual(result.rows.map(row=>row.cells.map(cell=>[cell.text,cell.columnIndex])),[[["Full name",0],["Amount",1]],[["Ada Lovelace",0],["120",1]],[["Grace Hopper",0],["240",1]]]);
});
test("a single spaced phrase is never sufficient table evidence",()=>{
  const result=extractPdfLayout([item("One",10,100),item("phrase",150,100)]);
  assert.equal(result.blocks[0].type,"text");assert.deepEqual(result.columnStarts,[]);
});
test("ragged row between aligned table rows retains actual column index",()=>{
  const result=extractPdfLayout([item("Name",10,100),item("Price",150,100),item("Missing name",150,80),item("Other",10,60),item("10",150,60)]);
  assert.equal(result.blocks.length,1);assert.equal(result.blocks[0].type,"table");
  assert.deepEqual(result.rows[1].cells.map(cell=>[cell.text,cell.columnIndex]),[["Missing name",1]]);
});
test("following single-column prose and widely separated rows do not extend a table",()=>{
  const result=extractPdfLayout([item("A",10,100),item("B",150,100),item("C",10,80),item("D",150,80),item("Following prose",10,60),item("X",10,-200),item("Y",150,-200)]);
  assert.deepEqual(result.blocks.map(block=>block.type),["table","text","text"]);
  assert.equal(result.rows[2].cells[0].columnIndex,undefined);
});
test("unmatched ragged rows do not bridge table blocks",()=>{
  const result=extractPdfLayout([item("A",10,100),item("B",150,100),item("Unaligned",80,80),item("C",10,60),item("D",150,60)]);
  assert.equal(result.blocks.every(block=>block.type==="text"),true);
});
test("mixed font sizes and small baseline jitter preserve rows without merging separate lines",()=>{
  const result=extractPdfLayout([item("Heading",10,100,70,20),item("detail",90,99,30,10),item("Next line",10,85,70,10)]);
  assert.equal(result.rows.length,2);assert.equal(result.rows[0].fontSize,20);
  assert.deepEqual(result.rows[0].cells.map(cell=>cell.text),["Heading detail"]);
});
test("rotated mirrored nonfinite and pathological geometry are explicitly omitted",()=>{
  const rotated={...item("vertical",10,100),transform:[0,12,-12,0,10,100]};
  const mirrored={...item("mirror",10,100),transform:[-12,0,0,12,10,100]};
  const result=extractPdfLayout([rotated,mirrored,item("bad",NaN,100),item("huge",1e10,100),item("negative",10,100,-1),item("good",10,100)]);
  assert.equal(result.ignoredItems,5);assert.equal(result.rows[0].cells[0].text,"good");
  assert.ok(result.warnings.some(warning=>warning.includes("rotated")));assert.ok(result.warnings.some(warning=>warning.includes("malformed")));
});
test("overlapping fragments retain all text and never produce a negative cell width",()=>{
  const result=extractPdfLayout([item("left",10,100,30),item("overlap",35,100,40)]);
  assert.equal(result.rows[0].cells[0].text,"leftoverlap");assert.equal(result.rows[0].cells[0].width,65);
});
test("separate tables use local columns rather than unrelated page-wide anchors",()=>{
  const result=extractPdfLayout([item("A",10,100),item("B",100,100),item("C",10,80),item("D",100,80),item("E",200,0),item("F",300,0),item("G",200,-20),item("H",300,-20)]);
  assert.deepEqual(result.columnStarts,[10,100,200,300]);
  assert.deepEqual(result.blocks.map(block=>block.columnStarts),[[10,100],[200,300]]);
  assert.deepEqual(result.blocks[1].rows[0].cells.map(cell=>cell.columnIndex),[0,1]);
});
test("PDFjs synthetic whitespace spanning a table gutter never bridges adjacent cells",()=>{
  const result=extractPdfLayout([
    item("Item1",25,505,33.348),item(" ",58.348,505,121.652),item("125.00",180,505,36.696),
    item("Item2",25,475,33.348),item(" ",58.348,475,121.652),item("250.00",180,475,36.696),
    item("Item3",25,445,33.348),item(" ",58.348,445,121.652),item("375.00",180,445,36.696),
  ]);
  assert.equal(result.blocks.length,1);assert.equal(result.blocks[0].type,"table");
  assert.deepEqual(result.blocks[0].columnStarts,[25,180]);
  assert.deepEqual(result.rows.map(row=>row.cells.map(cell=>cell.text)),[["Item1","125.00"],["Item2","250.00"],["Item3","375.00"]]);
  assert.deepEqual(result.rows[1].cells.map(cell=>cell.columnIndex),[0,1]);
  assert.equal(result.ignoredItems,0);assert.deepEqual(result.warnings,[]);
});
test("gutter filtering preserves wide explicit spaces embedded in nonblank source items",()=>{
  const result=extractPdfLayout([item("A   B",40,720,100),item("end",150,720,20)]);
  assert.equal(result.rows[0].cells[0].text,"A   B end");
});

