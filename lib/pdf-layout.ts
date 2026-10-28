/** Conservative horizontal PDF text reconstruction. Geometry is in PDF user
 * coordinates (y increases upward). This is not an arbitrary PDF/RTL layout
 * engine: rotated/mirrored text is reported and omitted rather than misplaced.
 */
export interface PdfLayoutTextItem {
  str: string;
  width: number;
  transform: readonly number[];
  fontName?: string;
  height?: number;
}
export interface PdfLayoutCell {
  text: string;
  x: number;
  width: number;
  fontSize: number;
  columnIndex?: number;
}
export interface PdfLayoutRow { y: number; fontSize: number; cells: PdfLayoutCell[] }
export interface PdfLayoutBlock { type: "text" | "table"; rows: PdfLayoutRow[]; columnStarts: number[] }
export interface PdfPageLayout {
  rows: PdfLayoutRow[];
  blocks: PdfLayoutBlock[];
  columnStarts: number[];
  ignoredItems: number;
  warnings: string[];
}
interface Fragment { text: string; x: number; y: number; width: number; fontSize: number }
const MAX_ITEMS = 50_000;
const MAX_COORDINATE = 10_000_000;
const close = (a: number, b: number, font: number) => Math.abs(a - b) <= Math.max(2, Math.min(8, font * 0.6));

export function extractPdfLayout(items: readonly PdfLayoutTextItem[]): PdfPageLayout {
  let ignoredItems = Math.max(0, items.length - MAX_ITEMS);
  let unsupported = 0;
  const fragments: Fragment[] = [];
  for (const item of items.slice(0, MAX_ITEMS)) {
    if (!item || typeof item.str !== "string" || !item.str || !Array.isArray(item.transform) || item.transform.length < 6) { ignoredItems++; continue; }
    const [a, b, c, d, x, y] = item.transform;
    if (![a,b,c,d,x,y,item.width].every(Number.isFinite) || item.width < 0 || item.width > MAX_COORDINATE || Math.abs(x) > MAX_COORDINATE || Math.abs(y) > MAX_COORDINATE) { ignoredItems++; continue; }
    // Normal text matrices have negligible off-axis components. Font scale
    // comes from the matrix, not glyph height (which differs between fonts).
    const fontSize = Math.hypot(c, d);
    if (fontSize < 0.01 || fontSize > 10_000 || a <= 0 || d <= 0 || Math.abs(b) > Math.abs(a) * 0.02 || Math.abs(c) > Math.abs(d) * 0.02) { ignoredItems++; unsupported++; continue; }
    // PDF.js can synthesize one whitespace item spanning an entire column
    // gutter. It is geometry, not a glyph: retaining its width would erase
    // the gap between the actual nonblank cells. Narrow explicit spaces and
    // all whitespace inside nonblank text are still preserved verbatim.
    if (!item.str.trim() && item.width > Math.max(12, fontSize * 1.5)) continue;
    fragments.push({ text: item.str, x, y, width: item.width, fontSize });
  }
  fragments.sort((a,b)=>b.y-a.y || a.x-b.x);
  const groups: { y: number; fontSize: number; fragments: Fragment[] }[] = [];
  for (const fragment of fragments) {
    const previous = groups.at(-1);
    const tolerance = previous ? Math.max(1, Math.min(4, Math.min(previous.fontSize, fragment.fontSize) * 0.25)) : 0;
    if (previous && Math.abs(previous.y - fragment.y) <= tolerance) previous.fragments.push(fragment);
    else groups.push({ y: fragment.y, fontSize: fragment.fontSize, fragments: [fragment] });
  }
  const rows: PdfLayoutRow[] = groups.map(group=>{
    const cells: PdfLayoutCell[] = [];
    for (const fragment of group.fragments.sort((a,b)=>a.x-b.x)) {
      const previous = cells.at(-1);
      const gap = previous ? fragment.x - previous.x - previous.width : Infinity;
      const scale = previous ? Math.min(previous.fontSize, fragment.fontSize) : fragment.fontSize;
      if (!previous || gap > Math.max(12, scale * 1.5)) cells.push({ text: fragment.text, x: fragment.x, width: fragment.width, fontSize: fragment.fontSize });
      else {
        const separator = gap > scale * 0.18 && !/\s$/.test(previous.text) && !/^\s/.test(fragment.text) ? " " : "";
        previous.text += separator + fragment.text;
        previous.width = Math.max(previous.width, fragment.x + fragment.width - previous.x);
        previous.fontSize = Math.max(previous.fontSize, fragment.fontSize);
      }
    }
    return { y: group.y, fontSize: Math.max(...group.fragments.map(fragment=>fragment.fontSize)), cells };
  }).filter(row=>row.cells.some(cell=>cell.text.trim()));

  // A column anchor needs evidence from multiple multi-cell rows. A single
  // heavily spaced phrase or a prose row alone never establishes a table.
  let anchorLimitReached = false;
  const anchors: { x: number; font: number; rowIndexes: Set<number> }[] = [];
  rows.forEach((row,index)=>{
    if (row.cells.length < 2) return;
    for (const cell of row.cells) {
      let anchor = anchors.find(anchor=>close(anchor.x,cell.x,Math.min(anchor.font,cell.fontSize)));
      if (!anchor) { if (anchors.length >= 128) { anchorLimitReached = true; continue; } anchor={x:cell.x,font:cell.fontSize,rowIndexes:new Set()}; anchors.push(anchor); }
      anchor.rowIndexes.add(index);
    }
  });
  const columnStarts = anchors.filter(anchor=>anchor.rowIndexes.size >= 2).map(anchor=>anchor.x).sort((a,b)=>a-b);
  const matched = rows.map(row=>row.cells.map(cell=>columnStarts.findIndex(x=>close(x,cell.x,cell.fontSize))));
  const anchorRows = matched.map(indices=>columnStarts.length >= 2 && new Set(indices.filter(index=>index>=0)).size >= 2 && indices.every(index=>index>=0));
  const near = (a: number,b: number) => Math.abs(rows[a].y-rows[b].y) <= Math.max(rows[a].fontSize,rows[b].fontSize)*2.5;
  const blocks: PdfLayoutBlock[]=[];
  let cursor=0;
  while(cursor<rows.length){
    if(anchorRows[cursor]){
      let end=cursor;
      // Ragged cells are accepted only between two aligned anchor rows,
      // never by extending a table into following single-column prose.
      while(end+1<rows.length && near(end,end+1)){
        if(anchorRows[end+1]) { end++; continue; }
        if(end+2<rows.length && anchorRows[end+2] && near(end+1,end+2) && matched[end+1].every(index=>index>=0)) { end+=2; continue; }
        break;
      }
      if(end>cursor){
        const tableRows=rows.slice(cursor,end+1);
        const usedIndices = [...new Set(matched.slice(cursor,end+1).flat())].filter(index=>index>=0).sort((a,b)=>a-b);
        const localColumns = usedIndices.map(index=>columnStarts[index]);
        tableRows.forEach((row,index)=>row.cells.forEach((cell,i)=>{cell.columnIndex=usedIndices.indexOf(matched[cursor+index][i]);}));
        blocks.push({type:"table",rows:tableRows,columnStarts:localColumns});cursor=end+1;continue;
      }
    }
    blocks.push({type:"text",rows:[rows[cursor]],columnStarts:[]});cursor++;
  }
  const warnings: string[]=[];
  if(anchorLimitReached)warnings.push("Column inference limited to 128 candidate anchors; all text rows are retained.");
  if(unsupported)warnings.push(`${unsupported} rotated, mirrored or unsupported text item(s) omitted.`);
  if(items.length>MAX_ITEMS)warnings.push(`Only the first ${MAX_ITEMS} text items were inspected.`);
  if(ignoredItems>unsupported)warnings.push(`${ignoredItems-unsupported} empty, malformed or out-of-bounds item(s) omitted.`);
  return { rows,blocks,columnStarts,ignoredItems,warnings };
}



